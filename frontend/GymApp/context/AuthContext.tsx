import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '@/constants/api';

export interface User {
  id: string;
  _id?: string;
  name?: string;
  userEmail?: string;
  role: 'user' | 'gym';
  GymName?: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, role: 'user' | 'gym') => Promise<void>;
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
      // Add a small delay to ensure native modules are loaded
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const storedUser = await AsyncStorage.getItem('user');
      console.log('StoredUser retrieved:', storedUser ? 'Found' : 'Not found');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        // Normalize _id to id if id doesn't exist
        if (!parsedUser.id && parsedUser._id) {
          parsedUser.id = parsedUser._id;
        }
        console.log('Parsed user role:', parsedUser.role);
        setUser(parsedUser);
      }
    } catch (e) {
      console.warn('Failed to restore session from AsyncStorage', e);
      // Continue without stored user - they'll need to login again
    } finally {
      console.log('Bootstrap complete, setting isLoading to false');
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, role: 'user' | 'gym') => {
    try {
      setIsLoading(true);
      console.log('Login attempt with role:', role);
      const endpoint = role === 'user' 
        ? API_ENDPOINTS.USER_LOGIN 
        : API_ENDPOINTS.GYM_LOGIN;

      console.log('Calling endpoint:', endpoint);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [role === 'user' ? 'userEmail' : 'email']: email,
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
        id: role === 'user' ? data.user._id : data.gym._id,
        ...( role === 'user' ? data.user : data.gym ),
        role: role as 'user' | 'gym'
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
