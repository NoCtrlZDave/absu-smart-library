const TOKEN_KEY = 'absu_token';

export const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const getToken = () =>
  localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null;

export const setToken = (token, remember = true) => {
  if (!token) {
    clearToken();
    return;
  }

  if (remember) {
    localStorage.setItem(TOKEN_KEY, token);
    sessionStorage.removeItem(TOKEN_KEY);
  } else {
    sessionStorage.setItem(TOKEN_KEY, token);
    localStorage.removeItem(TOKEN_KEY);
  }
};

export const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => registration.active?.postMessage('CLEAR_CACHES'))
      .catch(() => {});
  }
};

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
    const { offlineQueue } = await import('./offlineQueue.js');
    if (method !== 'GET' && offlineQueue.isQueueable(path, method)) {
      let queuedBody = body && !(body instanceof FormData) ? body : null;
      if (queuedBody && path === '/borrowings' && !queuedBody.clientRequestId) {
        queuedBody = {
          ...queuedBody,
          clientRequestId:
            typeof crypto !== 'undefined' && crypto.randomUUID
              ? crypto.randomUUID()
              : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        };
      }
      const item = offlineQueue.enqueue({
        path,
        method,
        body: queuedBody,
        label: method === 'POST' ? 'Issue book (offline)' : 'Return book (offline)',
      });
      window.dispatchEvent(new CustomEvent('absu:offline-queued', { detail: item }));
      return {
        queued: true,
        offline: true,
        queueId: item.id,
        message: 'You are offline. This action was saved and will be sent when the connection returns.',
      };
    }
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
  download: async (path, filename) => {
    const token = getToken();
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new ApiError('Download failed', res.status, null);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  },
};

export default api;