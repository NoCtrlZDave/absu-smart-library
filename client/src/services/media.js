import api from './api';

export const mediaApi = {
  list: () => api.get('/media'),
  update: (key, formData) => api.post(`/media/${key}`, formData, { isFormData: true }),
  remove: (key) => api.delete(`/media/${key}`),
};

export default mediaApi;