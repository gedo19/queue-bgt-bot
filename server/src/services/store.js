import fs from 'fs/promises';
import { WHITELIST_PATH } from '../config.js';

// Хранилище в памяти
let queue = [];

export const queueService = {
  get: () => [...queue],

  // Теперь принимаем объект с duration
  add: (user, durationMin = 30) => {
    if (!queue.find(u => u.id === user.id)) {
      const newUser = {
        ...user,
        duration: durationMin,     // Сколько минут попросил
        startTime: null,           // Когда начал (для 1-го места)
        notifiedTimeout: false     // Чтобы не спамить уведомлениями
      };

      // Если очередь была пуста, этот юзер сразу становится первым -> засекаем время
      if (queue.length === 0) {
        newUser.startTime = Date.now();
      }

      queue.push(newUser);
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
