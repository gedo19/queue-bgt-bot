import fs from 'fs/promises';
import { WHITELIST_PATH } from '../config.js';

// Хранилище в памяти
let queue = [];

export const queueService = {
  get: () => [...queue],

  markAsBookingWarned: (userId) => {
    const u = queue.find(x => x.id === userId);
    if (u) u.notifiedBookingWarning = true;
  },

  // Теперь принимаем объект с duration
  add: (user, durationMin = 30, targetTimestamp = null) => {
    if (!queue.find(u => u.id === user.id)) {
      const newUser = {
        ...user,
        duration: durationMin,     // Сколько минут попросил
        startTime: null,           // Когда начал (для 1-го места)
        notifiedTimeout: false,    // Чтобы не спамить уведомлениями
        targetTime: targetTimestamp,
        notifiedBookingWarning: false,
      };

      // Если очередь была пуста, этот юзер сразу становится первым -> засекаем время
      if (queue.length === 0) {
        newUser.startTime = Date.now();
        queue.push(newUser);
        return true;
      }

      if (!targetTimestamp) {
        queue.push(newUser);
        return true;
      }

      // ЕСЛИ ВРЕМЯ УКАЗАНО -> Ищем место вставки
      // Мы не можем сместить лидера (index 0), поэтому начинаем поиск места после него
      // Нам нужно найти индекс i, после которого мы встанем.

      const now = Date.now();
      let accumulatedTimeMs = 0;

      // Если у текущего лидера (index 0) уже идет время, учитываем остаток?
      // Для простоты считаем: от сейчас + длительность всех перед нами.

      let insertIndex = queue.length; // По умолчанию в конец

      // Проходим по очереди, начиная с лидера
      for (let i = 0; i < queue.length; i++) {
        const u = queue[i];

        // Сколько этот юзер займет времени?
        // Если это текущий лидер и он уже начал, можно посчитать точнее,
        // но для планирования берем полную duration или остаток.
        // Упрощение: считаем duration
        accumulatedTimeMs += u.duration * 60 * 1000;

        const predictedFinishTime = now + accumulatedTimeMs;

        // ЛОГИКА:
        // Если (Сейчас + Очередь до i включительно) <= НашеЦелевоеВремя
        // Значит мы можем встать ПОСЛЕ i-го пользователя.
        if (predictedFinishTime <= targetTimestamp) {
          // Мы можем встать после i, но проверим следующего, вдруг и там успеваем?
          // Поэтому просто идем дальше, а insertIndex будет обновляться
          insertIndex = i + 1;
        } else {
          // Как только мы превысили лимит - дальше проверять нет смысла,
          // мы уже не влезаем раньше. Останавливаемся.
          break;
        }
      }

      // Защита: Нельзя встать на место 0 (сместить текущего),
      // но insertIndex начинается с поиска после 0, так что все ок.
      // Если insertIndex == queue.length, значит splice добавит в конец.

      queue.splice(insertIndex, 0, newUser);
      return true;
    }
    return false;
  },

  remove: (userId) => {
    const previousQueue = [...queue];
    queue = queue.filter(u => u.id !== userId);

    const newFirst = queue[0];

    // Если появился новый лидер, засекаем ему время
    if (newFirst && (!previousQueue[0] || previousQueue[0].id !== newFirst.id)) {
      // Важно: если он уже был в очереди, startTime у него null, ставим сейчас
      if (!newFirst.startTime) {
        newFirst.startTime = Date.now();
      }
    }

    return {
      success: previousQueue.length !== queue.length,
      oldFirst: previousQueue[0],
      newFirst: queue[0]
    };
  },

  // Метод для чекера таймеров (чтобы менять флаг notifiedTimeout)
  markAsNotified: (userId) => {
    const user = queue.find(u => u.id === userId);
    if (user) user.notifiedTimeout = true;
  }
};

export const whitelistService = {
  get: async () => {
    try {
      const data = await fs.readFile(WHITELIST_PATH, 'utf8');
      return JSON.parse(data);
    } catch (e) {
      // Если файла нет, возвращаем пустой массив
      return [];
    }
  },

  add: async (userId) => {
    const list = await whitelistService.get();
    if (!list.includes(userId)) {
      list.push(userId);
      await fs.writeFile(WHITELIST_PATH, JSON.stringify(list, null, 4));
      return true;
    }
    return false;
  },

  check: async (userId) => {
    const list = await whitelistService.get();
    // Если список пуст — пускаем всех (логика из старого кода)
    if (list.length === 0) return true;
    return list.includes(String(userId));
  }
};
