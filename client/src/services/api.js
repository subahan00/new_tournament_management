import axios from 'axios';

const token = localStorage.getItem('authToken'); // ✅ Declare outside

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }), // ✅ Optional Authorization header
  },
});

export default api;
