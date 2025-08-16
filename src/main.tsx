import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

if ('serviceWorker' in navigator && import.meta.env.VITE_DISABLE_FCM_SW_REGISTRATION !== 'true') {
  // Register Firebase messaging service worker
  navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' })
    .then((registration) => {
      console.log('Firebase SW registered in main.tsx:', registration);

      // Check for updates periodically (every 60s)
      setInterval(() => {
        registration.update();
      }, 60000);

      // Listen for updates to the SW
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('Firebase SW updated, reloading...');
              window.location.reload();
            }
          });
        }
      });
    })
    .catch((error) => {
      if (!error.message?.includes('StackBlitz')) {
        console.error('Firebase SW registration failed in main.tsx:', error);
      }
    });
}

// Create root and render app
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
