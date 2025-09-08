// mockConfig.js — solo frontend (se reemplaza luego por API /config)

export const EXCHANGE_DATE = '02/09/2025'

// tipo de cambio del día
export const RATES = {
  USD_BOB: 13.20,   // 1 USD -> 13.20 Bs
  USD_USDT: 1.00    // 1 USD -> 1 USDT (referencia para Binance/Tarjeta)
}

// comisiones por par (en %)
// Nota: quitamos 'usdt->...' y no hay destino USDT directo
export const FEES = {
  'paypal->BOB_QR'  : 6.0,
  'paypal->BINANCE' : 5.0,
  'paypal->CARD'    : 7.0,

  'binance->BOB_QR' : 5.0,
  'binance->BINANCE': 1.0, // mover dentro de Binance (normalmente 1%)
  'binance->CARD'   : 6.0,

  'facebook->BOB_QR': 7.0,
  'facebook->BINANCE': 6.0,
  'facebook->CARD'  : 8.0,

  'tiktok->BOB_QR'  : 7.0,
  'tiktok->BINANCE' : 6.0,
  'tiktok->CARD'    : 8.0
}

// canales / metadatos mostrados en instrucciones
// Para Facebook/TikTok, el admin asigna el correo oficial (receiver).
export const CHANNELS = {
  paypal: {
    label: 'Cuenta PayPal del servicio',
    receiver: 'pagos@tuempresa.com',
    note: 'Envía el monto exacto desde tu PayPal'
  },
  binance: {
    label: 'Cuenta Binance del servicio',
    receiver: 'binance@tuempresa.com',
    note: 'Transferencia en USDT (TRC20) al wallet que verás en tu perfil'
  },
  facebook: {
    label: 'Correo para retiros vía Facebook',
    receiver: 'facebook@tuempresa.com',
    note: 'Usa este correo para recibir/emitir la factura según instrucciones'
  },
  tiktok: {
    label: 'Correo para retiros vía TikTok',
    receiver: 'tiktok@tuempresa.com',
    note: 'Usa este correo para recibir/emitir la factura según instrucciones'
  },
  BOB_QR: {
    label: 'QR bancario (Bs)',
    // el QR del destino se carga por cámara/imagen en el flujo, no por URL
  },
  BINANCE: {
    label: 'Wallet USDT en Binance (destino)',
    note: 'Se acreditará en la wallet indicada en tu perfil.'
  },
  CARD: {
    label: 'Tarjeta virtual',
    note: 'Costo $1 / 30 días (gestión externa)'
  }
}
