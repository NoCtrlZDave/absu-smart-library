import api from './api';

export const inventoryApi = {
  stats: () => api.get('/inventory/stats'),
  books: (params) => api.get('/inventory/books', params),
  logs: (params) => api.get('/inventory/logs', params),
  scan: (payload) => api.post('/inventory/scan', payload),
  misplaced: () => api.get('/inventory/misplaced'),
  resolve: (id) => api.post(`/inventory/misplaced/${id}/resolve`),
  rfid: () => api.get('/inventory/rfid'),
  verifications: (params) => api.get('/inventory/verifications', params),
  verification: (id) => api.get(`/inventory/verifications/${id}`),
  createVerification: (payload) => api.post('/inventory/verifications', payload),
  scanVerification: (id, payload) => api.post(`/inventory/verifications/${id}/scan`, payload),
  completeVerification: (id) => api.post(`/inventory/verifications/${id}/complete`),
  cancelVerification: (id, reason) => api.post(`/inventory/verifications/${id}/cancel`, { reason }),
  verificationReport: (id) => api.get(`/inventory/verifications/${id}/report`),
};

export default inventoryApi;