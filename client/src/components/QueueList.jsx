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

        return (
          <li
            key={u.id}
            className={`list-group-item d-flex justify-content-between align-items-center ${isMe ? 'active border-primary' : ''}`}
          >
            <div className="d-flex align-items-center flex-grow-1 overflow-hidden">
              {/* Номер очереди (слева, фиксирован) */}
              <span className={`badge ${isFirst ? 'bg-warning text-dark' : 'bg-secondary'} me-3 rounded-pill flex-shrink-0 align-self-start mt-1`}>
                #{index + 1}
              </span>

              {/* Блок контента: Имя сверху, Инфо снизу */}
              <div className="d-flex flex-column overflow-hidden w-100">

                {/* 1. Верхняя строка: Имя */}
                <div className="text-truncate mb-1">
                  {!isMe ? (
                    <button
                      className="btn btn-link p-0 text-decoration-none fw-bold text-start text-truncate w-100"
                      style={{ color: 'inherit' }}
                      onClick={() => openChat(u)}
                    >
                      {u.firstName} <small className="opacity-75">{u.username ? `(@${u.username})` : ''} ↗</small>
                    </button>
                  ) : (
                    <span className="fw-bold">
                      {u.firstName} {u.username ? `(@${u.username})` : ''}
                    </span>
                  )}
                </div>

                {/* 2. Нижняя строка: Бейджи и таймеры */}
                <div className="d-flex flex-wrap gap-1 align-items-center">

                  {/* Таймер для первого */}
                  {isFirst && (
                    <Countdown startTime={u.startTime} durationMinutes={u.duration} />
                  )}

                  {/* Длительность (для всех) */}
                  {!isFirst && u.duration && (
                    <span className="badge bg-secondary opacity-50" style={{fontSize: '0.75em'}}>
                       ⏳ {u.duration} мин
                     </span>
                  )}

                  {/* Время брони (если есть) */}
                  {u.targetTime && (
                    <span className="badge bg-info text-dark" style={{fontSize: '0.75em'}}>
                        🕒 {new Date(u.targetTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  )}
                </div>

              </div>
            </div>

            {/* Метка "Вы" (справа) */}
            {isMe && <span className="badge bg-light text-dark ms-2 flex-shrink-0 align-self-start mt-1">Вы</span>}
          </li>
        );
      })}
    </>
  );
}
