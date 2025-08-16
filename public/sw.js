// Service Worker for LAWDLI PWA - Strict Online Only Mode
// This service worker ONLY handles push notifications and prevents ALL caching

// Skip waiting and claim clients immediately
self.addEventListener('install', (event) => {
  console.log('Service Worker installing - Strict Online Only Mode');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating - Strict Online Only Mode');
  
  event.waitUntil(
    // Clear ALL caches to ensure online-only operation
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('Deleting cache for online-only mode:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      // Claim all clients without forcing refresh
      return self.clients.claim();
    })
  );
});

// CRITICAL: Do NOT intercept ANY fetch requests
// This ensures ALL resources always go to network for fresh content
self.addEventListener('fetch', (event) => {
  // Explicitly do nothing - let ALL requests go directly to network
  // No caching, no interception, no offline functionality
  return;
});

// ONLY handle push notifications - no other service worker functionality
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

// Handle notification clicks - navigate to app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    const url = event.notification.data.url || '/';
    
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  }
});

// Listen for messages from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});