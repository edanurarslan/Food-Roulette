/**
 * AuthContext - Global Authentication State Management (Simplified)
 */

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// .env okuyamazsa çökmek yerine senin IP adresini yedek olarak kullanacak
const getApiUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  // MAC IP ADRESİ: 172.20.10.4
  const fallbackUrl = 'http://172.20.10.4:8000/api/v1';
  const webFallbackUrl = 'http://localhost:8000/api/v1';

  const isPrivateIpUrl = (url: string) =>
    /https?:\/\/(10\.|127\.|172\.(1[6-9]|2\d|3[0-1])\.|192\.168\.)/.test(url);

  // Web'de private IP erişimi çoğu kullanıcıda sorun çıkarıyor; localhost daha güvenli.
  const finalUrl =
    Platform.OS === 'web'
      ? envUrl && !isPrivateIpUrl(envUrl)
        ? envUrl
        : webFallbackUrl
      : envUrl || fallbackUrl;
  // Sonunda fazladan / varsa temizle
  return finalUrl.endsWith('/') ? finalUrl.slice(0, -1) : finalUrl;
};

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

// Helper function for API calls
async function apiCall(endpoint: string, method: string = 'GET', body?: any, token?: string | null) {
  const headers: any = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const options: any = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  // URL'leri güvenli bir şekilde birleştir
  const baseUrl = getApiUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullUrl = `${baseUrl}${cleanEndpoint}`;

  console.log(`🚀 API İSTEĞİ: ${method} ${fullUrl}`); // Terminalde tam adresi göreceğiz

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(fullUrl, {
      ...options,
      signal: controller.signal,
    });
    
    if (!response.ok) {
      // Hatanın detayını terminale yazdır
      const errorText = await response.text();
      console.log(`❌ API HATASI (${response.status}):`, errorText);
      throw new Error(`API Error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Sunucuya ulaşılamadı (timeout). API URL ve backend çalışmasını kontrol et.');
    }
    console.log(`💥 NETWORK HATASI:`, error);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

// Provider Component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useState({
    isLoading: true,
    user: null as User | null,
    token: null as string | null,
  });

  // Check token on app start
  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        const savedToken = await AsyncStorage.getItem('userToken');

        if (savedToken && isMounted) {
          try {
            const response = await apiCall('/auth/me', 'GET', undefined, savedToken);
            if (isMounted) {
              dispatch({
                isLoading: false,
                token: savedToken,
                user: response,
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

  // Login function
  const login = async (email: string, password: string) => {
    dispatch({ isLoading: true, user: state.user, token: state.token });

    try {
      const response = await apiCall('/auth/login', 'POST', {
        username: email,
        password,
      });

      const { access_token } = response;
      await AsyncStorage.setItem('userToken', access_token);

      try {
        const userResponse = await apiCall('/auth/me', 'GET', undefined, access_token);
        dispatch({
          isLoading: false,
          token: access_token,
          user: userResponse,
        });
      } catch (error) {
        throw error;
      }
    } catch (error) {
      dispatch({ isLoading: false, user: null, token: null });
      throw error;
    }
  };

  // Register function
  const register = async (username: string, email: string, password: string) => {
    dispatch({ isLoading: true, user: state.user, token: state.token });

    try {
      await apiCall('/auth/register', 'POST', {
        username,
        email,
        password,
      });

      const loginResponse = await apiCall('/auth/login', 'POST', {
        username: email,
        password,
      });

      const { access_token } = loginResponse;
      await AsyncStorage.setItem('userToken', access_token);

      const userResponse = await apiCall('/auth/me', 'GET', undefined, access_token);

      dispatch({
        isLoading: false,
        token: access_token,
        user: userResponse,
      });
    } catch (error) {
      dispatch({ isLoading: false, user: null, token: null });
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    dispatch({ isLoading: true, user: state.user, token: state.token });

    try {
      await apiCall('/auth/logout', 'POST', {}, state.token);
    } catch (error) {
      console.error('Logout error:', error);
    }

    await AsyncStorage.removeItem('userToken');
    dispatch({
      isLoading: false,
      user: null,
      token: null,
    });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
