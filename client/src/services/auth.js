import api from './api';

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  me: () => api.get('/auth/me'),
  updateProfile: (payload) => api.put('/auth/profile', payload),
  changePassword: ({ currentPassword, newPassword }) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  validateActivation: (token) => api.get(`/auth/activation/${token}`),
  activate: (token, password) => api.post('/auth/activate', { token, password }),
};

export default authApi;