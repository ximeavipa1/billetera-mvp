// src/components/NotifyBell.jsx
import { useEffect, useState } from 'react'
import { listNotifications, unreadCount, markAllRead, clearNotifications } from '../utils/notify'


export default function NotifyBell(){
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState(listNotifications())
  const [unread, setUnread] = useState(unreadCount())

  useEffect(()=>{
    const refresh = ()=>{ setItems(listNotifications().slice().reverse()); setUnread(unreadCount()) }
    refresh()
    const onPush = ()=> refresh()
    const onUpd = ()=> refresh()
    window.addEventListener('wallet:notify', onPush)
    window.addEventListener('wallet:notify:update', onUpd)
    return ()=>{
      window.removeEventListener('wallet:notify', onPush)
      window.removeEventListener('wallet:notify:update', onUpd)
    }
  },[])

  const toggle = ()=>{
    const next = !open
    setOpen(next)
    if(next) markAllRead()
  }

  return (
    <div className="position-relative">
      <button className="btn btn-outline-secondary btn-sm position-relative" title="Notificaciones" onClick={toggle}>
        <i className="bi bi-bell"></i>
        {unread>0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {unread>9?'9+':unread}
          </span>
        )}
      </button>

      {open && (
        <div className="dropdown-menu dropdown-menu-end show p-0" style={{minWidth: 360, maxWidth: 420}}>
          <div className="p-2 d-flex align-items-center justify-content-between border-bottom">
            <strong>Notificaciones</strong>
            <button className="btn btn-sm btn-light" onClick={clearNotifications}>Limpiar</button>
          </div>
          <div style={{maxHeight: 320, overflowY:'auto'}}>
            {items.length===0 && <div className="p-3 text-muted small">Sin notificaciones por ahora.</div>}
            {items.map(n=>(
              <div key={n.id} className="p-3 border-bottom">
                <div className="d-flex align-items-center gap-2">
                  <i className={`bi ${iconFor(n.type)}`}></i>
                  <div className="flex-grow-1">
                    <div className="fw-semibold">{n.title}</div>
                    <div className="small text-muted">{n.message}</div>
                    <div className="small text-muted mt-1">{new Date(n.when).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function iconFor(type){
  switch(type){
    case 'success': return 'bi-check-circle text-success'
    case 'warning': return 'bi-exclamation-triangle text-warning'
    case 'error': return 'bi-x-circle text-danger'
    default: return 'bi-info-circle text-primary'
  }
}
