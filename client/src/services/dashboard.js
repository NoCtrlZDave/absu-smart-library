import api from './api';

export const dashboardApi = {
  student: () => api.get('/dashboard/student'),
  librarian: () => api.get('/dashboard/librarian'),
  admin: () => api.get('/dashboard/admin'),
};

export default dashboardApi;