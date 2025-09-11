// src/lib/api.js
// Cliente HTTP real (sin mocks)

const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:8081').replace(/\/+$/, '');

function getSession () {
  try { return JSON.parse(localStorage.getItem('wallet.session') || 'null') }
  catch { return null }
}

async function buildError (res) {
  try {
    const data = await res.json();
    const msg = data?.error || data?.message || `HTTP ${res.status}`;
    return new Error(msg);
  } catch {
    return new Error(`HTTP ${res.status}`);
  }
}

async function apiFetch (path, opts = {}) {
  const url = `${API_BASE}${path.startsWith('/') ? path : '/' + path}`;

  const headers = new Headers(opts.headers || {});
  headers.set('Accept', 'application/json');
  if (opts.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const s = getSession();
  if (s?.token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${s.token}`);

  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    ...opts,
    headers
  });

  // Fallback legacy: /list → /list.php si el router no lo toma
  if (res.status === 404 && path.startsWith('/list')) {
    const q = path.includes('?') ? path.slice(path.indexOf('?')) : '';
    const res2 = await fetch(`${API_BASE}/list.php${q}`, { method: 'GET', credentials: 'include', headers });
    if (!res2.ok) throw await buildError(res2);
    return res2.json();
  }

  if (!res.ok) throw await buildError(res);
  return res.json();
}

export const api = {
  config () {
    return apiFetch('/config');
  },
  list (email) {
    const p = new URLSearchParams({ email });
    return apiFetch(`/list?${p.toString()}`);
  },
  create (payload) {
    return apiFetch('/create', { method: 'POST', body: JSON.stringify(payload) });
  },
  login (email, password) {
    return apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  },
  me () {
    return apiFetch('/me');
  }
};