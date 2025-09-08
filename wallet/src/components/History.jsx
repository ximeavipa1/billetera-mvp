// src/components/History.jsx
import { useState, useCallback, useEffect } from 'react'
import { API_BASE } from '../App'

// formatea fecha local
const fmtDate = (iso) =>
  new Date(iso).toLocaleString(undefined, {
    year:'numeric', month:'numeric', day:'numeric',
    hour:'numeric', minute:'2-digit', second:'2-digit'
  })

// mapea estado a etiqueta en inglés que se muestra
const label = (s) =>
  s === 'PAGADO'     ? 'Completed' :
  s === 'EN_PROCESO' ? 'Pending'   :
  s === 'RECHAZADO'  ? 'Rejected'  : s

// normaliza un ítem cualquiera del backend a la forma que usa la UI
function normalizeItem(raw){
  // campos tolerantes (por si cambian keys)
  const provider = raw.wallet_provider || raw.provider || raw.source || '—'
  const amount   = Number(raw.amount ?? 0)
  const created  = raw.created_at || raw.createdAt || raw.date || new Date().toISOString()

  // estado → español que usa el UI
  let s = (raw.status || '').toString().toUpperCase()
  if (s === 'PAID' || s === 'COMPLETED' || s === 'APPROVED' || s === 'RELEASED') s = 'PAGADO'
  else if (s === 'PENDING' || s === 'EN PROCESO' || s === 'PROCESSING')          s = 'EN_PROCESO'
  else if (s === 'REJECTED' || s === 'CANCELLED' || s === 'CANCELED')            s = 'RECHAZADO'
  else if (!s) s = 'EN_PROCESO'

  return {
    wallet_provider: provider,
    amount,
    status: s,
    created_at: created,
  }
}

export default function History(){
  const [email, setEmail]     = useState('user@mail.com')
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const load = useCallback(async ()=>{
    const q = email.trim()
    if(!q) return
    setLoading(true)
    setError('')
    const ac = new AbortController()

    try{
      // 1) intenta router nuevo: /api/list?email=...
      let r = await fetch(`${API_BASE}/list?email=${encodeURIComponent(q)}`, { signal: ac.signal })
      // si 404, intenta el script legacy
      if (r.status === 404){
        r = await fetch(`${API_BASE}/list.php?email=${encodeURIComponent(q)}`, { signal: ac.signal })
      }
      if (!r.ok){
        throw new Error(`HTTP ${r.status}`)
      }
      const data = await r.json()

      // soporta varios formatos:
      // { ok:true, items:[...] }  ||  { items:[...] }  ||  [ ... ]
      const rawItems = Array.isArray(data) ? data : (data.items || [])
      const normalized = rawItems.map(normalizeItem)
      setItems(normalized)
    }catch(e){
      console.error('History load error:', e)
      setItems([])
      setError('No se pudo obtener el historial por ahora.')
    }finally{
      setLoading(false)
    }

    return ()=>ac.abort()
  }, [email])

  useEffect(()=>{ load() }, [load])

  return (
    <div className="soft-card">
      <div className="d-flex align-items-center gap-2 mb-3">
        <i className="bi bi-clock-history text-success"></i>
        <h5 className="mb-0">Historial de Transacciones</h5>
      </div>

      <div className="row g-2 align-items-end mb-3">
        <div className="col-12">
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={e=>setEmail(e.target.value)}
            placeholder="user@mail.com"
          />
        </div>
        <div className="col-12">
          <button className="btn btn-primary w-100 btn-pill" onClick={load} disabled={loading}>
            {loading ? 'Cargando…' : 'Consultar'}
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
