'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { authApi } from '@/lib/api/auth';
import { User } from '@/types/user';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  setAuthData: (token: string, user: User) => void;
}

interface RegisterData {
  email: string;
  username: string;
  password: string;
  displayName?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = Cookies.get('token');
      if (token) {
        const userData = await authApi.getProfile();
        setUser(userData);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      Cookies.remove('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });
      Cookies.set('token', response.token, { expires: 7 });
      setUser(response.user);
      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const response = await authApi.register(userData);
      
      // Check if tokens are provided (email verified) or not (needs verification)
      if (response.token) {
        Cookies.set('token', response.token, { expires: 7 });
        setUser(response.user);
        toast.success('Registration successful!');
        router.push('/dashboard');
      } else {
        // No tokens means email verification is required
        toast.success('Registration successful! Please check your email to verify your account.');
        router.push('/verify-email-pending?email=' + encodeURIComponent(userData.email));
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
      throw error;
    }
  };

  const logout = () => {
    Cookies.remove('token');
    setUser(null);
    toast.success('Logged out successfully');
    router.push('/');
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  };

  const setAuthData = (token: string, user: User) => {
    Cookies.set('token', token, { expires: 7 });
    setUser(user);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    setAuthData,
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