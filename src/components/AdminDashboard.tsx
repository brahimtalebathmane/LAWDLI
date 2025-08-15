import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import Layout from './Layout';
import AdminNavigation from './AdminNavigation';
import RequestsManager from './RequestsManager';
import GroupsManager from './GroupsManager';
import UsersManager from './UsersManager';
import NotificationsPanel from './NotificationsPanel';
import { BarChart3, Users, MessageSquare, Bell } from 'lucide-react';

type ActiveTab = 'dashboard' | 'requests' | 'groups' | 'users' | 'notifications';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [stats, setStats] = useState({
    totalRequests: 0,
    totalGroups: 0,
    totalUsers: 0,
    unreadNotifications: 0
  });

  const { user } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    loadStats();
    
    // Set up real-time subscription for admin stats updates
    const subscription = supabase
      .channel('admin-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'requests'
      }, () => {
        loadStats();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'responses'
      }, () => {
        loadStats();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'groups'
      }, () => {
        loadStats();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'users'
      }, () => {
        loadStats();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadStats = async () => {
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
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {t('welcome')}, {user?.full_name}
              </h2>
              
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