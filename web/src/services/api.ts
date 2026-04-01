import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // Endereço do seu backend NestJS
});

// Interceptor opcional: Injeta o token automaticamente se ele existir
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});