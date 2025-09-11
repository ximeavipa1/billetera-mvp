// src/components/History.jsx
import { useState, useCallback, useEffect } from 'react'
import { api } from '../lib/api'

/**
 * Formatea un timestamp ISO a fecha/hora local legible.
 */
const fmtDate = (iso) =>
  new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: '2-digit', second: '2-digit'
  })

/**
 * Traduce estados internos a etiquetas en inglés mostradas en UI.
 */
const label = (s) =>
  s === 'PAGADO'     ? 'Completed' :
  s === 'EN_PROCESO' ? 'Pending'   :
  s === 'RECHAZADO'  ? 'Rejected'  : s

/**
 * Convierte un registro crudo del backend al formato que la UI espera.
 */
function normalizeItem(raw){
  const provider = raw.wallet_provider || raw.provider || raw.source || '—'
  const amount   = Number(raw.amount ?? 0)
  const created  = raw.created_at || raw.createdAt || raw.date || new Date().toISOString()

  // Normaliza estados a español interno de la app
  let s = (raw.status || '').toString().toUpperCase()
  if (s === 'PAID' || s === 'COMPLETED' || s === 'APPROVED' || s === 'RELEASED') s = 'PAGADO'
  else if (s === 'PENDING' || s === 'EN PROCESO' || s === 'PROCESSING')          s = 'EN_PROCESO'
  else if (s === 'REJECTED' || s === 'CANCELLED' || s === 'CANCELED')            s = 'RECHAZADO'
  else if (!s) s = 'EN_PROCESO'

  return { wallet_provider: provider, amount, status: s, created_at: created }
}

/**
 * Lectura segura de la sesión persistida por Login.jsx
 * Espera un objeto { token, email, role, ... }
 */
function getSession(){
  try { return JSON.parse(localStorage.getItem('wallet.session') || 'null') } catch { return null }
}

export default function History(){
  // Carga email desde sesión; si no hay, deja vacío y permite escribirlo (útil en dev)
  const ses = getSession()
  const isAdmin = ses?.role === 'admin'
  const defaultEmail = ses?.email || ''
  const [email, setEmail]     = useState(defaultEmail)
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  /**
   * Consulta historial:
   * - Tu backend actual requiere ?email=... incluso con JWT.
   * - Si en el futuro el backend acepta JWT sin email, bastará con llamar api.list() sin query.
   */
  const load = useCallback(async ()=>{
    const q = (email || '').trim()
    if (!q) {
      setItems([])
      setError('Ingresa un email válido.')
      return
    }

    setLoading(true)
    setError('')
    try{
      const data = await api.list(q)            // ← usa VITE_API_BASE y Bearer token
      const rawItems = Array.isArray(data) ? data : (data.items || [])
      setItems(rawItems.map(normalizeItem))
    }catch(e){
      console.error('History load error:', e)
      setItems([])
      setError(e?.message || 'No se pudo obtener el historial.')
    }finally{
      setLoading(false)
    }
  }, [email])

  // Carga inicial (y si cambia el email por el usuario/admin)
  useEffect(()=>{ load() }, [load])

  return (
    <div className="soft-card">
      <div className="d-flex align-items-center gap-2 mb-3">
        <i className="bi bi-clock-history text-success"></i>
        <h5 className="mb-0">Historial de Transacciones</h5>
      </div>

      {/* Para admin: input editable; para no-admin: input bloqueado con su propio email */}
      <div className="row g-2 align-items-end mb-3">
        <div className="col-12">
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={e=>setEmail(e.target.value)}
            placeholder="user@mail.com"
            disabled={!isAdmin && !!defaultEmail}
          />
        </div>
        <div className="col-12">
          <button className="btn btn-primary w-100 btn-pill" onClick={load} disabled={loading}>
            {loading ? 'Cargando…' : (isAdmin ? 'Consultar' : 'Refrescar')}
          </button>
        </div>
      </div>

      {!!error && (
        <div className="alert alert-light border small">{error}</div>
      )}

      {items.length === 0 && !loading && !error && (
        <div className="alert alert-warning mb-0">Sin movimientos</div>
      )}

      {items.length > 0 && (
        <div className="d-flex flex-column gap-3">
          {items.map((it, i)=>(
            <div key={`${it.created_at}-${i}`} className="activity activity-lg">
              <div className="icon"><i className="bi bi-wallet2"></i></div>

              <div className="flex-grow-1">
                <div className="fw-bold text-capitalize mb-1">{it.wallet_provider}</div>
                <div className="small text-muted">{fmtDate(it.created_at)}</div>
              </div>

              <div className="text-end me-2">
                <div className={
                  'amount ' + (it.status==='PAGADO' ? 'positive' :
                               it.status==='EN_PROCESO' ? 'pending' : 'negative')
                }>
                  {it.status==='PAGADO' ? '+' : it.status==='RECHAZADO' ? '-' : ''}{it.amount}
                </div>
                <div className="amount-currency">USD</div>
              </div>

              <span className={
                'status-badge ' + (it.status==='PAGADO' ? 'ok' :
                                   it.status==='EN_PROCESO' ? 'pending' : 'bad')
              }>
                {label(it.status)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
