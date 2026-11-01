import api from './api';

export const borrowingsApi = {
  issue: (payload) => api.post('/borrowings', payload),
  my: (params) => api.get('/borrowings/my', params),
  stats: () => api.get('/borrowings/stats'),
  list: (params) => api.get('/borrowings', params),
  returnBook: (id, payload) => api.patch(`/borrowings/${id}/return`, payload),
  renewalEligibility: (id) => api.get(`/borrowings/${id}/renewal-eligibility`),
  requestRenewal: (id, reason) => api.post(`/borrowings/${id}/renew-request`, { reason }),
  renew: (id) => api.post(`/borrowings/${id}/renew`),
  renewals: (params) => api.get('/borrowings/renewals', params),
  approveRenewal: (id) => api.patch(`/borrowings/renewals/${id}/approve`),
  rejectRenewal: (id, reason) => api.patch(`/borrowings/renewals/${id}/reject`, { reason }),
};

export default borrowingsApi;
