import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../lib/supabase';

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
    try {
      localStorage.setItem('lawdli_user', JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user to localStorage:', error);
    }
    
    // Associate user with OneSignal after successful login
    setTimeout(() => {
      console.log('AuthContext: Setting up OneSignal for user:', userData.id);
      
      if (typeof window !== 'undefined' && window.OneSignalDeferred) {
        window.OneSignalDeferred.push(async function(OneSignal) {
          try {
            await OneSignal.login(userData.id);
            console.log('AuthContext: OneSignal user logged in:', userData.id);
          } catch (error) {
            console.error('AuthContext: Failed to login OneSignal user:', error);
          }
        });
      }
    }, 1000);
  };

  const logout = () => {
    // Remove user from OneSignal
    if (user && typeof window !== 'undefined' && window.OneSignalDeferred) {
      window.OneSignalDeferred.push(async function(OneSignal) {
        try {
          await OneSignal.logout();
          console.log('AuthContext: OneSignal user logged out');
        } catch (error) {
          console.error('AuthContext: Failed to logout OneSignal user:', error);
        }
      });
    }
    
    setUser(null);
    try {
      localStorage.removeItem('lawdli_user');
    } catch (error) {
      console.error('Error removing user from localStorage:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};