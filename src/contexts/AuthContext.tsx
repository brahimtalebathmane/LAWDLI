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
    
    // Associate user with OneSignal after successful login
    setTimeout(() => {
      console.log('AuthContext: Setting up OneSignal for user:', userData.id);
      
      // Set external user ID in OneSignal
      if (window.OneSignal) {
        window.OneSignal.push(async function() {
          try {
            await window.OneSignal.setExternalUserId(userData.id);
            console.log('AuthContext: OneSignal external user ID set:', userData.id);
          } catch (error) {
            console.error('AuthContext: Failed to set OneSignal external user ID:', error);
          }
        });
      } else {
        console.log('AuthContext: OneSignal not yet loaded, will be handled by initialization');
      }
    }, 1000);
  };

  const logout = () => {
    // Remove external user ID from OneSignal
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