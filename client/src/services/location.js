import api from './api';

export const locationApi = {
  map: () => api.get('/location/map'),
  resolve: (params) => api.get('/location/resolve', params),
  categories: () => api.get('/location/categories'),
};