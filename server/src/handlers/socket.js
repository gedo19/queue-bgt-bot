import { queueService, whitelistService } from '../services/store.js';

export function setupSocket(io, bot) {
  setInterval(async () => {
    const queue = queueService.get();
    const currentLeader = queue[0];

    if (currentLeader && currentLeader.startTime && !currentLeader.notifiedTimeout) {
      const elapsed = Date.now() - currentLeader.startTime;
      const limit = currentLeader.duration * 60 * 1000; // минуты -> мс

      if (elapsed >= limit) {
        // Время вышло!
        queueService.markAsNotified(currentLeader.id); // Ставим галочку, чтобы не слать повторно

        try {
          await bot.telegram.sendMessage(
            currentLeader.id,
            `⏳ <b>Твое время (${currentLeader.duration} мин) истекло!</b>\nПожалуйста, освободи очередь, если ты закончил.`,
            { parse_mode: 'HTML' }
          );
        } catch (e) {
          console.error(`Не удалось отправить уведомление тайм-аута юзеру ${currentLeader.id}`);
        }
      }
    }
  }, 59000); // Каждую минуту


  io.on('connection', (socket) => {
    // 1. При подключении сразу шлем текущее состояние
    socket.emit('updateQueue', queueService.get());

    // 2. Вход в очередь
    socket.on('join', async (payload) => {
      const { user, duration } = payload;
      const isAllowed = await whitelistService.check(user.id);

      if (!isAllowed) {
        socket.emit('error', 'Доступ запрещен: Вас нет в белом списке.');
        return;
      }

      // Передаем duration в сервис (или 30 по дефолту)
      const minutes = parseInt(duration) || 30;

      if (queueService.add(user, minutes)) {
        io.emit('updateQueue', queueService.get());
      }
    });

    // 3. Выход из очереди
    socket.on('leave', async (userId) => {
      const result = queueService.remove(userId);

      if (result.success) {
        // Уведомляем всех об изменении
        io.emit('updateQueue', queueService.get());

        // Проверяем смену лидера для уведомления
        const { oldFirst, newFirst } = result;

        // Логика: Был лидер, он ушел (или кто-то перед ним), теперь новый лидер
        // Важно: проверяем, что ушедший (userId) был именно старым лидером (oldFirst.id)
        if (newFirst && oldFirst && oldFirst.id === userId && newFirst.id !== oldFirst.id) {
          notifyNewLeader(bot, newFirst);
        }
      }
    });
  });
}

async function notifyNewLeader(bot, user) {
  try {
    console.log(`🔔 Уведомляем нового лидера: ${user.id} (${user.username})`);
    await bot.telegram.sendMessage(
      user.id,
      `🚨 <b>Подошла твоя очередь!</b>`,
      { parse_mode: 'HTML' }
    );
  } catch (error) {
    console.error(`Не удалось отправить сообщение юзеру ${user.id}:`, error.message);
  }
}
