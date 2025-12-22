import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import WebApp from '@twa-dev/sdk';

const socket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:3000');

function App() {
  const [queue, setQueue] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    WebApp.ready();

    // Принудительно расширяем на весь экран и красим хедер в черный (для красоты в Telegram)
    WebApp.expand();
    WebApp.setHeaderColor('#212529'); // Цвет bg-dark из bootstrap

    if (WebApp.initDataUnsafe.user) {
      setUser(WebApp.initDataUnsafe.user);
    } else {
      // Тестовый юзер для браузера
      setUser({ id: 111, first_name: 'TestUser', username: 'tester' });
    }

    socket.on('updateQueue', (newQueue) => {
      setQueue(newQueue);
    });

    return () => {
      socket.off('updateQueue');
    };
  }, []);

  const handleJoin = () => {
    if (user) {
      socket.emit('join', {
        id: user.id,
        firstName: user.first_name,
        username: user.username
      });
    }
  };

  const handleLeave = () => {
    if (user) {
      socket.emit('leave', user.id);
    }
  };

  const isInQueue = user && queue.some(u => u.id === user.id);
  const isFirst = user && queue.length > 0 && queue[0].id === user.id;

  // Оборачиваем все в контейнер с тёмной темой
  return (
    <div className="min-vh-100 bg-dark text-light py-3" data-bs-theme="dark">
      <div className="container">
        <h1 className="text-center mb-4">📋 Очередь</h1>

        {isFirst && (
          <div className="alert alert-primary d-flex align-items-center" role="alert">
            <span className="fs-4 me-2">🔥</span>
            <div>
              <strong>Поздравляем!</strong> Вы первый в очереди!
            </div>
          </div>
        )}

        <div className="card mb-4 shadow-sm border-secondary">
          <div className="card-header bg-secondary text-white">
            Текущий список
          </div>
          <ul className="list-group list-group-flush">
            {queue.length === 0 ? (
              <li className="list-group-item text-center text-muted py-4">
                Очередь пуста, будьте первым!
              </li>
            ) : (
              queue.map((u, index) => {
                const isMe = u.id === user?.id;
                return (
                  <li
                    key={u.id}
                    className={`list-group-item d-flex justify-content-between align-items-center ${isMe ? 'active border-primary' : ''}`}
                    // Для активного элемента в Bootstrap active дает синий фон,
                    // если хотите просто выделить, можно использовать bg-dark + border
                  >
                    <div>
                      <span className={`badge ${index === 0 ? 'bg-warning text-dark' : 'bg-secondary'} me-2 rounded-pill`}>
                        #{index + 1}
                      </span>
                      <span className="fw-bold">
                        {u.firstName} {u.username ? `(@${u.username})` : ''}
                      </span>
                    </div>
                    {isMe && <span className="badge bg-light text-dark">Вы</span>}
                  </li>
                );
              })
            )}
          </ul>
        </div>

        <div className="d-grid gap-2 fixed-bottom p-3 bg-dark border-top border-secondary">
          {!isInQueue ? (
            <button className="btn btn-primary btn-lg shadow" onClick={handleJoin}>
              Встать в очередь
            </button>
          ) : (
            <button className="btn btn-danger btn-lg shadow" onClick={handleLeave}>
              Выйти из очереди
            </button>
          )}
        </div>
        {/* Добавляем отступ снизу, чтобы кнопка fixed-bottom не перекрывала контент */}
        <div style={{ height: '80px' }}></div>
      </div>
    </div>
  );
}

export default App;
