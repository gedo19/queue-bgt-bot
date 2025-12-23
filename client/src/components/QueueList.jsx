import React, { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk'; // Импортируем SDK

function Countdown({ startTime, durationMinutes }) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!startTime) return;

      const endTime = startTime + (durationMinutes * 60 * 1000);
      const diff = endTime - Date.now();

      if (diff <= 0) {
        setTimeLeft('~скоро');
      } else {
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${m}м ${s.toString().padStart(2, '0')}с`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, durationMinutes]);

  if (!startTime) return <span className="text-muted small">Ожидание...</span>;

  // Красим в красный, если "скоро", иначе в зеленый/белый
  const isUrgent = timeLeft === '~скоро';
  return (
    <span className={`badge ${isUrgent ? 'bg-danger' : 'bg-success'} ms-2`}>
      {timeLeft || '...'}
    </span>
  );
}

export function QueueList({ queue, currentUserId }) {
  const openChat = (u) => {
    if (u.username) {
      WebApp.openTelegramLink(`https://t.me/${u.username}`);
    } else {
      // Пробуем открыть по ID (tg://user?id=...)
      // Примечание: Это сработает, только если настройки приватности
      // целевого пользователя позволяют находить его по ссылке.
      WebApp.openTelegramLink(`tg://user?id=${u.id}`);
    }
  };

  if (queue.length === 0) {
    return (
      <li className="list-group-item text-center text-muted py-4">
        Очередь пуста.
      </li>
    );
  }

  return (
    <>
      {queue.map((u, index) => {
        const isMe = u.id === currentUserId;
        const isFirst = index === 0;
        const hasUsername = !!u.username;

        return (
          <li
            key={u.id}
            className={`list-group-item d-flex justify-content-between align-items-center ${isMe ? 'active border-primary' : ''}`}
          >
            <div className="d-flex align-items-center flex-grow-1 overflow-hidden">
              <span className={`badge ${isFirst ? 'bg-warning text-dark' : 'bg-secondary'} me-2 rounded-pill flex-shrink-0`}>
                #{index + 1}
              </span>

              <div className="text-truncate">
                {!isMe ? (
                  <button
                    className="btn btn-link p-0 text-decoration-none fw-bold me-2 text-start text-truncate"
                    style={{ color: 'inherit', maxWidth: '100%' }}
                    onClick={() => openChat(u)} // Передаем весь объект u
                  >
                    {u.firstName} <small className="opacity-75">
                    {/* Показываем ник или заглушку */}
                    {u.username ? `(@${u.username})` : ''} ↗
                  </small>
                  </button>
                ) : (
                  // Для себя оставляем просто текст
                  <span className="fw-bold me-2">
                    {u.firstName} {u.username ? `(@${u.username})` : ''}
                  </span>
                )}

                {/* Показываем таймер ТОЛЬКО для первого */}
                {isFirst && (
                  <Countdown startTime={u.startTime} durationMinutes={u.duration} />
                )}

                {/* Для остальных показываем сколько они заявили времени */}
                {!isFirst && u.duration && (
                  <span className="badge bg-secondary opacity-50 ms-1" style={{fontSize: '0.7em'}}>
                     {u.duration} мин
                   </span>
                )}
              </div>
            </div>

            {isMe && <span className="badge bg-light text-dark ms-2 flex-shrink-0">Вы</span>}
          </li>
        );
      })}
    </>
  );
}
