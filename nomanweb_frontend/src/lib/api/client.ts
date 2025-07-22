import axios from 'axios';
import Cookies from 'js-cookie';
import { tokenRefreshEvents } from '@/contexts/AuthContext';

// Global query client reference for invalidation
let queryClient: any = null;

export const setQueryClient = (client: any) => {
  queryClient = client;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies in requests
});

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

// Subscribe to token refresh
function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

// Notify all subscribers when token is refreshed
function onTokenRefreshed(token: string) {
  refreshSubscribers.map(cb => cb(token));
  refreshSubscribers = [];
}

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config: any) => {
    const token = Cookies.get('token');
    console.log('🔍 All cookies:', document.cookie);
    console.log('🔍 Token from cookie:', token ? `${token.substring(0, 20)}...` : 'NOT FOUND');
    
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Adding Authorization header to request:', config.url);
    } else {
      console.warn('❌ No token found in cookies for request:', config.url);
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors and refresh tokens
apiClient.interceptors.response.use(
  (response: any) => response,
  async (error: any) => {
    const originalRequest = error.config;
    
    console.log('🚨 API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      url: originalRequest?.url,
      method: originalRequest?.method
    });
    
    // Handle rate limiting (429)
    if (error.response?.status === 429) {
      console.log('⏰ Rate limit exceeded:', error.response?.data);
      // Don't retry rate limited requests
      return Promise.reject(error);
    }
    
    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
      console.log(`🔄 ${error.response?.status} Error detected, attempting token refresh...`);
      
      // Check if this is a token-related error or a permission error
      const errorMessage = error.response?.data?.message || '';
      const isTokenExpired = errorMessage.includes('expired') || errorMessage.includes('Invalid token');
      
      if (isRefreshing) {
        console.log('⏳ Already refreshing, waiting for token...');
        // Wait for the token to be refreshed
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = Cookies.get('refreshToken');
        if (!refreshToken) {
          console.error('❌ No refresh token available');
          throw new Error('No refresh token available');
        }

        console.log('🔄 Making refresh request with token:', refreshToken.substring(0, 20) + '...');
        
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken: refreshToken
        });

        console.log('✅ Token refresh successful:', response.data);
        
        const { token: newAccessToken, refreshToken: newRefreshToken } = response.data as any;
        
        if (!newAccessToken || !newRefreshToken) {
          console.error('❌ Invalid response from refresh endpoint:', response.data);
          throw new Error('Invalid refresh response');
        }
        
        // Update cookies with new tokens
        Cookies.set('token', newAccessToken, { expires: 7, path: '/', secure: false, sameSite: 'strict' });
        Cookies.set('refreshToken', newRefreshToken, { expires: 7, path: '/', secure: false, sameSite: 'strict' });

        console.log('🍪 Updated cookies with new tokens');
        
        // Notify AuthContext about token refresh
        tokenRefreshEvents.notify(newAccessToken, newRefreshToken);

        // Invalidate React Query cache to force fresh data
        if (queryClient) {
          console.log('🔄 Invalidating React Query cache due to token refresh');
          queryClient.invalidateQueries();
        }

        // Notify all subscribers
        onTokenRefreshed(newAccessToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        console.log('🔄 Retrying original request with new token');
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        
        // Only clear tokens and redirect if it's a token-related error
        if (isTokenExpired) {
          Cookies.remove('token');
          Cookies.remove('refreshToken');
          
          if (typeof window !== 'undefined') {
            console.log('🔄 Redirecting to login due to token expiration...');
            window.location.href = '/login';
          }
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient; 