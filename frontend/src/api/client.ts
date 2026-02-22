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

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('isNewUser');
      localStorage.removeItem('isGuest');
      localStorage.removeItem('guestProfile');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default client;
