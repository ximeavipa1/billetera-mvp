// src/lib/apiClient.js
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8081';

let accessToken = localStorage.getItem('access_token') || null;
let refreshing = null;

export function setAccessToken(token) {
  accessToken = token;
  if (token) localStorage.setItem('access_token', token);
  else localStorage.removeItem('access_token');
}

async function refreshAccessToken() {
  if (refreshing) return refreshing;
  refreshing = fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    credentials: 'include'
  })
    .then(async r => {
      if (!r.ok) throw new Error('refresh failed');
      const data = await r.json();
      setAccessToken(data.access_token);
      return data.access_token;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

export async function api(path, { method = 'GET', body, headers = {}, formData = false } = {}) {
  const opts = { method, headers: { ...headers }, credentials: 'include' };
  if (accessToken) opts.headers['Authorization'] = `Bearer ${accessToken}`;
  if (body) {
    if (formData) {
      opts.body = body;
    } else {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
  }
  let res = await fetch(`${API_BASE}${path}`, opts);
  if (res.status === 401 && accessToken) {
    try {
      await refreshAccessToken();
      opts.headers['Authorization'] = `Bearer ${accessToken}`;
      res = await fetch(`${API_BASE}${path}`, opts);
    } catch (e) {
      setAccessToken(null);
      throw e;
    }
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}
