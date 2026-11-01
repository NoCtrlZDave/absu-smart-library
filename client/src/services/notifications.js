import api from './api';

export const notificationsApi = {
  my: (params) => api.get('/notifications/my', params),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  integrationStatus: () => api.get('/notifications/integration-status'),
  deliveries: (params) => api.get('/notifications/deliveries', params),
  templates: () => api.get('/notifications/templates'),
  saveTemplate: (event, payload) => api.put(`/notifications/templates/${event}`, payload),
  runReminders: () => api.post('/notifications/reminders/run'),
  test: (channels) => api.post('/notifications/test', { channels }),
};

export default notificationsApi;
