import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Ignore cancellations/aborts — caller handles (prevents false "Failed to load" toasts on tab switch)
    if (axios.isCancel(error) || error.code === 'ERR_CANCELED' || error.name === 'CanceledError') {
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    // Rate-limited — surface once
    if (error.response?.status === 429) {
      toast.error('Too many requests. Please wait a moment and retry.');
      return Promise.reject(error);
    }

    // Network error (backend down / nginx 502)
    if (!error.response && error.request) {
      // No global toast here — let page-level handler show contextual message (e.g. "Failed to load tasks")
      // but log for debugging
      console.warn('[api] Network error', error.config?.url, error.message);
    }

    // 500+ is handled per-page to avoid duplicate toasts; no global toast here
    
    return Promise.reject(error);
  }
);

export default api;
