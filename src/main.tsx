import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

if ('serviceWorker' in navigator && import.meta.env.VITE_DISABLE_FCM_SW_REGISTRATION !== 'true') {
  // Register Firebase messaging service worker for notifications only (online-only mode)
  navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' })
    .then((registration) => {
      console.log('Firebase messaging SW registered in main.tsx (online-only):', registration);

      // Check for updates periodically to ensure fresh service worker (online-only)
      setInterval(() => {
        registration.update();
      }, 60000);

      // Listen for service worker updates and force reload for fresh content
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('Firebase messaging SW updated, reloading for fresh content...');
              window.location.reload();
            }
          });
        }
      });
    })
    .catch((error) => {
      if (!error.message?.includes('StackBlitz')) {
        console.error('Firebase messaging SW registration failed in main.tsx:', error);
      }
    });
}

// Create root and render app
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
