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

const formatWaitTime = (seconds?: number): string => {
  if (!seconds || isNaN(seconds) || seconds <= 0) return 'a moment';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 0 && s > 0) return `${m}m ${s}s`;
  if (m > 0) return `${m} minute${m > 1 ? 's' : ''}`;
  return `${s} second${s > 1 ? 's' : ''}`;
};

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
      if (!isLoginRequest) {
        const retryAfter = error.response?.data?.retryAfter || Number(error.response?.headers?.['retry-after']);
        toast.error('Too many requests. Please wait ' + formatWaitTime(retryAfter) + ' before retrying.');
      }
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
