import api from './api';

export const reportsApi = {
  mostBorrowed: () => api.get('/reports/most-borrowed'),
  mostActiveStudents: () => api.get('/reports/most-active-students'),
  overdue: () => api.get('/reports/overdue'),
  byCategory: () => api.get('/reports/by-category'),
  monthlyBorrowing: () => api.get('/reports/monthly-borrowing'),
  missing: () => api.get('/reports/missing'),
  summary: () => api.get('/reports/summary'),
};

export default reportsApi;