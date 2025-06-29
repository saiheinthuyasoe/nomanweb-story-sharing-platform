import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect to login for certain critical endpoints that indicate session expiry
      const url = error.config?.url || '';
      const isSessionExpiryEndpoint = url.includes('/auth/profile') || 
                                     url.includes('/my-stories') ||
                                     url.includes('/dashboard') ||
                                     url.includes('/publish') ||
                                     url.includes('/unpublish');
      
      // Don't auto-logout for comment creation or other user actions - let them handle the error
      const isUserActionEndpoint = url.includes('/comments') ||
                                   url.includes('/reactions') ||
                                   url.includes('/reading-lists');
      
      if (isSessionExpiryEndpoint && !isUserActionEndpoint) {
        Cookies.remove('token');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient; 