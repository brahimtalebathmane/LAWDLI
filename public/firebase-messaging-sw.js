// Firebase messaging service worker
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js');

// Initialize Firebase in service worker
firebase.initializeApp({
  apiKey: "AIzaSyCAncc8um-yQBA1VzATvHAbCPOCPo5F_1E",
  authDomain: "lawdli.firebaseapp.com",
  projectId: "lawdli",
  storageBucket: "lawdli.firebasestorage.app",
  messagingSenderId: "1095350923790",
  appId: "1:1095350923790:web:93631ae307a6ecdce5425f"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);
  
  const notificationTitle = payload.notification?.title || 'لودلي | LAWDLI';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: 'https://i.postimg.cc/rygydTNp/9.png',
    badge: 'https://i.postimg.cc/rygydTNp/9.png',
    data: payload.data || {},
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200],
    tag: 'lawdli-notification',
    actions: [
      {
        action: 'open',
        title: 'Open App',
        icon: 'https://i.postimg.cc/rygydTNp/9.png'
      }
    ],
    // PWA specific options
    renotify: true,
    sticky: false
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  const deepLink = event.notification.data?.deepLink || '/';
  const fullUrl = self.location.origin + deepLink;
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open
      for (const client of clientList) {
        if (client.url === fullUrl && 'focus' in client) {
          return client.focus();
        }
        // If any LAWDLI window is open, focus it and navigate
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            deepLink: deepLink
          });
          return client.focus();
        }
      }
      
      // If no existing window/tab, open a new one
      if (clients.openWindow) {
        return clients.openWindow(fullUrl);
      }
    })
  );
});

// Handle push events for better mobile compatibility
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.body || data.message || 'You have a new notification',
        icon: 'https://i.postimg.cc/rygydTNp/9.png',
        badge: 'https://i.postimg.cc/rygydTNp/9.png',
        vibrate: [200, 100, 200],
        data: data.data || { deepLink: '/' },
        tag: 'lawdli-push',
        renotify: true,
        requireInteraction: false,
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
    } catch (error) {
      console.error('Error parsing push data:', error);
      // Fallback notification
      event.waitUntil(
        self.registration.showNotification('لودلي | LAWDLI', {
          body: 'You have a new notification',
          icon: 'https://i.postimg.cc/rygydTNp/9.png',
          badge: 'https://i.postimg.cc/rygydTNp/9.png'
        })
      );
    }
  }
});
