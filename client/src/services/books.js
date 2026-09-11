import api from './api';

export const booksApi = {
  list: (params) => api.get('/books', params),
  categories: () => api.get('/books/categories'),
  get: (id) => api.get(`/books/${id}`),
  create: (payload) => api.post('/books', payload),
  update: (id, payload) => api.put(`/books/${id}`, payload),
  remove: (id) => api.delete(`/books/${id}`),
  uploadCover: (id, file) => {
    const form = new FormData();
    form.append('cover', file);
    return api.post(`/books/${id}/cover`, form, { isFormData: true });
  },
};

export default booksApi;