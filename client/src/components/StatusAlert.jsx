import React from 'react';

export function StatusAlert({ isFirst }) {
  if (!isFirst) return null;

  return (
    <div className="alert alert-primary d-flex align-items-center animate__animated animate__fadeIn" role="alert">
      <span className="fs-4 me-2">🔥</span>
      <div>
        <strong>Подошла твоя очередь!</strong>
      </div>
    </div>
  );
}
