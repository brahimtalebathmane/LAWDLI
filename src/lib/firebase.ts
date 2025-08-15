import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyCAncc8um-yQBA1VzATvHAbCPOCPo5F_1E",
  authDomain: "lawdli.firebaseapp.com",
  projectId: "lawdli",
  storageBucket: "lawdli.firebasestorage.app",
  messagingSenderId: "1095350923790",
  appId: "1:1095350923790:web:93631ae307a6ecdce5425f"
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

// Get FCM token for the logged-in user
export const getFCMToken = async (userId: string) => {
  if (!messaging) {
    console.log('Messaging not supported');
    return null;
  }

  try {
    // Register service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    
    // Get FCM token
    const token = await getToken(messaging, {
      vapidKey: 'BOPyVXW3oxnwPsk1dKk1gcTWhfREpYbNDv3YHPedB-7zIXUoHlp6otcX1ypLj068bIZnunwrbqzaeTjnzG_vyc0',
      serviceWorkerRegistration: registration
    });

    if (token) {
      // Save token to Supabase
      await saveFCMToken(userId, token);
      return token;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

// Request notification permission and get FCM token
export const requestNotificationPermission = async (userId: string) => {
  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      return await getFCMToken(userId);
    }
    
    return null;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return null;
  }
};

// Save FCM token to Supabase
const saveFCMToken = async (userId: string, token: string) => {
  try {
    const { supabase } = await import('./supabase');
    
    // Upsert token in user_tokens table (insert or update if exists)
    await supabase
      .from('user_tokens')
      .upsert({
        user_id: userId,
        fcm_token: token,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });
      
  } catch (error) {
    console.error('Error saving FCM token:', error);
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
      .from('user_tokens')
      .delete()
      .eq('user_id', userId);
      
  } catch (error) {
    console.error('Error deleting FCM token:', error);
  }
};