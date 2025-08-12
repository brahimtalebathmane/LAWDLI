import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Home, MessageSquare, Users, User, Bell, LogOut } from 'lucide-react';

type ActiveTab = 'dashboard' | 'requests' | 'groups' | 'users' | 'notifications';

interface AdminNavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

const AdminNavigation: React.FC<AdminNavigationProps> = ({ activeTab, setActiveTab }) => {
  const { logout } = useAuth();
  const { t } = useLanguage();

  const navigation = [
    { id: 'dashboard', name: t('dashboard'), icon: Home },
    { id: 'requests', name: t('requests'), icon: MessageSquare },
    { id: 'groups', name: t('groups'), icon: Users },
    { id: 'users', name: t('users'), icon: User },
    { id: 'notifications', name: t('notifications'), icon: Bell },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm p-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as ActiveTab)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                activeTab === item.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{item.name}</span>
            </button>
          ))}
        </div>
        
        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">{t('logout')}</span>
        </button>
      </div>
    </div>
  );
};

export default AdminNavigation;