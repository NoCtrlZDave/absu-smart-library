import api from './api';

export const reportsApi = {
  byCategory: () => api.get('/reports/by-category'),
  missing: () => api.get('/reports/missing'),
  byLocation: () => api.get('/reports/by-location'),
  summary: () => api.get('/reports/summary'),
};

export default reportsApi;