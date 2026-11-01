import api from './api';

export const reservationsApi = {
  create: (payload) => api.post('/reservations', payload),
  my: (params) => api.get('/reservations/my', params),
  stats: () => api.get('/reservations/stats'),
  list: (params) => api.get('/reservations', params),
  get: (id) => api.get(`/reservations/${id}`),
  approve: (id) => api.patch(`/reservations/${id}/approve`),
  reject: (id, reason) => api.patch(`/reservations/${id}/reject`, { reason }),
  cancel: (id, reason) => api.patch(`/reservations/${id}/cancel`, { reason }),
  collect: (id, dueDate) => api.post(`/borrowings/reservations/${id}/collect`, { dueDate }),
};

export default reservationsApi;
