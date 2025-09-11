// src/components/Withdraw.jsx
import { IconPayPal, IconBinance } from './icons'
import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'

/**
 * Catálogo de orígenes (FROM) visibles en UI
 * (solo UI; las tarifas reales vienen de /config → cfg.fees)
 */
const FROM = [
  { id:'paypal',  name:'PayPal',   icon:<IconPayPal/> },
  { id:'binance', name:'Binance',  icon:<IconBinance/> },
  { id:'facebook',name:'Facebook', icon:<i className="bi bi-facebook fs-5"></i> },
  { id:'tiktok',  name:'TikTok',   icon:<i className="bi bi-tiktok fs-5"></i> },
]

/**
 * Destinos (TO) visibles en UI
 * (no se muestra “USDT directo” como pediste)
 */
const TO = [
  { id:'BINANCE', name:'Binance (USDT)' },
  { id:'BOB_QR',  name:'Bolivianos (QR bancario)' },
  { id:'CARD',    name:'Tarjeta virtual' }
]

// Normaliza números
const toNum = (v, def = 0) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : def
}

export default function Withdraw(){
  // Config real desde backend (/config)
  const [cfg, setCfg]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Estado del formulario
  const [fromId, setFromId] = useState('paypal')
  const [toId, setToId]     = useState('BOB_QR')
  const [amount, setAmount] = useState(25)

  // Cargar config real (rates, fees, etc.)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try{
        setLoading(true)
        const data = await api.config()
        if (!cancelled) {
          setCfg(data || {})
          setError('')
        }
      }catch(e){
        console.error('Withdraw config error:', e)
        if (!cancelled) setError(e?.message || 'No se pudo cargar la configuración.')
      }finally{
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  // Lectura robusta de rates
  const rateBOB  = useMemo(() => toNum(cfg?.rates?.USD_BOB, 0), [cfg])
  const rateUSDT = useMemo(() => toNum(cfg?.rates?.USD_USDT, 1), [cfg])

  // Fee (%) según origen->destino (case-insensitive)
  const feePct = useMemo(() => {
    const fees = cfg?.fees || {}
    const key = `${fromId}->${toId}` // p.ej. "paypal->BOB_QR"
    let pct = fees[key]
    if (pct == null) {
      const found = Object.entries(fees).find(([k]) => k.toLowerCase() === key.toLowerCase())
      pct = found?.[1]
    }
    return toNum(pct, 0)
  }, [cfg, fromId, toId])

  // Cálculos mostrados
  const feeAmt = useMemo(() => +(toNum(amount) * (feePct / 100)).toFixed(2), [amount, feePct])

  const recv = useMemo(() => {
    const base = Math.max(0, toNum(amount) - feeAmt)
    if (toId === 'BOB_QR') {
      return { value: +(base * rateBOB).toFixed(2), unit: 'BOB' }
    }
    // Para BINANCE/CARD usamos USDT como referencia
    return { value: +(base * rateUSDT).toFixed(2), unit: 'USDT' }
  }, [amount, feeAmt, rateBOB, rateUSDT, toId])

  /**
   * Continuar → guarda el intent y navega a la pantalla de QR
   * - Persistimos en sessionStorage (wallet.intent)
   * - También pasamos el intent en la URL (param i= base64 JSON)
   * - Usamos hash navigation (#/qr) para no requerir router ahora
   */
  const onContinue = () => {
    if (!amount || amount <= 0) return

    // Intent de la operación (lo que necesitará la pantalla de QR)
    const intent = {
      from: fromId,
      to: toId,
      amountUSD: toNum(amount),
      feeUSD: feeAmt,
      recvValue: recv.value,
      recvUnit: recv.unit,
      exchange_date: cfg?.exchange_date || null,
      rates: { USD_BOB: rateBOB, USD_USDT: rateUSDT },
      createdAt: Date.now(),
    }

    try {
      sessionStorage.setItem('wallet.intent', JSON.stringify(intent))
    } catch {}

    // Token base64 para pasar por URL (opcional, por si quieres leer desde location)
    const token = btoa(unescape(encodeURIComponent(JSON.stringify(intent))))

    // Redirección:
    // - Para QR bancario boliviano, llevamos a #/qr
    // - Para otros destinos, puedes cambiar la ruta si tendrás pantallas separadas
    if (toId === 'BOB_QR') {
      window.location.hash = `#/qr?i=${encodeURIComponent(token)}`
    } else if (toId === 'BINANCE') {
      window.location.hash = `#/binance?i=${encodeURIComponent(token)}`
    } else if (toId === 'CARD') {
      window.location.hash = `#/card?i=${encodeURIComponent(token)}`
    }
  }

  // ---------------- UI ----------------
  return (
    <div className="soft-card">
      <div className="d-flex align-items-center justify-content-between mb-2">
        <h5 className="mb-0">Retiro</h5>
        <div className="small text-success">
          tipo de cambio {cfg?.exchange_date || '—'} <strong>{rateBOB || '—'}</strong> Bs/USD
        </div>
      </div>

      {loading && <div className="alert alert-light border small mb-3">Cargando configuración…</div>}
      {!!error && !loading && <div className="alert alert-warning small mb-3">{error}</div>}

      {/* Origen */}
      <div className="mb-3">
        <label className="form-label d-block">Origen</label>
        <div className="d-flex gap-2 flex-wrap">
          {FROM.map(o => (
            <button
              key={o.id}
              type="button"
              onClick={()=>setFromId(o.id)}
              className={
                'btn btn-light d-flex align-items-center gap-2 px-3 py-2 ' +
                (fromId === o.id ? 'border border-2 border-success' : 'border')
              }
              aria-pressed={fromId === o.id}
            >
              <span className="d-inline-flex align-items-center">{o.icon}</span>
              <span className="fw-medium">{o.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Monto */}
      <div className="mb-2">
        <label className="form-label">Monto (USD)</label>
        <input
          type="number"
          className="form-control"
          min="0"
          step="0.01"
          value={amount}
          onChange={e=>setAmount(toNum(e.target.value, 0))}
        />
      </div>

      {/* Destino */}
      <div className="mb-2">
        <label className="form-label">Destino</label>
        <select className="form-select" value={toId} onChange={e=>setToId(e.target.value)}>
          {TO.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      <div className="small text-muted mb-2">Fee: {feeAmt.toFixed(2)} USD ({feePct}%)</div>
      <div className="fw-bold">Recibes ≈ {recv.value.toFixed(2)} {recv.unit}</div>

      {/* CTA: Continuar */}
      <button
        type="button"
        className="btn btn-success w-100 btn-pill mt-3"
        onClick={onContinue}
        disabled={loading || !!error || !amount || amount <= 0}
      >
        Continuar
      </button>
      <small className="text-muted d-block mt-1">
        Serás redirigido a la pantalla para escanear el QR del banco.
      </small>
    </div>
  )
}
