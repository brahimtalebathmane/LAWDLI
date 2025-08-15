// Service Worker for LAWDLI PWA - Online Only Mode
// This service worker handles push notifications but does NOT cache resources for offline use

// Skip waiting and claim clients immediately
self.addEventListener('install', (event) => {
  console.log('Service Worker installing - Online Only Mode');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating - Online Only Mode');
  
  event.waitUntil(
    // Clear all existing caches to prevent offline functionality
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      // Claim all clients immediately
      return self.clients.claim();
    })
  );
});

// Do NOT intercept fetch requests - let everything go to network
// This ensures all resources are always loaded fresh from the server
self.addEventListener('fetch', (event) => {
  // Let all requests go through to the network without any caching
  // This prevents the white screen issue and ensures fresh content
  return;
});

// Push notification handling (keep existing functionality)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.message,
      icon: 'https://i.postimg.cc/rygydTNp/9.png',
      badge: 'https://i.postimg.cc/rygydTNp/9.png',
      vibrate: [200, 100, 200],
      data: {
        url: data.url || '/'
      },
      actions: [
        {
          action: 'open',
          title: 'Open',
          icon: 'https://i.postimg.cc/rygydTNp/9.png'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'لودلي | LAWDLI', options)
    );
  }
});

// Notification click handling (keep existing functionality)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    const url = event.notification.data.url || '/';
    
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        // If no existing window/tab, open a new one
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  }
});