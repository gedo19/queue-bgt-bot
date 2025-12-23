import fs from 'fs/promises';
import { WHITELIST_PATH } from '../config.js';

// Хранилище в памяти
let queue = [];

function resolveStartTime(user) {
  if (!user.targetTime) return Date.now();

  if (user.targetTime <= Date.now()) return Date.now();

  return null;
}

export const queueService = {
  get: () => [...queue],

  markAsBookingWarned: (userId) => {
    const u = queue.find(x => x.id === userId);
    if (u) u.notifiedBookingWarning = true;
  },

  add: (user, durationMin = 30, targetTimestamp = null, description) => {
    if (!queue.find(u => u.id === user.id)) {
      const now = Date.now();
      const newUser = {
        ...user,
        duration: durationMin,
        startTime: null,
        notifiedTimeout: false,
        targetTime: targetTimestamp,
        notifiedBookingWarning: false,
        description: description || '',
      };

      if (queue.length === 0) {
        newUser.startTime = resolveStartTime(newUser);
        queue.push(newUser);
        return true;
      }

      if (queue.length === 1 && !targetTimestamp) {
        const leader = queue[0];

        // Лидер ждет конкретного времени?
        if (leader.targetTime && leader.targetTime > now) {
          const myFinishTime = now + (durationMin * 60 * 1000);

          // Мы успеваем до его старта?
          if (myFinishTime <= leader.targetTime) {
            // ДА! Мы становимся новым лидером.
            // Старый лидер (который ждет) остается вторым, его startTime пока не нужен.

            newUser.startTime = now; // Мы начинаем прямо сейчас
            queue.unshift(newUser);  // Вставляем в начало (индекс 0)
            return true;
          }
        }
      }

      if (!targetTimestamp) {
        queue.push(newUser);
        return true;
      }

      let accumulatedTimeMs = 0;
      let insertIndex = queue.length;

      // Проходим по очереди, начиная с лидера
      for (let i = 0; i < queue.length; i++) {
        const u = queue[i];
        accumulatedTimeMs += u.duration * 60 * 1000;
        const predictedFinishTime = now + accumulatedTimeMs;

        if (predictedFinishTime <= targetTimestamp) {
          insertIndex = i + 1;
        } else {
          break;
        }
      }

      queue.splice(insertIndex, 0, newUser);
      return true;
    }
    return false;
  },

  remove: (userId) => {
    const previousQueue = [...queue];

    // 1. Находим и удаляем уходящего
    const indexToRemove = queue.findIndex(u => u.id === userId);
    if (indexToRemove === -1) {
      return { success: false };
    }

    const wasFirst = (indexToRemove === 0);
    queue.splice(indexToRemove, 1);

    // -------------------------------------------------------------------------
    // ФИЧА №2 (Enhanced): Поиск любого подходящего кандидата
    // Работает, если ушел Первый и очередь не пуста.
    // -------------------------------------------------------------------------

    if (wasFirst && queue.length > 0) {
      const newLeader = queue[0];
      const now = Date.now();

      // Проверяем, является ли новый лидер "Ждуном"
      if (newLeader.targetTime && newLeader.targetTime > now) {

        // Вычисляем доступное окно времени
        const gapMs = newLeader.targetTime - now;

        // Ищем кандидата, начиная со второго человека (индекс 1)
        // Критерии:
        // 1. Нет привязки ко времени (!u.targetTime) - чтобы не ломать его планы
        // 2. Его длительность влезает в окно

        const candidateIndex = queue.findIndex((u, idx) => {
          if (idx === 0) return false; // Пропускаем самого лидера
          if (u.targetTime) return false; // Игнорируем других "ждунов"

          const durationMs = u.duration * 60 * 1000;
          return durationMs <= gapMs;
        });

        // Если нашли подходящего
        if (candidateIndex !== -1) {
          // Вырезаем его из текущей позиции
          const [luckyUser] = queue.splice(candidateIndex, 1);

          // Вставляем в самое начало
          queue.unshift(luckyUser);

          // Ему начинаем отсчет прямо сейчас
          queue[0].startTime = now;

          // "Ждун" сместился на index 1, его startTime пока null
          if (queue[1]) queue[1].startTime = null;
        }
      }
    }

    // -------------------------------------------------------------------------
    // Инициализация (если перестановок не было или после перестановки)
    // -------------------------------------------------------------------------

    if (queue.length > 0) {
      const leader = queue[0];
      // Если у первого нет времени старта - ставим сейчас.
      if (!leader.startTime) {
        leader.startTime = resolveStartTime(leader);
      }
    }

    return {
      success: true,
      oldFirst: previousQueue[0],
      newFirst: queue[0]
    };
  },

  startTimerForLeader: (timestamp) => {
    if (queue.length > 0) {
      queue[0].startTime = timestamp;
    }
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
