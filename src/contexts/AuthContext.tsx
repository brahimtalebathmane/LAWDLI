import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../lib/supabase';
import { getOneSignalToken, logoutOneSignalUser } from '../lib/onesignal';
import { initializeCleanupScheduler, stopCleanupScheduler } from '../lib/cleanupScheduler';

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
          localStorage.removeItem('lawdli_user');
        }
      }
    } catch (error) {
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    try {
      localStorage.setItem('lawdli_user', JSON.stringify(userData));
    } catch (error) {
    }

    setTimeout(() => {
      getOneSignalToken(userData.id).catch(() => {});
    }, 1000);

    // Initialize cleanup scheduler for admin users
    if (userData.role === 'admin') {
      setTimeout(() => {
        initializeCleanupScheduler();
      }, 2000); // Start after OneSignal setup
    }
  };

  const logout = () => {
    if (user) {
      logoutOneSignalUser(user.id);
    }
    
    // Stop cleanup scheduler
    stopCleanupScheduler();
    
    setUser(null);
    try {
      localStorage.removeItem('lawdli_user');
    } catch (error) {
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};