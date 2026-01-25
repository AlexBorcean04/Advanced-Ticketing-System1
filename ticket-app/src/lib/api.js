import axios from 'axios';
import { getUserToken } from './userAuth.js';

const resolveBaseUrl = (value, { hostname, port, path }) => {
  if (!hostname) return value;
  if (!value) {
    return `http://${hostname}:${port}${path}`;
  }
  if (value.includes('localhost') && hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return value.replace('localhost', hostname);
  }
  return value;
};

const hostname =
  typeof window !== 'undefined' && window.location ? window.location.hostname : '';

const api = axios.create({
  baseURL: resolveBaseUrl(import.meta.env.VITE_API_URL, {
    hostname,
    port: 5000,
    path: '/api',
  }),
});

api.interceptors.request.use((config) => {
  const token = getUserToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
