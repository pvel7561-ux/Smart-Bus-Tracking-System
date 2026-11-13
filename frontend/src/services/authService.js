import api from './api';

const authService = {
  async login(username, password) {
    const response = await api.post('/login/', { username, password });
    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async register(data) {
    const response = await api.post('/register/', data);
    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async logout() {
    try {
      await api.post('/logout/');
    } catch (e) {
      // Proceed even if network error
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  async getMe() {
    const response = await api.get('/auth/me/');
    if (response.data) {
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },

  getUser() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
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

  isAdmin() {
    const user = this.getUser();
    return user && user.role === 'admin';
  },

  isDriver() {
    const user = this.getUser();
    return user && user.role === 'driver';
  },

  isPassenger() {
    const user = this.getUser();
    return user && user.role === 'passenger';
  }
};

export default authService;
