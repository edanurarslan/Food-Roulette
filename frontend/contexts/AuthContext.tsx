/**
 * AuthContext - Global Authentication State Management
 */

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance } from 'axios';

// Types
export interface User {
  id: string;
  username: string;
  email: string;
  bio?: string;
  profile_image_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Create Context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API instance
const api: AxiosInstance = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  timeout: 10000,
});

// Provider Component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useState({
    isLoading: true,
    user: null as User | null,
    token: null as string | null,
  });

  // Uygulama başladığında token'ı kontrol et
  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        const savedToken = await AsyncStorage.getItem('userToken');

        if (savedToken && isMounted) {
          api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;

          try {
            const response = await api.get('/auth/me');
            if (isMounted) {
              dispatch({
                isLoading: false,
                token: savedToken,
                user: response.data,
              });
            }
          } catch (error) {
            console.log('Token validation failed');
            await AsyncStorage.removeItem('userToken');
            if (isMounted) {
              dispatch({
                isLoading: false,
                user: null,
                token: null,
              });
            }
          }
        } else if (isMounted) {
          dispatch({
            isLoading: false,
            user: null,
            token: null,
          });
        }
      } catch (error) {
        console.error('Bootstrap error:', error);
        if (isMounted) {
          dispatch({
            isLoading: false,
            user: null,
            token: null,
          });
        }
      }
    };

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  // Login Function
  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await api.post('/auth/login', {
        username: email,
        password,
      });

      const { access_token } = response.data;

      // Token'ı kaydet
      await AsyncStorage.setItem('userToken', access_token);
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      // User bilgisini al
      const userResponse = await api.get('/auth/me');

      dispatch({
        isLoading: false,
        token: access_token,
        user: userResponse.data,
      });
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Login başarısız';
      throw new Error(message);
    }
  };

  // Register Function
  const register = async (
    username: string,
    email: string,
    password: string
  ): Promise<void> => {
    try {
      await api.post('/auth/register', {
        username,
        email,
        password,
      });

      // Otomatik login yap
      const loginResponse = await api.post('/auth/login', {
        username: email,
        password,
      });

      const { access_token } = loginResponse.data;

      // Token'ı kaydet
      await AsyncStorage.setItem('userToken', access_token);
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      // User bilgisini al
      const userResponse = await api.get('/auth/me');

      dispatch({
        isLoading: false,
        token: access_token,
        user: userResponse.data,
      });
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Registration başarısız';
      throw new Error(message);
    }
  };

  // Logout Function
  const logout = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem('userToken');
      delete api.defaults.headers.common['Authorization'];
      dispatch({
        isLoading: false,
        user: null,
        token: null,
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value: AuthContextType = {
    user: state.user,
    token: state.token,
    isLoading: state.isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook
export const useAuth = (): AuthContextType => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
