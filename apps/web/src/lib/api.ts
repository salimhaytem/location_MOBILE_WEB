import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/connexion';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

export const vehiclesApi = {
  getAll: (params?: any) => api.get('/vehicles', { params }),
  getOne: (id: string) => api.get(`/vehicles/${id}`),
  getCategories: () => api.get('/vehicles/categories'),
  create: (data: any) => api.post('/vehicles', data),
  update: (id: string, data: any) => api.patch(`/vehicles/${id}`, data),
  updateStatus: (id: string, status: string) => api.patch(`/vehicles/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/vehicles/${id}`),
};

export const reservationsApi = {
  getAll: () => api.get('/reservations'),
  getOne: (id: string) => api.get(`/reservations/${id}`),
  create: (data: any) => api.post('/reservations', data),
  cancel: (id: string) => api.post(`/reservations/${id}/cancel`),
};

export const usersApi = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data: any) => api.patch('/users/me', data),
};

export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getFinancialReport: (startDate: string, endDate: string) =>
    api.get('/admin/reports/financial', { params: { startDate, endDate } }),
  exportData: (format: string, from?: string, to?: string) => 
    api.get('/admin/reports/export', { params: { format, from, to } }),
  getCashJournal: (date?: string) => api.get('/admin/cash-journal', { params: { date } }),
  getRevenueChart: () => api.get('/admin/revenue-chart'),
  getTodayReservations: () => api.get('/admin/today-reservations'),
};