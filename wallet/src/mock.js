// mock.js — simula endpoints PHP para trabajar sin backend

export async function createRequestMock({ email, wallet, amount, currency }) {
  await delay(400)
  const code = 'RW-' + Math.random().toString(16).slice(2, 8).toUpperCase()
  // incluimos email en el payload para “usar” el parámetro y evitar warnings
  const payload = encodeURIComponent(`RET|${code}|${amount}|${currency}|${email}|${wallet}`)
  const qr_url = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${payload}`
  return { ok: true, code, qr_url }
}

export async function listRequestsMock(email) {
  await delay(300)
  const now = Date.now()

  if (!email || !email.trim()) {
    return { ok: true, items: [] }
  }

  return {
    ok: true,
    items: [
      {
        request_code: 'RW-AB12CD',
        wallet_provider: 'paypal',
        amount: 250.0,
        currency: 'USD',
        status: 'PAGADO',
        created_at: new Date(now - 3600e3).toISOString()
      },
      {
        request_code: 'RW-XY34ZT',
        wallet_provider: 'binance',
        amount: 500.0,
        currency: 'USD',
        status: 'EN_PROCESO',
        created_at: new Date(now - 7200e3).toISOString()
      },
      {
        request_code: 'RW-QW56ER',
        wallet_provider: 'usdt',
        amount: 75.5,
        currency: 'USD',
        status: 'RECHAZADO',
        created_at: new Date(now - 86400e3).toISOString()
      }
    ]
  }
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms))
