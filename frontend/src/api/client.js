import axios from 'axios';
import { ENV } from '../config/env';

export const apiClient = axios.create({
  baseURL: ENV.API_BASE_URL || '',
  headers: {
    'Content-Type': 'application/json',
    ...(ENV.API_KEY ? { 'x-api-key': ENV.API_KEY } : {})
  }
});

// For authenticated requests
export const authApiClient = axios.create({
  baseURL: ENV.API_BASE_URL || '',
  headers: {
    'Content-Type': 'application/json',
    ...(ENV.API_KEY ? { 'x-api-key': ENV.API_KEY } : {})
  }
});

authApiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

authApiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Request a new access token
        const { data } = await apiClient.post('/api/auth/refresh-token', { refreshToken });
        
        localStorage.setItem('token', data.token);
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }

        // Set global default axios auth header for backward compatibility
        axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;

        // Retry the original request
        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return authApiClient(originalRequest);
      } catch (refreshError) {
        console.error('Session refresh failed, logging out:', refreshError);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('gita_wisdom_profile');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
