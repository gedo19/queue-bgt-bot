import { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import { socket } from '../services/socket';


export function useQueue(user) {
  const [queue, setQueue] = useState([]);
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onUpdateQueue(newQueue) {
      setQueue(newQueue);
    }

    function onError(message) {
      if(WebApp.HapticFeedback) {
        WebApp.HapticFeedback.notificationOccurred('error');
      }

      WebApp.showAlert(message);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('updateQueue', onUpdateQueue);
    socket.on('error', onError);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('updateQueue', onUpdateQueue);
      socket.on('error', onError);
    };
  }, []);

  const joinQueue = (duration, targetTime, description) => {
    if (user) {
      socket.emit('join', {
        user: {
          id: user.id,
          firstName: user.first_name,
          username: user.username
        },
        duration: duration,
        targetTime: targetTime,
        description: description
      });
    }
  };

  const leaveQueue = () => {
    if (user) {
      socket.emit('leave', user.id);
    }
  };

  // Вычисляемые свойства
  const isInQueue = user && queue.some(u => u.id === user.id);
  const isFirst = user && queue.length > 0 && queue[0].id === user.id;
  const myPosition = user ? queue.findIndex(u => u.id === user.id) + 1 : 0;

  return {
    queue,
    isConnected,
    joinQueue,
    leaveQueue,
    isInQueue,
    isFirst,
    myPosition
  };
}
