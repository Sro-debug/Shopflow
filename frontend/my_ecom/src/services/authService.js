import api from './api';

const authService = {
  async register(name, email, password) {
    const { data } = await api.post('/auth/register', { name, email, password });
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  async login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  async loginWithGoogle(googleData) {
    const { data } = await api.post('/auth/oauth/google', googleData);
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  async getProfile() {
    const { data } = await api.get('/auth/profile');
    return data;
  },

  async updateProfile(updates) {
    const { data } = await api.put('/auth/profile', updates);
    return data;
  },

  async changePassword(currentPassword, newPassword) {
    const { data } = await api.put('/auth/change-password', { currentPassword, newPassword });
    return data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  },

  getToken() {
    return localStorage.getItem('token');
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  },
};

export default authService;
