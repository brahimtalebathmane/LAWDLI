import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { useRealtimeData } from '../hooks/useRealtimeData';
import Layout from './Layout';
import AdminNavigation from './AdminNavigation';
import RequestsManager from './RequestsManager';
import GroupsManager from './GroupsManager';
import UsersManager from './UsersManager';
import NotificationsPanel from './NotificationsPanel';
import RefreshButton from './RefreshButton';
import LoadingSpinner from './LoadingSpinner';
import { BarChart3, Users, MessageSquare, Bell, Trash2 } from 'lucide-react';

type ActiveTab = 'dashboard' | 'requests' | 'groups' | 'users' | 'notifications';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [stats, setStats] = useState({
    totalRequests: 0,
    totalGroups: 0,
    totalUsers: 0,
    unreadNotifications: 0
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { user } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsRefreshing(true);
    
    try {
      const [requestsRes, groupsRes, usersRes, notificationsRes] = await Promise.all([
        supabase.from('requests').select('id', { count: 'exact' }),
        supabase.from('groups').select('id', { count: 'exact' }),
        supabase.from('users').select('id', { count: 'exact' }),
        supabase.from('notifications').select('id', { count: 'exact' }).eq('user_id', user?.id).eq('read', false)
      ]);

      setStats({
        totalRequests: requestsRes.count || 0,
        totalGroups: groupsRes.count || 0,
        totalUsers: usersRes.count || 0,
        unreadNotifications: notificationsRes.count || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const runManualCleanup = async () => {
    if (!confirm('هل تريد حذف جميع الطلبات والإشعارات الأقدم من 24 ساعة؟\nDo you want to delete all requests and notifications older than 24 hours?')) {
      return;
    }

    setIsRefreshing(true);
    try {
      console.log('Running manual cleanup...');
      
      // Try direct database cleanup first as fallback
      const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const [requestsResult, notificationsResult] = await Promise.all([
        supabase.from('requests').delete().lt('created_at', cutoffTime).select('id'),
        supabase.from('notifications').delete().lt('created_at', cutoffTime).select('id')
      ]);
      
      const deletedRequests = requestsResult.data?.length || 0;
      const deletedNotifications = notificationsResult.data?.length || 0;
      
      if (requestsResult.error) throw requestsResult.error;
      if (notificationsResult.error) throw notificationsResult.error;
      
      const result = {
        success: true,
        deleted_requests: deletedRequests,
        deleted_notifications: deletedNotifications
      };
      
      /*
      // Edge Function approach (if CORS is fixed)
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cleanup-old-data`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      */
      
      console.log('Cleanup result:', result);
      
      if (result.success) {
        alert(`تم التنظيف بنجاح!\nCleanup successful!\n\nDeleted requests: ${result.deleted_requests || 0}\nDeleted notifications: ${result.deleted_notifications || 0}`);
        loadStats(); // Refresh stats after cleanup
      } else {
        alert(`خطأ في التنظيف: ${result.error}\nCleanup error: ${result.error}`);
      }
    } catch (error) {
      console.error('Manual cleanup error:', error);
      alert(`خطأ في التنظيف: ${error}\nCleanup error: ${error}`);
    } finally {
      setIsRefreshing(false);
    }
  };
  const renderContent = () => {
    switch (activeTab) {
      case 'requests':
        return <RequestsManager onStatsUpdate={loadStats} />;
      case 'groups':
        return <GroupsManager onStatsUpdate={loadStats} />;
      case 'users':
        return <UsersManager onStatsUpdate={loadStats} />;
      case 'notifications':
        return <NotificationsPanel onStatsUpdate={loadStats} />;
      default:
        return (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {t('welcome')}, {user?.full_name}
                </h2>
                <RefreshButton
                  onRefresh={loadStats}
                  isRefreshing={isRefreshing}
                  size="md"
                  variant="ghost"
                />
                <button
                  onClick={runManualCleanup}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                  title="Clean up old data (24+ hours)"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Clean Old Data</span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
                  <div className="flex items-center">
                    <MessageSquare className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-blue-600">{t('totalRequests')}</p>
                      <p className="text-2xl font-bold text-blue-900">{stats.totalRequests}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-6 border border-green-100">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-green-600">{t('totalGroups')}</p>
                      <p className="text-2xl font-bold text-green-900">{stats.totalGroups}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-6 border border-purple-100">
                  <div className="flex items-center">
                    <BarChart3 className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-purple-600">{t('totalUsers')}</p>
                      <p className="text-2xl font-bold text-purple-900">{stats.totalUsers}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 rounded-lg p-6 border border-orange-100">
                  <div className="flex items-center">
                    <Bell className="h-8 w-8 text-orange-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-orange-600">{t('notifications')}</p>
                      <p className="text-2xl font-bold text-orange-900">{stats.unreadNotifications}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {isRefreshing && (
                <div className="mt-4 flex justify-center">
                  <LoadingSpinner size="sm" text={t('refreshing')} />
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="mt-8">
          {renderContent()}
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;