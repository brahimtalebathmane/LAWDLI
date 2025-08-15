@@ .. @@
 // Firebase messaging service worker
 importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
 importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

 // Initialize Firebase in service worker
 firebase.initializeApp({
-  apiKey: "VITE_FIREBASE_API_KEY_PLACEHOLDER",
-  authDomain: "VITE_FIREBASE_AUTH_DOMAIN_PLACEHOLDER", 
-  projectId: "VITE_FIREBASE_PROJECT_ID_PLACEHOLDER",
-  storageBucket: "VITE_FIREBASE_STORAGE_BUCKET_PLACEHOLDER",
-  messagingSenderId: "VITE_FIREBASE_MESSAGING_SENDER_ID_PLACEHOLDER",
-  appId: "VITE_FIREBASE_APP_ID_PLACEHOLDER"
+  apiKey: "AIzaSyCAncc8um-yQBA1VzATvHAbCPOCPo5F_1E",
+  authDomain: "lawdli.firebaseapp.com",
+  projectId: "lawdli",
+  storageBucket: "lawdli.firebasestorage.app",
+  messagingSenderId: "1095350923790",
+  appId: "1:1095350923790:web:93631ae307a6ecdce5425f"
 });

 const messaging = firebase.messaging();
@@ .. @@
 // Handle background messages
 messaging.onBackgroundMessage((payload) => {
   console.log('Background message received:', payload);
   
-  const notificationTitle = payload.notification?.title || 'LAWDLI';
+  const notificationTitle = payload.notification?.title || 'LAWDLI';
   const notificationOptions = {
-    body: payload.notification?.body || 'You have a new notification',
+    body: payload.notification?.body || 'You have a new notification',
     icon: 'https://i.postimg.cc/rygydTNp/9.png',
     badge: 'https://i.postimg.cc/rygydTNp/9.png',
     data: payload.data || {},
@@ .. @@
   event.waitUntil(
     clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
       // Check if there's already a window/tab open
       for (const client of clientList) {
-        if (client.url.includes(self.location.origin) && 'focus' in client) {
+        if (client.url.includes(self.location.origin) && 'focus' in client) {
           client.postMessage({
             type: 'NOTIFICATION_CLICK',
             deepLink: deepLink
@@ .. @@
       }
       
       // If no existing window/tab, open a new one
       if (clients.openWindow) {
-        return clients.openWindow(self.location.origin + deepLink);
+        return clients.openWindow(self.location.origin + deepLink);
       }
     })
   );
 });