import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // change if your backend URL is different
  withCredentials: true, // use only if you're handling cookies/sessions
  headers: {
    'Content-Type': 'application/json'
  }
});

export default api;
