import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging and get a reference to the service
let messaging: any = null;

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.log('Firebase messaging not supported:', error);
  }
}

export { app, messaging };

// Request notification permission and get FCM token
export const requestNotificationPermission = async (userId: string) => {
  if (!messaging) {
    console.log('Messaging not supported');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      
      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration
      });

      if (token) {
        // Save token to Supabase
        await saveFCMToken(userId, token);
        return token;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting notification permission:', error);
    return null;
  }
};

// Save FCM token to Supabase
const saveFCMToken = async (userId: string, token: string) => {
  try {
    const { supabase } = await import('./supabase');
    
    // Get platform info
    const platform = getPlatform();
    
    // Upsert token (insert or update if exists)
    await supabase
      .from('push_tokens')
      .upsert({
        user_id: userId,
        token: token,
        platform: platform,
        last_seen_at: new Date().toISOString()
      }, {
        onConflict: 'token'
      });
      
  } catch (error) {
    console.error('Error saving FCM token:', error);
  }
};

// Get platform information
const getPlatform = (): string => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/android/.test(userAgent)) {
    return 'web-android';
  } else if (/iphone|ipad|ipod/.test(userAgent)) {
    return 'web-ios';
  } else {
    return 'web-desktop';
  }
};

// Listen for foreground messages
export const onForegroundMessage = (callback: (payload: any) => void) => {
  if (!messaging) return;
  
  onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);
    callback(payload);
  });
};

// Delete FCM token on logout
export const deleteFCMToken = async (userId: string) => {
  try {
    const { supabase } = await import('./supabase');
    
    await supabase
      .from('push_tokens')
      .delete()
      .eq('user_id', userId);
      
  } catch (error) {
    console.error('Error deleting FCM token:', error);
  }
};