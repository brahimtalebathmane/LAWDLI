// Firebase messaging service worker - NOTIFICATIONS ONLY
// This worker ONLY handles FCM notifications, NO caching allowed

importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js');

// Initialize Firebase ONLY for messaging
firebase.initializeApp({
  apiKey: "AIzaSyCAncc8um-yQBA1VzATvHAbCPOCPo5F_1E",
  authDomain: "lawdli.firebaseapp.com",
  projectId: "lawdli",
  storageBucket: "lawdli.firebasestorage.app",
  messagingSenderId: "1095350923790",
  appId: "1:1095350923790:web:93631ae307a6ecdce5425f"
});

const messaging = firebase.messaging();

// ONLY handle background FCM messages - no other functionality
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);
  
  const notificationTitle = payload.notification?.title || 'لودلي | LAWDLI';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: 'https://i.postimg.cc/rygydTNp/9.png',
    badge: 'https://i.postimg.cc/rygydTNp/9.png',
    data: payload.data || {},
    requireInteraction: true,
    silent: false,
    vibrate: [200, 100, 200, 100, 200],
    tag: 'lawdli-notification',
    actions: [
      {
        action: 'open',
        title: 'فتح التطبيق',
        icon: 'https://i.postimg.cc/rygydTNp/9.png'
      }
    ],
    renotify: true,
    sticky: false,
    timestamp: Date.now()
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle FCM notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  const deepLink = event.notification.data?.deepLink || '/';
  const fullUrl = self.location.origin + deepLink;
  
  event.waitUntil(
    clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    }).then((clientList) => {
      // Try to focus existing window first
      for (const client of clientList) {
        if (client.url === fullUrl && 'focus' in client) {
          return client.focus();
        }
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            deepLink: deepLink
          });
          return client.focus();
        }
      }
      
      // Open new window if no existing window found
      if (clients.openWindow) {
        return clients.openWindow(fullUrl);
      }
    })
  );
});

// Handle direct push events (mobile compatibility)
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  if (event.data) {
    try {
      const data = event.data.json();
      console.log('Push data:', data);
      
      const options = {
        body: data.body || data.message || 'You have a new notification',
        icon: 'https://i.postimg.cc/rygydTNp/9.png',
        badge: 'https://i.postimg.cc/rygydTNp/9.png',
        vibrate: [200, 100, 200, 100, 200],
        data: data.data || { deepLink: '/' },
        tag: 'lawdli-push',
        renotify: true,
        requireInteraction: true,
        silent: false,
        timestamp: Date.now(),
        actions: [
          {
            action: 'open',
            title: 'فتح',
            icon: 'https://i.postimg.cc/rygydTNp/9.png'
          }
        ]
      };

      event.waitUntil(
        self.registration.showNotification(data.title || 'لودلي | LAWDLI', options)
      );
    } catch (error) {
      console.error('Error parsing push data:', error);
      event.waitUntil(
        self.registration.showNotification('لودلي | LAWDLI', {
          body: 'You have a new notification',
          icon: 'https://i.postimg.cc/rygydTNp/9.png',
          badge: 'https://i.postimg.cc/rygydTNp/9.png',
          vibrate: [200, 100, 200],
          requireInteraction: true,
          timestamp: Date.now()
        })
      );
    }
  }
});

// Handle notification close events
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification.tag);
});

// CRITICAL: Do NOT handle fetch events - no caching allowed
// This ensures all requests go to network for online-only operation