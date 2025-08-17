import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase, Notification } from '../lib/supabase';
import { useRealtimeData } from '../hooks/useRealtimeData';
import RefreshButton from './RefreshButton';
import LoadingSpinner from './LoadingSpinner';
import { Bell, BellOff, Check, Trash2 } from 'lucide-react';

interface NotificationsPanelProps {
  onStatsUpdate: () => void;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ onStatsUpdate }) => {
  const [isLoading, setIsLoading] = useState(false);

  const { user } = useAuth();
  const { t } = useLanguage();

  // Use real-time data hook for notifications
  const {
    data: notifications,
    isLoading: notificationsLoading,
    isRefreshing: notificationsRefreshing,
    refresh: refreshNotifications
  } = useRealtimeData({
    table: 'notifications',
    filter: { user_id: user?.id },
    orderBy: { column: 'created_at', ascending: false },
    cacheKey: `notifications-${user?.id}`,
    cacheDuration: 10000, // 10 seconds
    enableRealtime: true
  });

  // Update stats when notifications change
  useEffect(() => {
    onStatsUpdate();
  }, [notifications, onStatsUpdate]);

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      refreshNotifications();
      onStatsUpdate();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      refreshNotifications();
      onStatsUpdate();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      refreshNotifications();
      onStatsUpdate();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const unreadCount = (notifications || []).filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900">{t('notifications')}</h2>
          {unreadCount > 0 && (
            <span className="bg-red-100 text-red-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton
            onRefresh={refreshNotifications}
            isRefreshing={notificationsRefreshing}
            size="md"
            variant="ghost"
          />
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Check className="h-4 w-4" />
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {notificationsLoading && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <LoadingSpinner size="lg" text={t('loading')} />
        </div>
      )}

      {/* Notifications List */}
      {!notificationsLoading && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-200">
          {(notifications || []).length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <BellOff className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p>No notifications</p>
            </div>
          ) : (
            (notifications || []).map((notification) => (
              <div 
                key={notification.id} 
                className={`p-6 hover:bg-gray-50 transition-colors ${
                  !notification.read ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${
                      !notification.read ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <Bell className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold ${
                        !notification.read ? 'text-gray-900' : 'text-gray-600'
                      }`}>
                        {notification.title}
                      </h3>
                      <p className={`text-sm mt-1 ${
                        !notification.read ? 'text-gray-700' : 'text-gray-500'
                      }`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Mark as read"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      )}
    </div>
  );
};

export default NotificationsPanel;