import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../lib/supabase';
import { requestNotificationPermission, deleteFCMToken } from '../lib/firebase';

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
    const storedUser = localStorage.getItem('lawdli_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('lawdli_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('lawdli_user', JSON.stringify(userData));
    
    // Request notification permission after login
    setTimeout(() => {
      requestNotificationPermission(userData.id).catch(console.error);
    }, 1000);
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