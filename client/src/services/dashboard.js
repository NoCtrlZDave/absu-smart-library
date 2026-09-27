import api from './api';

export const dashboardApi = {
  librarian: () => api.get('/dashboard/librarian'),
  admin: () => api.get('/dashboard/admin'),
};

export default dashboardApi;