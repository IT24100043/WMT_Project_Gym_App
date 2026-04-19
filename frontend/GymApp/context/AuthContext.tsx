import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '@/constants/api';

export interface User {
  id: string;
  _id?: string;
  name?: string;
  userEmail?: string;
  coachName?: string;
  coachEmail?: string;
  adminName?: string;
  adminEmail?: string;
  role: 'user' | 'gym' | 'coach' | 'admin';
  GymName?: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, role: 'user' | 'gym' | 'coach' | 'admin') => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  isAuthenticated: false,
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore user on app startup
  useEffect(() => {
    bootstrapAsync();
  }, []);

  const bootstrapAsync = async () => {
    try {
      // Always clear stored user on app startup to force re-login
      await AsyncStorage.removeItem('user');
      console.log('Cleared stored user on app startup');
      setUser(null);
    } catch (e) {
      console.warn('Failed to clear session from AsyncStorage', e);
    } finally {
      console.log('Bootstrap complete, setting isLoading to false');
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, role: 'user' | 'gym' | 'coach' | 'admin') => {
    try {
      setIsLoading(true);
      console.log('Login attempt with role:', role);
      const endpoint = role === 'user' 
        ? API_ENDPOINTS.USER_LOGIN 
        : role === 'gym'
        ? API_ENDPOINTS.GYM_LOGIN
        : role === 'coach'
        ? API_ENDPOINTS.COACH_LOGIN
        : API_ENDPOINTS.ADMIN_LOGIN;

      console.log('Calling endpoint:', endpoint);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [role === 'user' ? 'userEmail' : role === 'coach' ? 'coachEmail' : role === 'admin' ? 'adminEmail' : 'email']: email,
          password: password,
        }),
      });

      const data = await response.json();
      console.log('Response status:', response.status);
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      const userData = { 
        id: role === 'user' ? data.user._id : role === 'coach' ? data.coach._id : role === 'admin' ? data.admin._id : data.gym._id,
        ...( role === 'user' ? data.user : role === 'coach' ? data.coach : role === 'admin' ? data.admin : data.gym ),
        role: role as 'user' | 'gym' | 'coach' | 'admin'
      };

      console.log('Setting user with role:', userData.role);
      // Update state first (important for immediate navigation)
      setUser(userData);
      
      // Try to persist to storage, but don't fail if it doesn't work
      try {
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        console.log('User saved to AsyncStorage');
      } catch (storageError) {
        console.warn('Failed to save user to AsyncStorage', storageError);
        // User is still logged in, just won't persist on app restart
      }
      
      // Set loading to false to trigger navigation
      setIsLoading(false);
      console.log('Login successful, isLoading set to false');
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      try {
        await AsyncStorage.removeItem('user');
      } catch (storageError) {
        console.warn('Failed to remove user from AsyncStorage', storageError);
      }
    } catch (error) {
      console.error('Logout error', error);
    }
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: user != null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
