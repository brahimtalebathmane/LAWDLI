// OneSignal Web Push Integration
// This file now handles OneSignal instead of Firebase Cloud Messaging

export const requestNotificationPermission = async (userId: string): Promise<string | null> => {
  try {
    console.log('OneSignal: Requesting notification permission for user:', userId);
    
    if (!('Notification' in window)) {
      console.error('This browser does not support notifications');
      return null;
    }


    // Wait for OneSignal to be ready and associate with user
    return new Promise((resolve) => {
      window.OneSignal = window.OneSignal || [];
      window.OneSignal.push(async function(OneSignal) {
        try {
          // Set external user ID
          await OneSignal.setExternalUserId(userId);
          console.log('OneSignal: External user ID set successfully:', userId);
          
          // Get subscription status
          const isSubscribed = await OneSignal.isPushNotificationsEnabled();
          console.log('OneSignal: Push notifications enabled:', isSubscribed);
          
          if (!isSubscribed) {
            // Request permission
            await OneSignal.showNativePrompt();
            console.log('OneSignal: Native prompt shown');
          }
          
          // Get player ID (subscription ID)
          const playerId = await OneSignal.getPlayerId();
          console.log('OneSignal: Player ID obtained:', playerId);
          
          resolve(playerId || 'onesignal-subscribed');
        } catch (error) {
          console.error('OneSignal: Setup failed:', error);
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
    console.log('OneSignal: Logging out user:', userId);
    
    window.OneSignal = window.OneSignal || [];
    window.OneSignal.push(async function(OneSignal) {
      try {
        await OneSignal.removeExternalUserId();
        console.log('OneSignal: External user ID removed successfully');
      } catch (error) {
        console.error('OneSignal: Logout failed:', error);
      }
    });
  } catch (error) {
    console.error('Error logging out OneSignal user:', error);
  }
};

export const onForegroundMessage = (callback: (payload: any) => void) => {
  // OneSignal handles foreground messages automatically
  console.log('OneSignal: Setting up foreground message handler');
  
  window.OneSignal = window.OneSignal || [];
  window.OneSignal.push(function() {
    try {
      this.ready(() => {
        this.on('notificationDisplay', function(event) {
          console.log('OneSignal: Notification displayed:', event);
          callback({
            notification: {
              title: event.title,
              body: event.body
            },
            data: event.data || {}
          });
        });
        
        this.on('notificationClick', function(event) {
          console.log('OneSignal: Notification clicked:', event);
          callback({
            notification: {
              title: event.title,
              body: event.body
            },
            data: event.data || {}
          });
        });
      });
    } catch (error) {
      console.error('OneSignal: Error setting up notification listeners:', error);
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