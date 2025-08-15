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

  // Handle foreground push messages
  React.useEffect(() => {
    onForegroundMessage((payload) => {
      // Show in-app notification for foreground messages
      if (payload.notification) {
        // You can customize this to show a toast or update the notifications panel
        console.log('Foreground message:', payload);
        
        // Optionally show browser notification even in foreground
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(payload.notification.title, {
            body: payload.notification.body,
            icon: 'https://i.postimg.cc/rygydTNp/9.png'
          });
        }
      }
    });
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <img 
            src="https://i.postimg.cc/rygydTNp/9.png" 
            alt="LAWDLI Logo" 
            className="h-16 w-auto mx-auto mb-4"
          />
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          user.role === 'admin' ? (
            <AdminDashboard />
          ) : (
            <UserDashboard />
          )
        } 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <AppRouter />
        </Router>
      </LanguageProvider>
    </AuthProvider>
  );
};

export default App;