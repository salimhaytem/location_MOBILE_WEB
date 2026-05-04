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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      globalThis.session = { token: null };
    }
    return Promise.reject(error);
  }
);

export const authApi = { login: (data: any) => api.post('/auth/login', data) };

export const planningApi = {
  getDaily: (date: string) => api.get('/checkinout/planning', { params: { date } }),
  checkIn: (id: string, data: any) => api.post(`/checkinout/${id}/checkin`, data),
  checkOut: (id: string, data: any) => api.post(`/checkinout/${id}/checkout`, data),
  validateCash: (id: string) => api.post(`/checkinout/${id}/validate-cash`),
};

export const incidentsApi = {
  create: (data: any) => api.post('/incidents', data),
};

export const formatPrice = (price: number) => `${price} MAD`;
export const formatDate = (date: string) => new Date(date).toLocaleDateString('fr-FR');
export const formatTime = (date: string) => new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });