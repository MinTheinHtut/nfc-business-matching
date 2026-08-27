// Production always uses Netlify's same-origin API proxy. This prevents a stale
// VITE_API_URL from silently restoring cross-site cookies or duplicating /api.
const API_URL = import.meta.env.DEV
  ? (import.meta.env.VITE_API_URL || 'http://localhost:3000/api')
  : '/api';

let unauthorizedHandler = null;

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    cache: 'no-store',
    ...options,
    // Session-backed requests must never allow a caller to omit credentials.
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || 'Something went wrong');
    error.status = response.status;
    error.errors = data.errors;
    if (response.status === 401) unauthorizedHandler?.();
    throw error;
  }
  return data;
}
