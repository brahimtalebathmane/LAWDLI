import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Unregister any existing service workers and register Firebase messaging service worker
if ('serviceWorker' in navigator) {
  // First unregister any existing service workers to prevent caching issues
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      if (registration.scope.includes('firebase-messaging-sw.js')) {
        // Keep Firebase messaging SW, just update it
        return;
      }
      registration.unregister();
    });
  }).then(() => {
    // Register Firebase messaging service worker
    return navigator.serviceWorker.register('/firebase-messaging-sw.js');
  })
    .then((registration) => {
      console.log('Firebase SW registered: ', registration);
    })
    .catch((registrationError) => {
      console.log('Firebase SW registration failed: ', registrationError);
    });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
