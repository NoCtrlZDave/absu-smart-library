const TOKEN_KEY = 'absu_token';

export const BASE_URL = '/api';

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const setToken = (token) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};

export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export class ApiError extends Error {
  constructor(message, status = 500, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request(path, { method = 'GET', body, headers = {}, isFormData = false } = {}) {
  const token = getToken();
  const finalHeaders = { ...headers };
  if (token) finalHeaders.Authorization = `Bearer ${token}`;
  if (body && !isFormData && !(body instanceof FormData)) {
    finalHeaders['Content-Type'] = 'application/json';
  }

  const options = { method, headers: finalHeaders };
  if (body) {
    options.body = isFormData || body instanceof FormData ? body : JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, options);
  } catch {
    throw new ApiError('Network error. Is the server running?', 0, null);
  }

  const payload = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401) clearToken();
    throw new ApiError(payload?.message || res.statusText || 'Request failed', res.status, payload);
  }

  return payload && typeof payload === 'object' && 'success' in payload ? payload.data : payload;
}

export const api = {
  get: (path, params) => {
    if (!params) return request(path);
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') qs.set(key, String(value));
    });
    const q = qs.toString();
    return request(q ? `${path}?${q}` : path);
  },
  post: (path, body, opts) => request(path, { method: 'POST', body, ...opts }),
  put: (path, body, opts) => request(path, { method: 'PUT', body, ...opts }),
  patch: (path, body, opts) => request(path, { method: 'PATCH', body, ...opts }),
  delete: (path) => request(path, { method: 'DELETE' }),
};

export default api;