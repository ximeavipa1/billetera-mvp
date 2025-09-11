// src/components/HeaderStats.jsx
import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export default function HeaderStats(){
  const [cfg, setCfg]     = useState(null)
  const [loading, setL]   = useState(false)
  const [error, setError] = useState('')

  useEffect(()=>{
    let abort = false
    ;(async ()=>{
      try{
        setL(true); setError('')
        const data = await api.config()
        if(!abort) setCfg(data)
      }catch(e){
        console.error('HeaderStats config error:', e)
        if(!abort) setError('No se pudo cargar configuración.')
      }finally{
        if(!abort) setL(false)
      }
    })()
    return ()=>{ abort = true }
  },[])

  if (loading) return <div className="soft-card">Cargando…</div>
  if (error)   return <div className="soft-card alert alert-light border mb-0">{error}</div>
  if (!cfg)    return null

  const date  = cfg.exchange_date
  const usd2bob = cfg?.rates?.USD_BOB

  return (
    <div className="soft-card">
      <div className="d-flex align-items-center gap-2 mb-2">
        <i className="bi bi-graph-up text-success"></i>
        <h5 className="mb-0">Estado</h5>
      </div>
      <div className="small text-muted">Actualizado: {date || '—'}</div>
      <div className="mt-2">
        <strong>USD → BOB:</strong> {usd2bob ?? '—'}
      </div>
    </div>
  )
}
