import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Unregister any existing service workers and register Firebase messaging service worker
if ('serviceWorker' in navigator) {
  // Register Firebase messaging service worker with enhanced options
  navigator.serviceWorker.register('/firebase-messaging-sw.js', {
    scope: '/',
    updateViaCache: 'none' // Always check for updates
  })
    .then((registration) => {
      console.log('Firebase SW registered: ', registration);
      
      // Listen for updates
      registration.addEventListener('updatefound', () => {
        console.log('Firebase SW update found');
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
      
      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 30000); // Check every 30 seconds
    })
    .catch((registrationError) => {
      console.log('Firebase SW registration failed: ', registrationError);
    });
    
  // Also register the main service worker
  navigator.serviceWorker.register('/sw.js', {
    scope: '/',
    updateViaCache: 'none'
  })
    .then((registration) => {
      console.log('Main SW registered: ', registration);
    })
    .catch((registrationError) => {
      console.log('Main SW registration failed: ', registrationError);
    });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
