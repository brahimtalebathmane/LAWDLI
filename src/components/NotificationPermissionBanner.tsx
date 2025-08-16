import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { requestNotificationPermission } from '../lib/firebase';
import { Bell, X } from 'lucide-react';

const NotificationPermissionBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();
  const { user } = useAuth();

  useEffect(() => {
    // Check notification permission status
    if ('Notification' in window && user) {
      const permission = Notification.permission;
      
      // Show banner if permission is denied or default (not asked yet)
      if (permission === 'denied' || permission === 'default') {
        // Don't show immediately, wait a bit for better UX
        const timer = setTimeout(() => {
          setShowBanner(true);
        }, 3000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  const handleEnableNotifications = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      console.log('Requesting notification permission...');
      const token = await requestNotificationPermission(user.id);
      if (token) {
        console.log('Notification permission granted and token saved:', token.substring(0, 20) + '...');
        setShowBanner(false);
        // Test notification to confirm it's working
        if ('Notification' in window && Notification.permission === 'granted') {
          const testNotification = new Notification('لودلي | LAWDLI', {
            body: 'Notifications are now enabled!',
            icon: 'https://i.postimg.cc/rygydTNp/9.png',
            tag: 'test-notification',
            requireInteraction: false,
            vibrate: [200, 100, 200]
          });
          
          setTimeout(() => {
            testNotification.close();
          }, 5000);
        }
      } else {
        // Permission was denied, show different message
        console.log('Notification permission denied or failed');
        alert(t('notifications.permission_denied'));
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      alert('Failed to enable notifications. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    // Remember dismissal for this session
    try {
      sessionStorage.setItem('notification_banner_dismissed', 'true');
    } catch (error) {
      console.error('Error saving to sessionStorage:', error);
      // Continue without saving dismissal state
    }
  };

  // Don't show if dismissed in this session
  try {
    if (sessionStorage.getItem('notification_banner_dismissed')) {
      return null;
    }
  } catch (error) {
    console.error('Error accessing sessionStorage:', error);
    // Continue to show banner if sessionStorage is not available
  }

  if (!showBanner || !user) {
    return null;
  }

  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mx-4 mt-4 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Bell className="h-5 w-5 text-blue-400 mr-3" />
          <div>
            <p className="text-sm font-medium text-blue-800">
              {t('notifications.enable')}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Get notified about new requests and responses even when the app is closed
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleEnableNotifications}
            disabled={isLoading}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Enabling...' : 'Enable'}
          </button>
          <button
            onClick={handleDismiss}
            className="text-blue-400 hover:text-blue-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPermissionBanner;