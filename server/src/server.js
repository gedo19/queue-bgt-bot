import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { Telegraf } from 'telegraf';
import cors from 'cors';

import { config, CLIENT_DIST_PATH } from './config.js';
import { setupBot } from './handlers/bot.js';
import { setupSocket } from './handlers/socket.js';

// Инициализация
const app = express();
const httpServer = createServer(app);
const bot = new Telegraf(config.BOT_TOKEN);

// Настройка Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.static(CLIENT_DIST_PATH));

// Логика приложения (подключаем наши модули)
setupBot(bot);
setupSocket(io, bot);

// Fallback для React Router (SPA)
app.get(/.*/, (req, res) => {
  res.sendFile(CLIENT_DIST_PATH + '/index.html');
});

// Запуск
async function start() {
  try {
    // Запускаем бота (без await, чтобы не блочить сервер, или используем webhook)
    bot.launch(() => console.log('🤖 Bot started'));

    httpServer.listen(config.PORT, () => {
      console.log(`🚀 Server running on port ${config.PORT}`);
    });

    // Graceful stop
    const stop = (signal) => {
      console.log(`Stopping on ${signal}...`);
      bot.stop(signal);
      httpServer.close();
      process.exit(0);
    };
    process.once('SIGINT', () => stop('SIGINT'));
    process.once('SIGTERM', () => stop('SIGTERM'));

  } catch (e) {
    console.error('Start error:', e);
  }
}

start();
