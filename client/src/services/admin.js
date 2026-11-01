import api from './api';

export const adminApi = {
  users: (params) => api.get('/admin/users', params),
  createUser: (payload) => api.post('/admin/users', payload),
  updateUser: (id, payload) => api.patch(`/admin/users/${id}`, payload),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  librarians: () => api.get('/admin/librarians'),
  students: (params) => api.get('/admin/students', params),
  studentOptions: () => api.get('/admin/students/options'),
  createStudent: (payload) => api.post('/admin/students', payload),
  logs: (params) => api.get('/admin/logs', params),
  settings: () => api.get('/admin/settings'),
  settingsDefaults: () => api.get('/admin/settings/defaults'),
  saveSettings: (settings) => api.put('/admin/settings', { settings }),
  resetPassword: (id) => api.patch(`/admin/users/${id}/reset-password`),
  previewStudentImport: (rows) => api.post('/admin/students/import/preview', { rows }),
  importStudents: (rows) => api.post('/admin/students/import', { rows }),
};

export default adminApi;