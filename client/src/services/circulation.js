import api from './api';

export const circulationApi = {
  borrowings: (params) => api.get('/circulation/borrowings', params),
  issueBook: (payload) => api.post('/circulation/borrowings', payload),
  returnBook: (id) => api.post(`/circulation/borrowings/${id}/return`),
  renew: (id, days) => api.post(`/circulation/borrowings/${id}/renew`, { days }),
  returns: (params) => api.get('/circulation/returns', params),
  myBorrowings: () => api.get('/circulation/my/borrowings'),
  myHistory: () => api.get('/circulation/my/history'),
  reservations: (params) => api.get('/circulation/reservations', params),
  createReservation: (payload) => api.post('/circulation/reservations', payload),
  cancelReservation: (id) => api.post(`/circulation/reservations/${id}/cancel`),
  fulfillReservation: (id) => api.post(`/circulation/reservations/${id}/fulfill`),
  myReservations: () => api.get('/circulation/my/reservations'),
};

export default circulationApi;