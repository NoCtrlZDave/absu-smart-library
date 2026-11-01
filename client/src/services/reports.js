import api from './api';

export const reportsApi = {
  byCategory: () => api.get('/reports/by-category'),
  missing: () => api.get('/reports/missing'),
  byLocation: () => api.get('/reports/by-location'),
  summary: () => api.get('/reports/summary'),
  departments: () => api.get('/reports/departments'),
  departmental: (params) => api.get('/reports/departmental', params),
  departmentalConsolidated: (params) => api.get('/reports/departmental/consolidated', params),
  departmentalExportUrl: (params) => {
    const qs = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') qs.set(key, String(value));
    });
    const query = qs.toString();
    return `/reports/departmental/export${query ? `?${query}` : ''}`;
  },
};

export default reportsApi;