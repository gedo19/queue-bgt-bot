import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { Telegraf, Markup } from 'telegraf';
import cors from 'cors';
import 'dotenv/config'
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const whiteListPath = path.join(__dirname, 'whiteList.json');

const BOT_TOKEN = process.env.BOT_TOKEN; // Ваш токен от @BotFather
const WEBAPP_URL = process.env.WEBAPP_URL; // URL вашего фронтенда (например, https://ваш-домен.ngrok-free.app)
const ADMIN_ID = process.env.ADMIN_ID.toString();

if (!BOT_TOKEN || !WEBAPP_URL) {
  console.error('Ошибка: Не заданы BOT_TOKEN или WEBAPP_URL в .env');
  process.exit(1);
}

// 1. Настройка Express и Socket.io
const app = express();
app.use(cors());

app.use(express.static(path.join(__dirname, 'client/dist')));

// 2. Любой запрос, который не API и не сокет, возвращает index.html (для React)
app.get('/{*any}', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});


const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // В продакшене лучше указать конкретный домен
    methods: ["GET", "POST"]
  }
});

// 2. Хранилище очереди (в памяти)
// Структура: [{ id: 123, username: 'user', firstName: 'Ivan' }, ...]
let queue = [];

// 3. Настройка Telegram Бота
const bot = new Telegraf(BOT_TOKEN);

bot.command('start', (ctx) => {
  ctx.reply(
    'Добро пожаловать.',
  );
});

bot.command('add', async (ctx) => {
  const WHITELIST = JSON.parse(await fs.readFile(whiteListPath, 'utf8'));
  // Проверка, что пишет админ
  if (ctx.from.id.toString() !== ADMIN_ID) return;
  const newId = ctx.message.text.split(' ')[1];

  if (newId) {
    WHITELIST.push(newId.toString());
    await fs.writeFile(whiteListPath, JSON.stringify(WHITELIST, null, 4))
    ctx.reply(`Пользователь ${newId} добавлен!`);
  }
});

// 4. Логика Socket.io
io.on('connection', (socket) => {
  // Отправляем текущую очередь новому подключившемуся
  socket.emit('updateQueue', queue);

  socket.on('join', async (user) => {
    const userIdStr = String(user.id);
    const WHITELIST = JSON.parse(await fs.readFile(whiteListPath, 'utf8'));
    if (WHITELIST.length > 0 && !WHITELIST.includes(userIdStr)) {
      // Можно отправить обратно ошибку или просто игнорировать
      socket.emit('error', 'Доступ запрещен: Вас нет в белом списке.');
      return;
    }
    // Проверка: есть ли пользователь уже в очереди
    if (!queue.find(u => u.id === user.id)) {
      queue.push(user);
      io.emit('updateQueue', queue); // Рассылаем всем обновленный список
    }
  });

  socket.on('leave', async (userId) => {
    const oldFirst = queue[0];

    // Удаляем ушедшего
    queue = queue.filter(u => u.id !== userId);

    const newFirst = queue[0];

    // Проверяем:
    // 1. Очередь не пуста (newFirst существует)
    // 2. Лидер действительно сменился (был кто-то другой или никого)
    // 3. Ушедший человек был именно ПЕРВЫМ (если ушел 5-й, первому писать не надо)

    if (newFirst && oldFirst && oldFirst.id === userId && newFirst.id !== oldFirst.id) {
      try {
        console.log(`Уведомляем пользователя ${newFirst.id} (${newFirst.username})`);
        bot.telegram.getUpdates()
        await bot.telegram.sendMessage(
          newFirst.id,
          `🚨 <b>Подошла твоя очередь!</b>`,
          { parse_mode: 'HTML' }
        );
      } catch (error) {
        // Частая ошибка: 403 Forbidden (пользователь заблокировал бота)
        console.error(`Не удалось отправить сообщение пользователю ${newFirst.id}:`, error.message);
      }
    }

    // Рассылаем всем новый список
    io.emit('updateQueue', queue);
  });
});

// Запуск
bot.launch();
const PORT = 3000;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
