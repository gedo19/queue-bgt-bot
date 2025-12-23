import React, { useState, useEffect } from 'react';

export function QueueActions({ isInQueue, onJoin, onLeave }) {
  const [duration, setDuration] = useState('');
  const [targetTime, setTargetTime] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (isInQueue) {
      setDuration('');
      setTargetTime('');
      setDescription('');
    }
  }, [isInQueue]);

  const handleJoinClick = () => {
    let targetTimestamp = null;

    if (targetTime) {
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
      description,
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
    <div className="d-flex flex-column gap-2">
      <input
        type="text"
        className="form-control"
        placeholder="Комментарий (необязательно)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={60}
      />

      <div className="d-flex gap-2">
        <div style={{ width: '25%', minWidth: '70px' }}>
          <input
            type="number"
            className="form-control form-control-lg text-center px-1"
            placeholder="30"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </div>

        {/* Поле Время */}
        <div style={{ width: '25%', minWidth: '70px' }}>
          <input
            type="time"
            className="form-control form-control-lg text-center px-0"
            value={targetTime}
            onChange={(e) => setTargetTime(e.target.value)}
          />
        </div>

        {/* Кнопка */}
        <button
          className="btn btn-primary btn-lg shadow flex-grow-1"
          onClick={handleJoinClick}
        >
          {targetTime ? `К ${targetTime}` : 'В очередь'}
        </button>
      </div>
    </div>
  );
}
