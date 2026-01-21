import axios from 'axios';
import { getToken } from './auth.js';

const adminApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

adminApi.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default adminApi;
