import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token to every request and correctly handle FormData
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('portal_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // When sending FormData, remove Content-Type so browser/axios sets multipart/form-data with boundary
  if (config.data instanceof FormData) {
    if (config.headers) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }
  }

  return config;
});

// Helper to resolve backend-served file URLs
export const getFileUrl = (url?: string): string => {
  if (!url) return '#';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const backendBase = API_BASE_URL.replace(/\/api\/?$/, '');
  return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
};

// Response error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || (error.response?.status === 403 && error.response?.data?.is_restricted)) {
      // Clear token if unauthenticated, expired, or restricted
      localStorage.removeItem('portal_auth_token');
      localStorage.removeItem('portal_auth_user');

      if (error.response?.data?.is_restricted && error.response?.data?.message) {
        sessionStorage.setItem('portal_restriction_msg', error.response.data.message);
      }

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
