import React from 'react';
import { useTelegram } from './hooks/useTelegram';
import { useQueue } from './hooks/useQueue';
import { QueueList } from './components/QueueList';
import { QueueActions } from './components/QueueActions';
import { StatusAlert } from './components/StatusAlert';

function App() {
  const { user, haptic } = useTelegram();
  const {
    queue,
    joinQueue,
    leaveQueue,
    isInQueue,
    isFirst,
  } = useQueue(user);

  // Обертки с вибрацией
  const handleJoin = (duration, targetTime, description) => {
    haptic();
    joinQueue(duration, targetTime, description);
  };

  const handleLeave = () => {
    haptic();
    leaveQueue();
  };

  if (!user) return <div className="text-center text-light mt-5">Загрузка...</div>;

  return (
    <div className="min-vh-100 bg-dark text-light py-3" data-bs-theme="dark">
      <div className="container">
        <h1 className="text-center mb-4">📋 Очередь</h1>

        <StatusAlert isFirst={isFirst} hasStartTime={queue[0]?.startTime} />

        <div className="card mb-4 shadow-sm border-secondary">
          <div className="card-header bg-secondary text-white">
            Текущий список ({queue.length})
          </div>
          <ul className="list-group list-group-flush">
            <QueueList queue={queue} currentUserId={user.id} />
          </ul>
        </div>

        <div className="fixed-bottom p-3 bg-dark border-top border-secondary">
          <QueueActions
            isInQueue={isInQueue}
            onJoin={handleJoin}
            onLeave={handleLeave}
          />
        </div>

        {/* Spacer для fixed-bottom */}
        <div style={{ height: '80px' }}></div>
      </div>
    </div>
  );
}

export default App;
