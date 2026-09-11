import api from './api';

export const inventoryApi = {
  stats: () => api.get('/inventory/stats'),
  logs: (params) => api.get('/inventory/logs', params),
  scan: (payload) => api.post('/inventory/scan', payload),
  misplaced: () => api.get('/inventory/misplaced'),
  resolve: (id) => api.post(`/inventory/misplaced/${id}/resolve`),
  rfid: () => api.get('/inventory/rfid'),
};

export default inventoryApi;