import { BASE_URL, getToken } from './api.js';

const QUEUE_KEY = 'absu_offline_queue';
const MAX_ATTEMPTS = 5;

const readQueue = () => {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeQueue = (queue) => {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  window.dispatchEvent(new CustomEvent('absu:offline-queue-updated', { detail: { count: queue.length } }));
};

const newId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const offlineQueue = {
  all: readQueue,

  count: () => readQueue().length,

  isQueueable: (path, method = 'GET') => {
    const upper = String(method).toUpperCase();
    if (upper === 'POST' && path === '/borrowings') return true;
    if (upper === 'POST' && /^\/borrowings\/reservations\/[^/]+\/collect$/.test(path)) return true;
    if (upper === 'POST' && path === '/reservations') return true;
    if (upper === 'PATCH' && /^\/borrowings\/[^/]+\/return$/.test(path)) return true;
    if (upper === 'POST' && /^\/reservations\/[^/]+\/cancel$/.test(path)) return false;
    return false;
  },

  enqueue: ({ path, method, body, label }) => {
    const queue = readQueue();
    const item = {
      id: newId(),
      path,
      method: String(method).toUpperCase(),
      body: body || null,
      label: label || `${method} ${path}`,
      createdAt: new Date().toISOString(),
      attempts: 0,
    };
    queue.push(item);
    writeQueue(queue);
    return item;
  },

  remove: (id) => {
    writeQueue(readQueue().filter((item) => item.id !== id));
  },

  clear: () => writeQueue([]),

  flush: async () => {
    const token = getToken();
    const queue = readQueue();
    if (!queue.length) return { flushed: 0, failed: 0, remaining: 0 };

    const remaining = [];
    let flushed = 0;
    let failed = 0;

    for (const item of queue) {
      try {
        const response = await fetch(`${BASE_URL}${item.path}`, {
          method: item.method,
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(item.body ? { 'Content-Type': 'application/json' } : {}),
          },
          body: item.body ? JSON.stringify(item.body) : undefined,
        });

        if (response.ok || response.status === 409) {
          flushed += 1;
          continue;
        }

        if (response.status >= 400 && response.status < 500) {
          failed += 1;
          continue;
        }

        item.attempts += 1;
        if (item.attempts < MAX_ATTEMPTS) remaining.push(item);
        else failed += 1;
      } catch {
        item.attempts += 1;
        if (item.attempts < MAX_ATTEMPTS) remaining.push(item);
        else failed += 1;
      }
    }

    writeQueue(remaining);
    return { flushed, failed, remaining: remaining.length };
  },
};

export const initOfflineQueue = () => {
  const run = async () => {
    if (!navigator.onLine || !getToken()) return;
    const result = await offlineQueue.flush();
    if (result.flushed > 0) {
      window.dispatchEvent(new CustomEvent('absu:offline-queue-flushed', { detail: result }));
    }
  };

  window.addEventListener('online', run);
  const timer = setInterval(run, 60 * 1000);
  return () => {
    window.removeEventListener('online', run);
    clearInterval(timer);
  };
};

export default offlineQueue;
