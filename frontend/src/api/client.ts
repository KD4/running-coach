import axios from 'axios';

console.log('[API] VITE_API_URL =', import.meta.env.VITE_API_URL);

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;
