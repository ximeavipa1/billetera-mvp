export let RATES = { usd_bob: 6.96, usd_usdt: 1.00 };
export let FEES = { withdraw_pct: 2.5, withdraw_min: 1.00 };
export let CHANNELS = ['BOB_QR','BINANCE','CARD'];
export let EXCHANGE_DATE = new Date().toISOString().slice(0,10);

try {
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8081';
  const res = await fetch(`${API_BASE}/config`, { credentials: 'include' });
  if (res.ok) {
    const { config } = await res.json();
    if (config?.rates) RATES = { ...RATES, ...config.rates };
    if (config?.fees) FEES = { ...FEES, ...config.fees };
    if (config?.channels) CHANNELS = config.channels;
    if (config?.exchange_date) EXCHANGE_DATE = config.exchange_date;
  }
} catch (e) {
  // Si la API no responde, mantenemos los defaults arriba (sin mocks locales)
}
