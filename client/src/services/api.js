import axios from 'axios';

const api = axios.create({
  baseURL: `${process.env.REACT_APP_BACKEND_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for dynamic token handling
api.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  
  // Only add Authorization header if token exists
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Handle unauthorized errors (token expired, invalid, etc.)
      localStorage.removeItem('authToken');
      window.location = '/login'; // Redirect to login
    }
    return Promise.reject(error);
  }
);

export default api;