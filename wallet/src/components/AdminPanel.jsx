// src/components/AdminPanel.jsx
import { useEffect, useMemo, useState } from 'react'
import { useConfig } from '../configStore'
import { notifyUser } from '../utils/notify'

// storage demo
const LS_LIMITS   = 'wallet.limits'
const LS_REQS     = 'wallet.requests'
const LS_INV      = 'wallet.cards.inventory'
const LS_ASSIGNED = 'wallet.cards.assigned'
const LS_SESSION  = 'wallet.session'
const LS_USERCARD = 'wallet.card'

const loadJSON = (k, d) => { try{ return JSON.parse(localStorage.getItem(k)||JSON.stringify(d)) }catch{ return d } }
const saveJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v))

export default function AdminPanel({ onClose }) {
  const { config, resetDefaults,
    setRate, setFee, setChannelField, setLimit, setPayoutField
  } = useConfig()

  const [tab, setTab] = useState('general')

  // ====== General (editables locales) ======
  const [localRates, setLocalRates]     = useState(config.rates || {})
  const [localFees, setLocalFees]       = useState(config.fees  || {})
  const [localChannels, setLocalChannels] = useState(config.channels || {})
  const [localPayout, setLocalPayout]   = useState(config.payout || { bankName:'',accountName:'',accountNumber:'',iban:'',note:'' })

  useEffect(()=>{ setLocalRates(config.rates||{}) },[config.rates])
  useEffect(()=>{ setLocalFees(config.fees||{}) },[config.fees])
  useEffect(()=>{ setLocalChannels(config.channels||{}) },[config.channels])
  useEffect(()=>{ setLocalPayout(config.payout||{}) },[config.payout])

  const feeKeys  = Object.keys(localFees)
  const rateKeys = Object.keys(localRates)
  const channels = Object.keys(localChannels)

  const saveGeneral = ()=>{
    // rates
    Object.entries(localRates).forEach(([k,v])=> setRate(k, v))
    // fees
    Object.entries(localFees).forEach(([k,v])=> setFee(k, v))
    // channels
    Object.entries(localChannels).forEach(([ch, obj])=>{
      Object.entries(obj||{}).forEach(([field,val])=> setChannelField(ch, field, val))
    })
    // payout
    Object.entries(localPayout||{}).forEach(([field,val])=> setPayoutField(field, val))
  }

  // ====== Límites ======
  const [limitsLocal, setLimitsLocal] = useState(loadJSON(LS_LIMITS, {
    maxUsers: config.limits?.maxUsers ?? 100,
    cardCap : config.limits?.cardCap  ?? 50
  }))
  useEffect(()=>{
    saveJSON(LS_LIMITS, limitsLocal)
    setLimit('maxUsers', limitsLocal.maxUsers)
    setLimit('cardCap',  limitsLocal.cardCap)
  },[limitsLocal, setLimit])

  // métricas tarjetas
  const assignedCount  = (loadJSON(LS_ASSIGNED, []) || []).length
  const inventoryCount = (loadJSON(LS_INV, []) || []).length

  // ====== Retiros (mock) ======
  const [requests, setRequests] = useState(loadJSON(LS_REQS, []))
  useEffect(()=>{ saveJSON(LS_REQS, requests) }, [requests])

  const updateRequestStatus = (id, status) => {
    setRequests(prev => prev.map(r => r.id===id ? { ...r, status } : r))
    try{
      const req = (loadJSON(LS_REQS, []) || []).find(r=>r.id===id)
      if (req?.userEmail) {
        const label = status==='released' ? 'aprobada' : (status==='rejected' ? 'rechazada' : status)
        notifyUser(req.userEmail, 'Actualización de retiro', `Tu solicitud #${id} fue ${label}.`)
      }
    }catch{/* noop */}
  }

  // ====== Tarjetas ======
  const [inventory, setInventory] = useState(loadJSON(LS_INV, []))
  const [assigned, setAssigned]   = useState(loadJSON(LS_ASSIGNED, []))
  useEffect(()=>{ saveJSON(LS_INV,  inventory) }, [inventory])
  useEffect(()=>{ saveJSON(LS_ASSIGNED, assigned) }, [assigned])

  const [newCard, setNewCard] = useState({ pan:'', exp:'', cvv:'' })
  const [assignEmail, setAssignEmail] = useState('')

  const session = loadJSON(LS_SESSION, { email: 'user@mail.com', role:'admin' })
  const canAssign = useMemo(()=> inventory.length > 0, [inventory])

  const addInventoryCard = ()=>{
    const pan = newCard.pan.trim(), exp = newCard.exp.trim(), cvv = newCard.cvv.trim()
    if (!pan || !exp || !cvv) return
    const exists = inventory.some(c => (c.pan||'').replaceAll(' ','') === pan.replaceAll(' ','')) ||
                   assigned.some(c => (c.pan||'').replaceAll(' ','') === pan.replaceAll(' ',''))
    if (exists) return
    const item = { id:'CARD-'+Date.now(), pan, exp, cvv, createdAt: Date.now() }
    setInventory(prev => [item, ...prev])
    setNewCard({ pan:'', exp:'', cvv:'' })
  }

  const assignFirstAvailableTo = (email)=>{
    if (!email || !canAssign) return
    const [card, ...rest] = inventory
    setInventory(rest)
    const payload = { ...card, userEmail: email, assignedAt: Date.now() }
    setAssigned(prev => [payload, ...prev])

    // demo: si coincide con el usuario en este navegador, “activa” su tarjeta local
    const sEmail = (session?.email||'').toLowerCase()
    if (sEmail && sEmail === email.toLowerCase()) {
      const last4 = (card.pan.replaceAll(' ','') || '').slice(-4)
      const userCard = { status:'active', activatedAt:Date.now(), holder: email, last4, exp: card.exp, pan: card.pan, cvv: card.cvv }
      localStorage.setItem(LS_USERCARD, JSON.stringify(userCard))
    }
  }

  const revokeAssigned = (id)=>{
    const card = assigned.find(c=>c.id===id)
    if (!card) return
    setAssigned(prev => prev.filter(c => c.id!==id))
    setInventory(prev => [ { id: card.id, pan: card.pan, exp: card.exp, cvv: card.cvv, createdAt: Date.now() }, ...prev ])
  }

  const TabBtn = ({id, label, icon}) => (
    <button className={`btn btn-sm ${tab===id?'btn-primary':'btn-outline-primary'}`} onClick={()=>setTab(id)}>
      <i className={`bi ${icon} me-1`}></i>{label}
    </button>
  )

  return (
    <div className="container-fluid">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h4 className="mb-0"><i className="bi bi-gear-wide-connected me-2"></i>Panel de Administración</h4>
        <div className="d-flex gap-2">
          <TabBtn id="general"     label="General"      icon="bi-sliders" />
          <TabBtn id="limits"      label="Límites"      icon="bi-diagram-3" />
          <TabBtn id="withdrawals" label="Retiros"      icon="bi-arrow-left-right" />
          <TabBtn id="cards"       label="Tarjetas"     icon="bi-credit-card" />
          <button className="btn btn-outline-secondary btn-sm" onClick={resetDefaults}>Restaurar demo</button>
          <button className="btn btn-primary btn-sm" onClick={onClose}>Cerrar</button>
        </div>
      </div>

      {/* ====== GENERAL ====== */}
      {tab==='general' && (
        <div className="row g-4">
          <div className="col-lg-6">
            <div className="soft-card">
              <h6 className="mb-3">Tipos de cambio (del día)</h6>
              {rateKeys.map(k=>(
                <div className="mb-2" key={k}>
                  <label className="form-label small">{k}</label>
                  <input
                    className="form-control" type="number" step="0.0001"
                    value={localRates[k]}
                    onChange={e=>setLocalRates(s=>({ ...s, [k]: Number(e.target.value||0) }))}
                  />
                </div>
              ))}
            </div>

            <div className="soft-card mt-3">
              <h6 className="mb-3">Comisiones (%) por par</h6>
              {feeKeys.map(k=>(
                <div className="mb-2" key={k}>
                  <label className="form-label small">{k}</label>
                  <input
                    className="form-control" type="number" step="0.1"
                    value={localFees[k]}
                    onChange={e=>setLocalFees(s=>({ ...s, [k]: Number(e.target.value||0) }))}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="col-lg-6">
            {/* Cuenta destino para pagos de tarjeta */}
            <div className="soft-card">
              <h6 className="mb-3">Cuenta de destino (pagos tarjeta $1)</h6>
              <label className="form-label small">Banco</label>
              <input className="form-control mb-2" value={localPayout.bankName||''}
                     onChange={e=>setLocalPayout(s=>({ ...s, bankName:e.target.value }))} />
              <label className="form-label small">Titular</label>
              <input className="form-control mb-2" value={localPayout.accountName||''}
                     onChange={e=>setLocalPayout(s=>({ ...s, accountName:e.target.value }))} />
              <label className="form-label small">Cuenta / Nº</label>
              <input className="form-control mb-2" value={localPayout.accountNumber||''}
                     onChange={e=>setLocalPayout(s=>({ ...s, accountNumber:e.target.value }))} />
              <label className="form-label small">IBAN (opcional)</label>
              <input className="form-control mb-2" value={localPayout.iban||''}
                     onChange={e=>setLocalPayout(s=>({ ...s, iban:e.target.value }))} />
              <label className="form-label small">Notas</label>
              <input className="form-control" value={localPayout.note||''}
                     onChange={e=>setLocalPayout(s=>({ ...s, note:e.target.value }))} />
            </div>

            <div className="soft-card mt-3">
              <h6 className="mb-3">Canales / Metadatos</h6>
              {channels.map(ch=>(
                <div key={ch} className="p-3 mb-3 rounded border">
                  <div className="fw-bold mb-2">{ch}</div>
                  <label className="form-label small mb-1">Etiqueta</label>
                  <input className="form-control mb-2"
                    value={localChannels[ch]?.label || ''}
                    onChange={e=>setLocalChannels(s=>({ ...s, [ch]: { ...(s[ch]||{}), label:e.target.value } }))}
                  />
                  <label className="form-label small mb-1">Cuenta / Receiver</label>
                  <input className="form-control mb-2"
                    value={localChannels[ch]?.receiver || ''}
                    onChange={e=>setLocalChannels(s=>({ ...s, [ch]: { ...(s[ch]||{}), receiver:e.target.value } }))}
                  />
                  <label className="form-label small mb-1">Nota</label>
                  <input className="form-control"
                    value={localChannels[ch]?.note || ''}
                    onChange={e=>setLocalChannels(s=>({ ...s, [ch]: { ...(s[ch]||{}), note:e.target.value } }))}
                  />
                </div>
              ))}
              <div className="alert alert-light border small">
                Los QR se capturan <b>con cámara o imagen</b> en el flujo (no por URL).
              </div>
            </div>

            {/* Botón guardar todo lo editado */}
            <div className="d-grid mt-3">
              <button className="btn btn-success btn-pill" onClick={saveGeneral}>
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== LÍMITES ====== */}
      {tab==='limits' && (
        <div className="row g-4">
          <div className="col-lg-6">
            <div className="soft-card">
              <h6 className="mb-3"><i className="bi bi-diagram-3 me-2"></i>Capacidades</h6>
              <div className="mb-2">
                <label className="form-label small">Máximo de usuarios (beta)</label>
                <input className="form-control" type="number"
                       value={limitsLocal.maxUsers}
                       onChange={e=>setLimitsLocal(s=>({ ...s, maxUsers: Number(e.target.value||0) }))} />
              </div>
              <div className="mb-2">
                <label className="form-label small">Capacidad de tarjetas (stock)</label>
                <input className="form-control" type="number"
                       value={limitsLocal.cardCap}
                       onChange={e=>setLimitsLocal(s=>({ ...s, cardCap: Number(e.target.value||0) }))} />
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="soft-card">
              <h6 className="mb-3"><i className="bi bi-graph-up-arrow me-2"></i>Estado</h6>
              <div className="row g-2">
                <div className="col-6">
                  <div className="p-3 bg-light rounded border">
                    <div className="small text-muted">Inventario disponible</div>
                    <div className="h5 mb-0">{inventoryCount}</div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="p-3 bg-light rounded border">
                    <div className="small text-muted">Tarjetas asignadas</div>
                    <div className="h5 mb-0">{assignedCount}</div>
                  </div>
                </div>
              </div>
              <div className="alert alert-light border small mt-3">
                Cuando <b>asignadas ≥ capacidad</b> el usuario verá “sin stock por ahora”.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====== RETIROS ====== */}
      {tab==='withdrawals' && (
        <div className="soft-card">
          <h6 className="mb-3"><i className="bi bi-arrow-left-right me-2"></i>Solicitudes de retiro</h6>
          {!requests.length && <div className="text-muted">No hay solicitudes por ahora.</div>}
          {!!requests.length && (
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Fecha</th><th>Usuario</th><th>Desde</th><th>Hacia</th>
                    <th>Monto (USD)</th><th>Estado</th><th>Comprobante</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {requests.slice().reverse().map(r=>(
                    <tr key={r.id}>
                      <td className="small">{new Date(r.createdAt).toLocaleString()}</td>
                      <td className="small">{r.userEmail}</td>
                      <td className="small text-uppercase">{r.from}</td>
                      <td className="small text-uppercase">{r.to}</td>
                      <td>${Number(r.amount||0).toFixed(2)}</td>
                      <td>
                        <span className={`badge ${r.status==='pending'?'bg-warning text-dark':'bg-success'}`}>{r.status}</span>
                      </td>
                      <td className="small text-truncate" style={{maxWidth:240}}>
                        {r.proof ? <code className="text-break">{String(r.proof).slice(0,240)}</code> : <span className="text-muted">—</span>}
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <button className="btn btn-outline-secondary" onClick={()=>updateRequestStatus(r.id, 'rejected')}>Rechazar</button>
                          <button className="btn btn-success" onClick={()=>updateRequestStatus(r.id, 'released')}>Liberar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ====== TARJETAS ====== */}
      {tab==='cards' && (
        <div className="row g-4">
          <div className="col-lg-4">
            <div className="soft-card">
              <h6 className="mb-3"><i className="bi bi-plus-circle me-2"></i>Alta en inventario</h6>
              <div className="mb-2">
                <label className="form-label small">PAN (número)</label>
                <input className="form-control" value={newCard.pan} onChange={e=>setNewCard(c=>({...c, pan:e.target.value}))}/>
              </div>
              <div className="mb-2">
                <label className="form-label small">Vencimiento (MM/AA)</label>
                <input className="form-control" value={newCard.exp} onChange={e=>setNewCard(c=>({...c, exp:e.target.value}))}/>
              </div>
              <div className="mb-3">
                <label className="form-label small">CVV</label>
                <input className="form-control" value={newCard.cvv} onChange={e=>setNewCard(c=>({...c, cvv:e.target.value}))}/>
              </div>
              <div className="d-grid">
                <button className="btn btn-primary btn-pill" onClick={addInventoryCard}>Agregar a inventario</button>
              </div>
            </div>

            <div className="soft-card mt-3">
              <h6 className="mb-3"><i className="bi bi-send-check me-2"></i>Asignar a usuario</h6>
              <div className="mb-2">
                <label className="form-label small">Correo del usuario</label>
                <input className="form-control" value={assignEmail} onChange={e=>setAssignEmail(e.target.value)} />
              </div>
              <div className="d-grid">
                <button className="btn btn-success btn-pill" disabled={!canAssign} onClick={()=>assignFirstAvailableTo(assignEmail)}>
                  {canAssign ? 'Asignar primera disponible' : 'Sin stock'}
                </button>
              </div>
            </div>
          </div>

          <div className="col-lg-8">
            <div className="soft-card">
              <h6 className="mb-3"><i className="bi bi-box me-2"></i>Inventario</h6>
              {!inventory.length && <div className="text-muted">Sin tarjetas en inventario.</div>}
              {!!inventory.length && (
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead><tr><th>PAN</th><th>Venc.</th><th>CVV</th><th>Alta</th></tr></thead>
                    <tbody>
                      {inventory.map(c=>(
                        <tr key={c.id}>
                          <td className="small">{c.pan}</td>
                          <td className="small">{c.exp}</td>
                          <td className="small">{c.cvv}</td>
                          <td className="small">{new Date(c.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="soft-card mt-3">
              <h6 className="mb-3"><i className="bi bi-people me-2"></i>Asignadas</h6>
              {!assigned.length && <div className="text-muted">Aún no hay asignaciones.</div>}
              {!!assigned.length && (
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead><tr><th>Usuario</th><th>PAN</th><th>Venc.</th><th>Asignada</th><th></th></tr></thead>
                    <tbody>
                      {assigned.map(c=>(
                        <tr key={c.id}>
                          <td className="small">{c.userEmail}</td>
                          <td className="small">{c.pan}</td>
                          <td className="small">{c.exp}</td>
                          <td className="small">{new Date(c.assignedAt).toLocaleString()}</td>
                          <td className="text-end">
                            <button className="btn btn-outline-danger btn-sm" onClick={()=>revokeAssigned(c.id)}>Revocar</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
