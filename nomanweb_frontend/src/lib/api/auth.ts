import { apiClient } from './client';
import { AuthResponse, User } from '@/types/user';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  username: string;
  password: string;
  displayName?: string;
}

const authApi = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await apiClient.post(`/auth/login`, data);
    return response.data;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await apiClient.post(`/auth/register`, data);
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await apiClient.get(`/auth/profile`);
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await apiClient.put(`/auth/profile`, data);
    return response.data;
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<void> => {
    const response = await apiClient.put(`/auth/change-password`, data);
    return response.data;
  },

  forgotPassword: async (email: string): Promise<void> => {
    const response = await apiClient.post(`/auth/forgot-password`, { email });
    return response.data;
  },

  resetPassword: async (data: { token: string; password: string }): Promise<void> => {
    const response = await apiClient.post(`/auth/reset-password`, data);
    return response.data;
  },

  verifyEmail: async (token: string): Promise<void> => {
    const response = await apiClient.post(`/auth/verify-email`, { token });
    return response.data;
  },

  resendVerification: async (email: string): Promise<void> => {
    const response = await apiClient.post(`/auth/resend-verification`, { email });
    return response.data;
  },

  changeEmail: async (data: { currentPassword: string; newEmail: string }): Promise<void> => {
    const response = await apiClient.post(`/auth/change-email`, data);
    return response.data;
  },

  changeEmailOAuth: async (data: { newEmail: string }): Promise<void> => {
    const response = await apiClient.post(`/auth/change-email-oauth`, data);
    return response.data;
  },

  changeUsername: async (data: { currentPassword: string; newUsername: string }): Promise<void> => {
    const response = await apiClient.post(`/auth/change-username`, data);
    return response.data;
  },

  changeUsernameOAuth: async (data: { newUsername: string }): Promise<void> => {
    const response = await apiClient.post(`/auth/change-username-oauth`, data);
    return response.data;
  },

  verifyEmailChange: async (token: string): Promise<void> => {
    const response = await apiClient.post(`/auth/verify-email-change`, { token });
    return response.data;
  },

  resendEmailChangeVerification: async (newEmail: string): Promise<void> => {
    const response = await apiClient.post(`/auth/resend-email-change-verification`, { newEmail });
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await apiClient.post(`/auth/refresh`, { refreshToken });
    return response.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    const response = await apiClient.post(`/auth/logout`, { refreshToken });
    return response.data;
  },

  // OAuth methods
  googleLogin: async (idToken: string): Promise<AuthResponse> => {
    const response = await apiClient.post(`/oauth/google`, { idToken });
    return response.data;
  },

  lineLogin: async (accessToken: string): Promise<AuthResponse> => {
    console.log('LINE Login API call:');
    console.log('- Access token length:', accessToken.length);
    console.log('- Access token preview:', accessToken.substring(0, 20) + '...');
    console.log('- API URL:', `/oauth/line`);
    
    const response = await apiClient.post(`/oauth/line`, { accessToken });
    return response.data;
  },

  linkGoogleAccount: async (idToken: string): Promise<AuthResponse> => {
    const response = await apiClient.post(`/oauth/link-google`, { idToken });
    return response.data;
  },

  linkLineAccount: async (accessToken: string): Promise<AuthResponse> => {
    const response = await apiClient.post(`/oauth/link-line`, { accessToken });
    return response.data;
  },
};

export { authApi }; 