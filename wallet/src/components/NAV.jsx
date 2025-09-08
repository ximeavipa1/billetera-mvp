import { useConfig } from '../configStore'
import { useState, useEffect } from 'react'
import NotifyBell from './NotifyBell' // ✅ campana con contador y dropdown

export default function NAV({ adminOpen = false, onToggleAdmin = () => {}, onOpenProfile = () => {} }) {
  const { config } = useConfig()
  const rate = config?.rates?.USD_BOB ?? 0
  const date = config?.exchangeDate ?? '—'

  const [session, setSession] = useState({ email: 'user@mail.com', role: 'user' })

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('wallet.session') || '{}')
      if (s?.email) setSession(s)
    } catch { /* noop */ }
  }, [])

  return (
    <nav className="navbar bg-white border-bottom sticky-top">
      <div className="container">
        <a className="navbar-brand d-flex align-items-center" href="#">
          <i className="bi bi-wallet2 me-2"></i>Wallet
        </a>

        <div className="d-flex align-items-center gap-2">
          {/* TC del día */}
          <span className="badge tc-pill">
            TC {date}: <strong className="ms-1">{rate}</strong> Bs
          </span>

          {/* Botón Admin (solo rol admin) */}
          {session.role === 'admin' && (
            <button
              className={`btn btn-sm ${adminOpen ? 'btn-dark' : 'btn-outline-dark'}`}
              onClick={onToggleAdmin}
              title="Panel de configuración"
            >
              <i className="bi bi-sliders me-1"></i>{adminOpen ? 'Cerrar' : 'Admin'}
            </button>
          )}

          {/* Notificaciones */}
          <NotifyBell />

          {/* Mi perfil */}
          <button className="btn btn-primary btn-sm" onClick={onOpenProfile} title="Mi perfil">
            <i className="bi bi-person-circle me-1"></i> {session.displayName || session.email || 'Mi Cuenta'}
          </button>

          {/* Salir */}
          <button
            className="btn btn-outline-secondary btn-sm"
            title="Salir"
            onClick={() => {
              localStorage.removeItem('wallet.session')
              location.reload()
            }}
          >
            <i className="bi bi-box-arrow-right"></i>
          </button>
        </div>
      </div>
    </nav>
  )
}
