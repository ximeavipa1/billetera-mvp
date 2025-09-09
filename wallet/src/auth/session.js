// src/auth/session.js
import { api, setAccessToken } from '../lib/apiClient';

export async function register({ email, password, display_name }) {
  const data = await api('/auth/register', { method: 'POST', body: { email, password, display_name } });
  setAccessToken(data.access_token);
  return data.user;
}

export async function login({ email, password }) {
  const data = await api('/auth/login', { method: 'POST', body: { email, password } });
  setAccessToken(data.access_token);
  return data.user;
}

export async function me() {
  const data = await api('/auth/me');
  return data.user;
}

export async function logout() {
  await api('/auth/logout', { method: 'POST' });
  setAccessToken(null);
}
