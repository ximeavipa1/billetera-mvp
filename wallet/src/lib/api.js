export const API_BASE =
  import.meta.env.VITE_API_BASE ||
  (location.hostname.includes('.github.dev')
    ? location.origin.replace('-5173', '-8081')
    : 'http://localhost:8081');

async function http(path, { method = 'GET', token, body, formData } = {}) {
  const headers = {};
  if (!formData) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: formData ? formData : body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.ok === false) {
    throw new Error(json.message || `HTTP ${res.status}`);
  }
  return json;
}

export const api = {
  getConfig: () => http('/config'),
  devAdminLogin: () => http('/auth/dev-admin', { method: 'POST' }),
  getAdminConfig: (token) => http('/admin/config', { token }),
  getAdminRequests: (token) => http('/admin/requests', { token }),
  getProfile: (token) => http('/profile', { token }),
  updateProfile: (token, data) => {
    const fd = new FormData();
    if (data.paypal_email) fd.set('paypal_email', data.paypal_email);
    if (data.binance_wallet) fd.set('binance_wallet', data.binance_wallet);
    if (data.bank_qr_image) fd.set('bank_qr_image', data.bank_qr_image);
    return http('/profile', { method: 'POST', token, formData: fd });
  },
};
