import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../lib/supabase';
import { requestNotificationPermission, deleteFCMToken, getFCMToken } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user on app load
    try {
      const storedUser = localStorage.getItem('lawdli_user');
      if (storedUser && storedUser !== 'null' && storedUser !== 'undefined') {
        try {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser && typeof parsedUser === 'object' && parsedUser.id) {
            setUser(parsedUser);
          } else {
            // Invalid user data, clear it
            localStorage.removeItem('lawdli_user');
          }
        } catch (error) {
          console.error('Error parsing stored user:', error);
          localStorage.removeItem('lawdli_user');
        }
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      // Continue without stored user if localStorage is not available
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('lawdli_user', JSON.stringify(userData));
    
    // Request notification permission and get FCM token after login with delay
    setTimeout(() => {
      if ('Notification' in window && 'serviceWorker' in navigator) {
        console.log('Current notification permission:', Notification.permission);
        
        if (Notification.permission === 'granted') {
          // Already granted, get the token
          getFCMToken(userData.id).then(token => {
            if (token) {
              console.log('FCM token obtained after login');
            } else {
              console.log('Failed to get FCM token after login');
            }
          }).catch(console.error);
        } else if (Notification.permission === 'default') {
          // Will be handled by NotificationPermissionBanner
          console.log('Notification permission not yet requested');
        }
      }
    }, 2000); // Increased delay to ensure service worker is ready
  };

  const logout = () => {
    // Delete FCM token on logout
    if (user) {
      deleteFCMToken(user.id).catch(console.error);
    }
    setUser(null);
    localStorage.removeItem('lawdli_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};