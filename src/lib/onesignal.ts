// OneSignal Web Push Integration
// This file handles OneSignal push notifications

export const requestOneSignalPermission = async (userId: string): Promise<string | null> => {
  try {
    if (!('Notification' in window)) {
      return null;
    }

    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.OneSignalDeferred) {
        window.OneSignalDeferred.push(async function (OneSignal) {
          try {
            await OneSignal.login(userId);

            const isEnabled = await OneSignal.User.PushSubscription.optedIn;

            if (!isEnabled) {
              await OneSignal.Slidedown.promptPush();
            }

            const subscriptionId = OneSignal.User.PushSubscription.id;
            resolve(subscriptionId || 'onesignal-subscribed');
          } catch (error) {
            resolve(null);
          }
        });
      } else {
        resolve(null);
      }
    });
  } catch (error) {
    return null;
  }
};

export const getOneSignalToken = async (userId: string): Promise<string | null> => {
  return requestOneSignalPermission(userId);
};

export const logoutOneSignalUser = async (userId: string): Promise<void> => {
  try {
    if (typeof window !== 'undefined' && window.OneSignalDeferred) {
      window.OneSignalDeferred.push(async function (OneSignal) {
        try {
          await OneSignal.logout();
        } catch (error) {
        }
      });
    }
  } catch (error) {
  }
};

export const onForegroundMessage = (callback: (payload: any) => void) => {
  if (typeof window !== 'undefined' && window.OneSignalDeferred) {
    window.OneSignalDeferred.push(async function (OneSignal) {
      try {
        OneSignal.Notifications.addEventListener('click', (event) => {
          callback({
            notification: {
              title: event.notification?.title || 'Notification',
              body: event.notification?.body || ''
            },
            data: event.notification?.additionalData || {}
          });
        });
      } catch (error) {
      }
    });
  }
};

declare global {
  interface Window {
    OneSignal?: any;
    OneSignalDeferred?: Array<(OneSignal: any) => void>;
  }
}