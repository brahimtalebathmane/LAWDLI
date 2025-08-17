// OneSignal Web Push Integration
// This file handles OneSignal push notifications

export const requestNotificationPermission = async (userId: string): Promise<string | null> => {
  try {
    console.log('OneSignal: Requesting notification permission for user:', userId);
    
    if (!('Notification' in window)) {
      console.error('This browser does not support notifications');
      return null;
    }

    // Wait for OneSignal to be ready and associate with user
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.OneSignalDeferred) {
        window.OneSignalDeferred.push(async function(OneSignal) {
          try {
            // Set external user ID
            await OneSignal.login(userId);
            console.log('OneSignal: External user ID set successfully:', userId);
            
            // Get subscription status
            const isEnabled = await OneSignal.User.PushSubscription.optedIn;
            console.log('OneSignal: Push notifications enabled:', isEnabled);
            
            if (!isEnabled) {
              // Request permission
              await OneSignal.Slidedown.promptPush();
              console.log('OneSignal: Permission prompt shown');
            }
            
            // Get subscription ID
            const subscriptionId = OneSignal.User.PushSubscription.id;
            console.log('OneSignal: Subscription ID obtained:', subscriptionId);
            resolve(subscriptionId || 'onesignal-subscribed');
          } catch (error) {
            console.error('OneSignal: Setup failed:', error);
            resolve(null);
          }
        });
      } else {
        console.error('OneSignal not available');
        resolve(null);
      }
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
    console.log('OneSignal: Logging out user:', userId);
    
    if (typeof window !== 'undefined' && window.OneSignalDeferred) {
      window.OneSignalDeferred.push(async function(OneSignal) {
        try {
          await OneSignal.logout();
          console.log('OneSignal: User logged out successfully');
        } catch (error) {
          console.error('OneSignal: Logout failed:', error);
        }
      });
    }
  } catch (error) {
    console.error('Error logging out OneSignal user:', error);
  }
};

export const onForegroundMessage = (callback: (payload: any) => void) => {
  // OneSignal handles foreground messages automatically
  console.log('OneSignal: Foreground message handling is managed by OneSignal SDK');
  
  if (typeof window !== 'undefined' && window.OneSignalDeferred) {
    window.OneSignalDeferred.push(async function(OneSignal) {
      try {
        OneSignal.Notifications.addEventListener('click', (event) => {
          console.log('OneSignal: Notification clicked:', event);
          callback({
            notification: {
              title: event.notification?.title || 'Notification',
              body: event.notification?.body || ''
            },
            data: event.notification?.additionalData || {}
          });
        });
      } catch (error) {
        console.error('OneSignal: Error setting up notification listeners:', error);
      }
    });
  }
};

// Declare OneSignal types for TypeScript
declare global {
  interface Window {
    OneSignal?: any;
    OneSignalDeferred?: Array<(OneSignal: any) => void>;
  }
}