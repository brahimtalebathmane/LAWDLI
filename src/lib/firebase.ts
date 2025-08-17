// OneSignal Web Push Integration
// This file now handles OneSignal instead of Firebase Cloud Messaging

export const requestNotificationPermission = async (userId: string): Promise<string | null> => {
  try {
    console.log('Requesting notification permission via OneSignal...');
    
    if (!('Notification' in window)) {
      console.error('This browser does not support notifications');
      return null;
    }

    // Request permission first
    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    // Initialize OneSignal and associate with user
    return new Promise((resolve) => {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async function(OneSignal) {
        try {
          if (window.OneSignal && userId) {
            await OneSignal.login(userId); // Map to app user ID
            console.log('OneSignal user login successful:', userId);
            
            // Get subscription ID for logging
            const subscriptionId = await OneSignal.User.PushSubscription.id;
            console.log('OneSignal subscription ID:', subscriptionId);
            
            resolve(subscriptionId || 'onesignal-subscribed');
          } else {
            console.error('OneSignal not available');
            resolve(null);
          }
        } catch (error) {
          console.error('OneSignal login failed:', error);
          resolve(null);
        }
      });
    });
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return null;
  }
};

export const getFCMToken = async (userId: string): Promise<string | null> => {
  // Renamed for compatibility but now uses OneSignal
  return requestNotificationPermission(userId);
};

export const deleteFCMToken = async (userId: string): Promise<void> => {
  try {
    console.log('Logging out OneSignal user:', userId);
    
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function(OneSignal) {
      try {
        if (window.OneSignal) {
          await OneSignal.logout();
          console.log('OneSignal user logged out successfully');
        }
      } catch (error) {
        console.error('OneSignal logout failed:', error);
      }
    });
  } catch (error) {
    console.error('Error logging out OneSignal user:', error);
  }
};

export const onForegroundMessage = (callback: (payload: any) => void) => {
  // OneSignal handles foreground messages automatically
  // This function is kept for compatibility but OneSignal manages this internally
  console.log('OneSignal handles foreground messages automatically');
  
  // Optional: Listen for OneSignal notification events
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async function(OneSignal) {
    try {
      if (window.OneSignal) {
        OneSignal.Notifications.addEventListener('click', (event) => {
          console.log('OneSignal notification clicked:', event);
          callback({
            notification: {
              title: event.notification.title,
              body: event.notification.body
            },
            data: event.notification.additionalData || {}
          });
        });
      }
    } catch (error) {
      console.error('Error setting up OneSignal notification listener:', error);
    }
  });
};

// Declare OneSignal types for TypeScript
declare global {
  interface Window {
    OneSignal?: any;
    OneSignalDeferred?: Array<(OneSignal: any) => void>;
  }
}