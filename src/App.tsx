import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { onForegroundMessage, getFCMToken } from './lib/firebase';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';

const AppRouter: React.FC = () => {
  const { user, isLoading } = useAuth();

  // Register Firebase messaging service worker
  React.useEffect(() => {
    if ('serviceWorker' in navigator && import.meta.env.VITE_DISABLE_FCM_SW_REGISTRATION !== 'true') {
      // Register Firebase messaging service worker for notifications only
      navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' })
        .then(registration => {
          console.log('Firebase messaging SW registered:', registration);
        })
        .catch(err => {
          if (!err.message?.includes('StackBlitz')) {
            console.error('Firebase messaging SW registration failed:', err);
          }
        });
      
      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        // Handle notification clicks and deep links without reload
        if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
          const deepLink = event.data.deepLink;
          if (deepLink && deepLink !== '/') {
            // Navigate without reload
            window.history.pushState({}, '', deepLink);
          }
        }
      });
    }
  }, []);

  // Handle foreground push messages
  React.useEffect(() => {
    onForegroundMessage((payload) => {
      if (payload.notification && 'Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(payload.notification.title, {
          body: payload.notification.body,
          icon: 'https://i.postimg.cc/rygydTNp/9.png',
          badge: 'https://i.postimg.cc/rygydTNp/9.png',
          data: payload.data,
          tag: 'lawdli-foreground',
          renotify: true
        });

        notification.onclick = () => {
          notification.close();
          const deepLink = payload.data?.deepLink;
          if (deepLink && deepLink !== '/') window.location.href = deepLink;
          window.focus();
        };

        setTimeout(() => notification.close(), 5000);
      }
    });
  }, []);

  // Re-get FCM token when app becomes active (online-only refresh)
  React.useEffect(() => {
    const handleFocus = () => {
      if (user && 'Notification' in window && Notification.permission === 'granted') {
        getFCMToken(user.id).catch(console.error);
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <img 
            src="https://i.postimg.cc/rygydTNp/9.png" 
            alt="لودلي | LAWDLI Logo" 
            className="h-16 w-auto mx-auto mb-4"
          />
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <Routes>
      <Route path="/" element={user.role === 'admin' ? <AdminDashboard /> : <UserDashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <LanguageProvider>
      <Router>
        <AppRouter />
      </Router>
    </LanguageProvider>
  </AuthProvider>
);

export default App;
