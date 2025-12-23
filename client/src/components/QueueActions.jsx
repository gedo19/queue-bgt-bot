import React, { useState } from 'react';

export function QueueActions({ isInQueue, onJoin, onLeave }) {
  const [duration, setDuration] = useState('');

  const handleJoinClick = () => {
    // Если пусто, отправляем null (бэк подставит 30), иначе число
    onJoin(duration ? parseInt(duration) : null);
  };

  if (isInQueue) {
    return (
      <button className="btn btn-danger btn-lg shadow w-100" onClick={onLeave}>
        Выйти из очереди
      </button>
    );
  }

  return (
    <div className="d-flex gap-2">
      {/* Поле ввода (15% места, но не меньше 70px) */}
      <div style={{ width: '20%', minWidth: '70px' }}>
        <input
          type="number"
          className="form-control form-control-lg text-center px-1"
          placeholder="30"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          aria-label="Минуты"
        />
      </div>

      {/* Кнопка занимает остальное место */}
      <button
        className="btn btn-primary btn-lg shadow flex-grow-1"
        onClick={handleJoinClick}
      >
        Встать в очередь {duration ? `(${duration} мин)` : ''}
      </button>
    </div>
  );
}
