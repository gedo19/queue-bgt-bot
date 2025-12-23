import { config } from '../config.js';
import { whitelistService } from '../services/store.js';

export function setupBot(bot) {
  bot.command('start', (ctx) => {
    ctx.reply('Добро пожаловать! Открой Mini App, чтобы записаться.');
  });

  bot.command('add', async (ctx) => {
    // Проверка прав админа
    if (ctx.from.id.toString() !== config.ADMIN_ID) return;

    const newId = ctx.message.text.split(' ')[1];
    if (newId) {
      await whitelistService.add(newId.toString());
      ctx.reply(`✅ Пользователь ${newId} добавлен в белый список.`);
    } else {
      ctx.reply('❌ Укажите ID. Пример: /add 123456789');
    }
  });

  // Обработка ошибок бота, чтобы он не падал
  bot.catch((err, ctx) => {
    console.error(`Произошла ошибка во время ${ctx.updateType}`, err);
  });
}
