import React, { useState } from 'react';

export function QueueActions({ isInQueue, onJoin, onLeave }) {
  const [duration, setDuration] = useState('');
  const [targetTime, setTargetTime] = useState(''); // "17:00"

  const handleJoinClick = () => {
    let targetTimestamp = null;

    if (targetTime) {
      // 1. Берем текущую дату пользователя
      const now = new Date();
      const [hours, minutes] = targetTime.split(':').map(Number);

      // 2. Создаем объект даты с нужным временем
      const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);

      // 3. Если выбранное время уже прошло сегодня (например, сейчас 18:00, а выбрали 17:00),
      // значит пользователь имеет в виду ЗАВТРА.
      if (targetDate < now) {
        targetDate.setDate(targetDate.getDate() + 1);
      }

      targetTimestamp = targetDate.getTime();
    }

    // Если пусто, отправляем null (бэк подставит 30), иначе число
    onJoin(
      duration ? parseInt(duration) : null,
      targetTimestamp,
    );
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

      {/* 2. Поле Время (15%) - НОВОЕ */}
      <div style={{ width: '15%', minWidth: '70px' }}>
        <input
          type="time"
          className="form-control form-control-lg text-center px-0"
          value={targetTime}
          onChange={(e) => setTargetTime(e.target.value)}
          aria-label="Время записи"
        />
      </div>

      {/* 3. Кнопка */}
      <button
        className="btn btn-primary btn-lg shadow flex-grow-1"
        onClick={handleJoinClick}
      >
        {targetTime ? `К ${targetTime}` : 'В очередь'}
      </button>
    </div>
  );
}
