import axios from 'axios';
import { getMockResponse } from './mockData';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const isDemoMode = () => localStorage.getItem('demo_mode') === 'true';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Mock interceptor for demo mode
api.interceptors.request.use(
  (config) => {
    // If in demo mode, intercept GET requests and return mock data
    if (isDemoMode() && config.method === 'get') {
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockResponse = getMockResponse(config.url);
          resolve({
            data: mockResponse,
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
          });
        }, 300); // Simulate network delay
      });
    }

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
    // In demo mode, don't redirect on errors
    if (isDemoMode()) {
      return Promise.resolve({
        data: { success: false, message: 'Demo mode: API call would fail' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: error.config,
      });
    }

    // Only redirect to login if user was already authenticated (token expired)
    // Don't redirect on login failures
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
