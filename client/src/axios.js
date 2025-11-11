import axios from 'axios';

// Use client environment variable or default to localhost:5000
axios.defaults.baseURL = import.meta.env.VITE_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:5000';
axios.defaults.withCredentials = true;

axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default axios;
