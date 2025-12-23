import { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';

export function useTelegram() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    WebApp.ready();
    WebApp.expand();

    // Настраиваем цвета под тему (опционально)
    try {
      WebApp.setHeaderColor('#212529');
    } catch (e) {
      console.log('Header color not supported');
    }

    if (WebApp.initDataUnsafe?.user) {
      setUser(WebApp.initDataUnsafe.user);
    } else {
      // Mock-юзер для разработки в браузере
      const n = Math.floor(Math.random() * 10) + 1;
      if (n <= 5) setUser({ id: 111, first_name: 'TestUser 1', username: 'tester1' });
      if (n > 5 && n <= 10) setUser({ id: 222, first_name: 'TestUser 2', username: 'tester2' });
    }
  }, []);

  return {
    tg: WebApp,
    user,
    // Утилита для вибрации при клике (улучшает UX)
    haptic: () => {
      if(WebApp.HapticFeedback) {
        WebApp.HapticFeedback.impactOccurred('light');
      }
    }
  };
}
