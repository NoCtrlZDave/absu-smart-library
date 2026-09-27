import api from './api';

export const adminApi = {
  users: (params) => api.get('/admin/users', params),
  createUser: (payload) => api.post('/admin/users', payload),
  updateUser: (id, payload) => api.patch(`/admin/users/${id}`, payload),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  librarians: () => api.get('/admin/librarians'),
  logs: (params) => api.get('/admin/logs', params),
  settings: () => api.get('/admin/settings'),
  saveSettings: (settings) => api.put('/admin/settings', { settings }),
};

export default adminApi;