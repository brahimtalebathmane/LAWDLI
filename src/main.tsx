import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

async function registerFirebaseSW() {
  if ('serviceWorker' in navigator) {
    try {
      // Register only Firebase messaging service worker
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });
      console.log('Firebase SW registered:', registration);

      // Optional: check for updates periodically
      setInterval(() => registration.update(), 60000); // every 1 min
    } catch (err) {
      console.error('Firebase SW registration failed:', err);
    }
  }
}

// Start SW registration
registerFirebaseSW();

// Render React App
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);