'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { authApi } from '@/lib/api/auth';
import { User } from '@/types/user';
import toast from 'react-hot-toast';
import { handleApiError } from '@/lib/utils/errorHandling';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  setAuthData: (token: string, refreshToken: string, user: User) => void;
  refreshUser: () => Promise<void>;
  updateTokens: (token: string, refreshToken: string) => void;
}

interface RegisterData {
  email: string;
  username: string;
  password: string;
  displayName?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Global event system for token refresh notifications
export const tokenRefreshEvents = {
  listeners: new Set<(token: string, refreshToken: string) => void>(),
  
  subscribe: (callback: (token: string, refreshToken: string) => void) => {
    tokenRefreshEvents.listeners.add(callback);
    return () => tokenRefreshEvents.listeners.delete(callback);
  },
  
  notify: (token: string, refreshToken: string) => {
    tokenRefreshEvents.listeners.forEach(callback => callback(token, refreshToken));
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    
    // Subscribe to token refresh events
    const unsubscribe = tokenRefreshEvents.subscribe((token, refreshToken) => {
      console.log('🔄 AuthContext received token refresh notification');
      updateTokens(token, refreshToken);
    });
    
    return unsubscribe;
  }, []);

  const checkAuth = async () => {
    try {
      const token = Cookies.get('token');
      const refreshToken = Cookies.get('refreshToken');
      
      console.log('🔍 AuthContext checkAuth:', { 
        hasToken: !!token, 
        hasRefreshToken: !!refreshToken,
        tokenPreview: token ? token.substring(0, 20) + '...' : 'null'
      });
      
      if (token) {
        const userData = await authApi.getProfile();
        console.log('✅ User profile loaded:', userData);
        setUser(userData);
      } else {
        console.log('❌ No token found in cookies');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      Cookies.remove('token');
      Cookies.remove('refreshToken');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });
      Cookies.set('token', response.token, { expires: 7, path: '/', secure: false, sameSite: 'strict' });
      Cookies.set('refreshToken', response.refreshToken, { expires: 7, path: '/', secure: false, sameSite: 'strict' });
      setUser(response.user);
      toast.success('Login successful!');
      router.push('/stories');
    } catch (error: any) {
      handleApiError(error, 'Login failed');
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const response = await authApi.register(userData);
      
      // Check if tokens are provided (email verified) or not (needs verification)
      if (response.token && response.refreshToken) {
        Cookies.set('token', response.token, { expires: 7, path: '/', secure: false, sameSite: 'strict' });
        Cookies.set('refreshToken', response.refreshToken, { expires: 7, path: '/', secure: false, sameSite: 'strict' });
        setUser(response.user);
        toast.success('Registration successful!');
        router.push('/dashboard');
      } else {
        // No tokens means email verification is required
        toast.success('Registration successful! Please check your email to verify your account.');
        router.push('/verify-email-pending?email=' + encodeURIComponent(userData.email));
      }
    } catch (error: any) {
      handleApiError(error, 'Registration failed');
      throw error;
    }
  };

  const logout = async () => {
    try {
      const refreshToken = Cookies.get('refreshToken');
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      Cookies.remove('token');
      Cookies.remove('refreshToken');
      setUser(null);
      toast.success('Logged out successfully');
      router.push('/');
    }
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  };

  const setAuthData = (token: string, refreshToken: string, user: User) => {
    console.log('🔐 Setting auth data:', {
      token: token ? token.substring(0, 20) + '...' : 'null',
      refreshToken: refreshToken ? refreshToken.substring(0, 20) + '...' : 'null',
      user: user ? { id: user.id, email: user.email, username: user.username } : 'null'
    });
    
    Cookies.set('token', token, { expires: 7, path: '/', secure: false, sameSite: 'strict' });
    Cookies.set('refreshToken', refreshToken, { expires: 7, path: '/', secure: false, sameSite: 'strict' });
    setUser(user);
    
    console.log('✅ Auth data set successfully');
  };

  const updateTokens = (token: string, refreshToken: string) => {
    console.log('🔄 Updating tokens in AuthContext');
    Cookies.set('token', token, { expires: 7, path: '/', secure: false, sameSite: 'strict' });
    Cookies.set('refreshToken', refreshToken, { expires: 7, path: '/', secure: false, sameSite: 'strict' });
  };

  const refreshUser = async () => {
    try {
      const token = Cookies.get('token');
      if (token) {
        const userData = await authApi.getProfile();
        setUser(userData);
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    setAuthData,
    refreshUser,
    updateTokens,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}