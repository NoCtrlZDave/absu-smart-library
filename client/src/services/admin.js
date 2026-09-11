import api from './api';

export const adminApi = {
  users: (params) => api.get('/admin/users', params),
  createUser: (payload) => api.post('/admin/users', payload),
  bulkCreateStudents: (students) => api.post('/admin/students/bulk', { students }),
  updateUser: (id, payload) => api.patch(`/admin/users/${id}`, payload),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  librarians: () => api.get('/admin/librarians'),
  staffRequests: () => api.get('/admin/staff-requests'),
  verifyStaff: (id) => api.post(`/admin/staff-requests/${id}/verify`),
  rejectStaff: (id) => api.post(`/admin/staff-requests/${id}/reject`),
  logs: (params) => api.get('/admin/logs', params),
  settings: () => api.get('/admin/settings'),
  saveSettings: (settings) => api.put('/admin/settings', { settings }),
};

export default adminApi;