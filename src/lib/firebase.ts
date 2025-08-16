import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, deleteToken } from 'firebase/messaging';
import { supabase } from './supabase';

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
    // Wait for service worker to be ready
    let registration;
    try {
      registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/'
      });
      await navigator.serviceWorker.ready;
      console.log('Firebase SW registered successfully');
    } catch (swError) {
      console.error('Firebase SW registration failed:', swError);
      // Try without explicit registration
      registration = await navigator.serviceWorker.ready;
    }
    
    // Get FCM token
    const token = await getToken(messaging, {
      vapidKey: 'BOPyVXW3oxnwPsk1dKk1gcTWhfREpYbNDv3YHPedB-7zIXUoHlp6otcX1ypLj068bIZnunwrbqzaeTjnzG_vyc0',
      serviceWorkerRegistration: registration
    });

    if (token) {
      console.log('FCM Token obtained:', token.substring(0, 20) + '...');
      // Save token to Supabase
      await saveFCMToken(userId, token);
      return token;
    } else {
      console.log('No FCM token available');
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
    // Upsert FCM token for the user
    const { error } = await supabase
      .from('user_tokens')
      .upsert({
        user_id: userId,
        fcm_token: token,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });
      
    if (error) {
      console.error('Error saving FCM token:', error);
    } else {
      console.log('FCM token saved successfully');
    }
      
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
    // Delete from Firebase first
    if (messaging) {
      try {
        await deleteToken(messaging);
        console.log('FCM token deleted from Firebase');
      } catch (error) {
        console.error('Error deleting FCM token from Firebase:', error);
      }
    }
    
    // Delete from Supabase
    await supabase
      .from('user_tokens')
      .delete()
      .eq('user_id', userId);
      
    console.log('FCM token deleted from database');
      
  } catch (error) {
    console.error('Error deleting FCM token:', error);
  }
};