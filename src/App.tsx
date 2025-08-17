import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { onForegroundMessage } from './lib/firebase';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';

const AppRouter: React.FC = () => {
  const { user, isLoading } = useAuth();

  // Handle foreground push messages via OneSignal
  React.useEffect(() => {
    console.log('Setting up OneSignal foreground message handler');
    onForegroundMessage((payload) => {
      console.log('OneSignal foreground message received:', payload);
      if (payload.notification && 'Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(payload.notification.title, {
          body: payload.notification.body,
          icon: 'https://i.postimg.cc/rygydTNp/9.png',
          badge: 'https://i.postimg.cc/rygydTNp/9.png',
          data: payload.data,
          tag: 'lawdli-onesignal',
          renotify: true,
          requireInteraction: false,
          vibrate: [200, 100, 200]
        });

        notification.onclick = () => {
          notification.close();
          const deepLink = payload.data?.deepLink;
          if (deepLink && deepLink !== '/') window.location.href = deepLink;
          window.focus();
        };

        setTimeout(() => notification.close(), 5000);
      } else {
        console.log('OneSignal handles notifications automatically');
      }
    });
  }, []);

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
