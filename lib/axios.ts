// frontend/lib/axios.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthSession();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

export const getApiErrorMessage = (error: any): string => {
  return error.response?.data?.message || error.message || 'حدث خطأ غير متوقع';
};

export const setAuthSession = (data: { access_token: string; user: any }) => {
  localStorage.setItem('token', data.access_token);
  localStorage.setItem('user', JSON.stringify(data.user));

  // مهم للـ Middleware
  document.cookie = `tracking_token=${data.access_token}; path=/; max-age=86400`;
  document.cookie = `tracking_role=${data.user.role}; path=/; max-age=86400`;
};

export const clearAuthSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  document.cookie = 'tracking_token=; path=/; max-age=0';
  document.cookie = 'tracking_role=; path=/; max-age=0';
};