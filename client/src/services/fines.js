import api from './api';

export const finesApi = {
  my: () => api.get('/fines/my'),
  list: (params) => api.get('/fines', params),
  summary: () => api.get('/fines/summary'),
  payments: (params) => api.get('/fines/payments', params),
  pay: (borrowingId, payload) => api.post(`/fines/${borrowingId}/pay`, payload),
  waive: (borrowingId, payload) => api.post(`/fines/${borrowingId}/waive`, payload),
  report: (params) => api.get('/fines/report', params),
};

export default finesApi;
