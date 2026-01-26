// axiosInstance.js - Consolidated axios instance with proper token and CSRF handling
import axios from 'axios';
import { toast } from 'react-toastify';

// Use environment variable for baseURL
const baseURL = 'http://localhost:5000/api'; // import.meta.env.VITE_API_URL;

// Log the base URL for debugging
console.log('API Base URL:', baseURL);

// Create axios instance with default config
const instance = axios.create({
  baseURL,
  timeout: 30000, // 30 seconds
  withCredentials: true, // Send cookies with cross-origin requests
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
});

// Helper function to get CSRF token from cookies
const getCsrfToken = () => {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'XSRF-TOKEN') {
      return decodeURIComponent(value);
    }
  }
  return null;
};

// Flag to prevent multiple token refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor - Add auth token and CSRF token to requests
instance.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');

    // Add authorization header if token exists
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // Skip CSRF token for login/register/refresh endpoints (they don't need it)
    const skipCsrfEndpoints = ['/auth/login', '/auth/register', '/auth/refresh-token'];
    const shouldSkipCsrf = skipCsrfEndpoints.some(endpoint => config.url?.includes(endpoint));

    // Add CSRF token for all non-GET requests (except login/register)
    if (!shouldSkipCsrf && config.method !== 'get' && config.method !== 'GET') {
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        config.headers['x-csrf-token'] = csrfToken;
      }
    }

    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors and token refresh
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle network errors
    if (error.code === 'ERR_NETWORK') {
      console.error('Network Error: Please check your internet connection');
      toast.error('Unable to connect to the server. Please check your internet connection.');
      return Promise.reject(error);
    }

    if (!error.response) {
      return Promise.reject(error);
    }

    const { status, data } = error.response;

    // Handle 401 Unauthorized - Try to refresh token
    if (status === 401 && !originalRequest._retry) {
      // Don't try to refresh for login/logout endpoints
      if (originalRequest.url.includes('/auth/login') ||
        originalRequest.url.includes('/auth/logout') ||
        originalRequest.url.includes('/auth/register')) {
        // Clear tokens and redirect to login
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('csrfToken');
        delete instance.defaults.headers.common['Authorization'];

        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      // If already refreshing, queue the request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return instance(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh the token via the server
        const response = await axios.post(`${baseURL}/auth/refresh-token`, {}, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const { token } = response.data;

        // Store the new token
        localStorage.setItem('token', token);

        // Update the Authorization header
        instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        originalRequest.headers['Authorization'] = `Bearer ${token}`;

        // Process any queued requests
        processQueue(null, token);

        // Retry the original request
        return instance(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear tokens and redirect to login
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('csrfToken');
        delete instance.defaults.headers.common['Authorization'];

        // Process any queued requests with error
        processQueue(refreshError, null);

        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle other error statuses
    switch (status) {
      case 400:
        console.error('Bad Request:', data.message || 'Invalid request');
        break;

      case 403:
        console.error('Forbidden: You do not have permission to access this resource');
        toast.error('You do not have permission to perform this action');
        break;

      case 404:
        console.error('Resource not found');
        toast.error('The requested resource was not found');
        break;

      case 429:
        console.error('Too many requests: Please wait before trying again');
        toast.error('Too many requests. Please wait before trying again.');
        break;

      case 500:
        console.error('Server Error: Please try again later');
        toast.error('A server error occurred. Please try again later.');
        break;

      default:
        console.error(`Error ${status}: ${data?.message || 'An error occurred'}`);
    }

    return Promise.reject(error);
  }
);

export default instance;