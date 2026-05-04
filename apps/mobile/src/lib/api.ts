import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = globalThis.session?.token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
};

export const vehiclesApi = {
  getAll: (params?: any) => api.get('/vehicles', { params }),
  getOne: (id: string) => api.get(`/vehicles/${id}`),
};

export const reservationsApi = {
  getAll: () => api.get('/reservations'),
  create: (data: any) => api.post('/reservations', data),
  cancel: (id: string) => api.post(`/reservations/${id}/cancel`),
};

export const usersApi = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data: any) => api.patch('/users/me', data),
};

export const formatPrice = (price: number) => `${price} MAD`;
export const formatDate = (date: string) => new Date(date).toLocaleDateString('fr-FR');
export const calculateDays = (start: string, end: string) => {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};