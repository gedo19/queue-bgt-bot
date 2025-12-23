import React from 'react';

export function StatusAlert({ isFirst, hasStartTime }) {
  if (!isFirst) return null;

  if (!hasStartTime) {
    return (
      <div className="alert alert-info d-flex align-items-center animate__animated animate__fadeIn" role="alert">
        <span className="fs-4 me-2">🔥</span>
        <div>
          <strong>Время твоей очереди ещё не наступило!</strong>
        </div>
      </div>
    );
  }

  return (
    <div className="alert alert-primary d-flex align-items-center animate__animated animate__fadeIn" role="alert">
      <span className="fs-4 me-2">🔥</span>
      <div>
        <strong>Подошла твоя очередь!</strong>
      </div>
    </div>
  );
}
