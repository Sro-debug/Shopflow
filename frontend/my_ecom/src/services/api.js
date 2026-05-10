import axios from 'axios';
import config from '../config/config';

const api = axios.create({
  baseURL: config.API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor: attach JWT ──────────────────────────────
api.interceptors.request.use(
  (cfg) => {
    const token = localStorage.getItem('token');
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
    return cfg;
  },
  (err) => Promise.reject(err)
);

// ─── Response interceptor: handle 401 ────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
