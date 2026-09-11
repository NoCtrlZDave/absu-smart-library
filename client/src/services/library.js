import api from './api';

export const libraryApi = {
  tree: () => api.get('/library/tree'),
  list: (type) => api.get('/library', { type }),
  create: (type, payload) => api.post(`/library/${type}`, payload),
  update: (id, payload) => api.put(`/library/nodes/${id}`, payload),
  remove: (id) => api.delete(`/library/nodes/${id}`),
};

export default libraryApi;