import React, { ReactNode } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageToggle from './LanguageToggle';
import NotificationPermissionBanner from './NotificationPermissionBanner';

interface LayoutProps {
  children: ReactNode;
  showNavigation?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showNavigation = true }) => {
  const { isRTL } = useLanguage();

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 ${isRTL ? 'rtl' : 'ltr'}`}>
      {showNavigation && (
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-4">
                <img 
                  src="https://i.postimg.cc/rygydTNp/9.png" 
                  alt="LAWDLI Logo" 
                  className="h-10 w-auto"
                />
                <h1 className="text-xl font-bold text-gray-900">LAWDLI</h1>
              </div>
              <LanguageToggle />
            </div>
          </div>
        </header>
      )}
      <main className="flex-1">
        <NotificationPermissionBanner />
        {children}
      </main>
    </div>
  );
};

export default Layout;