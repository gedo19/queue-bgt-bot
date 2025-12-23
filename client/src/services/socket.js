import io from 'socket.io-client';

const URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

// Создаем сокет, но пока не подключаем (autoConnect: false полезно для контроля)
// или оставляем по умолчанию, если хотим сразу коннект.
export const socket = io(URL, {
  autoConnect: true,
  // В будущем сюда добавим auth: { initData }
});
