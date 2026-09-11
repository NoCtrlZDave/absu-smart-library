import api from './api';

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  uploadPicture: (formData) => api.post('/auth/upload-picture', formData),
  me: () => api.get('/auth/me'),
  changePassword: ({ currentPassword, newPassword }) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
};

export default authApi;