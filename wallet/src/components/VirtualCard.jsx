import { useEffect, useMemo, useState } from 'react'

import QrReader from './QrReader'

const LS_KEY_CARD     = 'wallet.card'
const LS_KEY_LIMITS   = 'wallet.limits'
const LS_KEY_ASSIGNED = 'wallet.cards.assigned'

const load = (k, d=null) => { try{ return JSON.parse(localStorage.getItem(k)||JSON.stringify(d)) }catch{ return d } }
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v))

const CARD_PRICE_USD = 1.00

// Evita no-empty/no-unused-vars en catch
const copy = async (t)=>{
  try{ await navigator.clipboard.writeText(t) }
  catch(e){ if (import.meta.env?.MODE === 'development') console.debug('copy fail:', e) }
}

export default function VirtualCard(){
  const [card, setCard] = useState(load(LS_KEY_CARD, { status:'none' }))
  const [showQR, setShowQR] = useState(false)
  const [qrText, setQrText] = useState('')

  const [showDetails, setShowDetails] = useState(false)
  const [reveal, setReveal] = useState({ number:false, cvv:false })

  const limits = load(LS_KEY_LIMITS, { maxUsers:100, cardCap:50 })
  const assignedCount = (load(LS_KEY_ASSIGNED, []) || []).length
  const hasStock = assignedCount < (limits.cardCap ?? 50)

  useEffect(()=>{ save(LS_KEY_CARD, card) }, [card])

  const nextRenewal = useMemo(()=>{
    if (card?.activatedAt && card.status==='active'){
      const d = new Date(card.activatedAt)
      d.setMonth(d.getMonth()+1)
      return d.toLocaleDateString()
    }
    return null
  }, [card])

  const requestCard = ()=>{
    if (!hasStock) return
    setCard({ status:'pending', createdAt: Date.now(), proof:'' })
  }

  const cancelRequest = ()=>{
    setCard({ status:'none' })
    setQrText('')
    setShowDetails(false)
    setReveal({ number:false, cvv:false })
  }

  return (
    <div id="deposit" className="soft-card">
      <h5 className="mb-3"><i className="bi bi-credit-card-2-front me-2"></i>Tarjeta Virtual</h5>

      {card.status==='none' && (
        <>
          <div className="alert alert-light border">
            Obtén tu tarjeta virtual por <b>USD {CARD_PRICE_USD.toFixed(2)}/mes</b>. Se activará cuando el administrador confirme el pago.
          </div>
          <div className="d-grid">
            <button className="btn btn-primary btn-pill" onClick={requestCard} disabled={!hasStock}
              title={!hasStock ? 'No hay tarjetas disponibles por ahora' : ''}>
              {hasStock ? `Solicitar Tarjeta Virtual (USD ${CARD_PRICE_USD.toFixed(2)}/mes)` : 'Sin stock por ahora'}
            </button>
          </div>
        </>
      )}

      {card.status==='pending' && (
        <>
          <div className="alert alert-warning">
            <b>Solicitud enviada.</b> Sube o escanea el comprobante de pago (USD {CARD_PRICE_USD.toFixed(2)}).
          </div>

          <div className="p-3 rounded border">
            <div className="fw-bold mb-2">Comprobante</div>
            <div className="d-flex flex-wrap gap-2">
              <button className="btn btn-outline-primary btn-sm" onClick={()=>setShowQR(true)}>
                <i className="bi bi-qr-code-scan me-1"></i> Escanear / Subir imagen
              </button>
              {qrText && <span className="badge bg-light text-dark border">QR leído</span>}
            </div>
            {qrText && (
              <div className="alert alert-light border mt-3">
                <div className="small text-muted mb-1">Contenido decodificado</div>
                <code className="d-block text-break">{qrText}</code>
              </div>
            )}
          </div>

          <div className="d-flex gap-2 mt-3">
            <button className="btn btn-outline-secondary btn-pill" onClick={cancelRequest}>Cancelar solicitud</button>
            <button
              className="btn btn-primary btn-pill ms-auto"
              onClick={()=>{
                setCard(prev => ({ ...prev, proof: qrText || '' }))
                alert('Comprobante guardado (demo). El administrador aprobará y asignará tu tarjeta.')
              }}
            >
              Guardar comprobante
            </button>
          </div>
        </>
      )}

      {card.status==='active' && (
        <>
          <div className="virtual-card d-flex flex-column gap-2">
            <div className="d-flex justify-content-between align-items-center">
              <div className="chip"></div>
              <span className="small"><i className="bi bi-shield-check me-1"></i>VIRTUAL</span>
            </div>
            <div className="h4 fw-bold">•••• •••• •••• {card.last4 || '0000'}</div>
            <div className="d-flex justify-content-between small">
              <div className="opacity-75">{card.holder || 'WALLET USER'}</div>
              <div className="opacity-75">VALID • {card.exp || 'MM/AA'}</div>
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center mt-3">
            <div className="small text-muted">
              Próxima renovación: {nextRenewal || '—'} — USD {CARD_PRICE_USD.toFixed(2)}
            </div>
            <button className="btn btn-outline-dark btn-sm" onClick={()=>setShowDetails(s=>!s)} aria-expanded={showDetails}>
              <i className={`bi ${showDetails?'bi-eye-slash':'bi-eye'} me-1`}></i>
              {showDetails ? 'Ocultar datos' : 'Ver datos de tarjeta'}
            </button>
          </div>

          {showDetails && (
            <div className="p-3 rounded border mt-3 bg-white">
              <div className="mb-2">
                <label className="form-label small">Número de tarjeta</label>
                <div className="input-group">
                  <input className="form-control" type={reveal.number ? 'text' : 'password'} value={card.pan || ''} readOnly />
                  <button className="btn btn-outline-secondary" onClick={()=>setReveal(r=>({...r, number:!r.number}))}>
                    <i className={`bi ${reveal.number?'bi-eye-slash':'bi-eye'}`}></i>
                  </button>
                  <button className="btn btn-outline-secondary" onClick={()=>copy(card.pan || '')}>
                    <i className="bi bi-clipboard-check"></i>
                  </button>
                </div>
              </div>

              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label small">Vencimiento</label>
                  <div className="input-group">
                    <input className="form-control" readOnly value={card.exp || ''} />
                    <button className="btn btn-outline-secondary" onClick={()=>copy(card.exp || '')}>
                      <i className="bi bi-clipboard-check"></i>
                    </button>
                  </div>
                </div>
                <div className="col-6">
                  <label className="form-label small">CVV</label>
                  <div className="input-group">
                    <input className="form-control" type={reveal.cvv ? 'text' : 'password'} readOnly value={card.cvv || ''} />
                    <button className="btn btn-outline-secondary" onClick={()=>setReveal(r=>({...r, cvv:!r.cvv}))}>
                      <i className={`bi ${reveal.cvv?'bi-eye-slash':'bi-eye'}`}></i>
                    </button>
                    <button className="btn btn-outline-secondary" onClick={()=>copy(card.cvv || '')}>
                      <i className="bi bi-clipboard-check"></i>
                    </button>
                  </div>
                </div>
              </div>

              <div className="alert alert-light border small mt-3 mb-0">
                En producción: solicita verificación (PIN/OTP) antes de revelar CVV.
              </div>
            </div>
          )}
        </>
      )}

      {showQR && (
        <QrReader
          onResult={(text)=>{ setQrText(text) }}
          onClose={()=>setShowQR(false)}
        />
      )}
    </div>
  )
}
