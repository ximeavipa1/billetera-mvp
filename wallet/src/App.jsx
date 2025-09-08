import { useState, useEffect } from 'react'
import NAV from './components/NAV'
import HeaderStats from './components/HeaderStats'
import Withdraw from './components/Withdraw'
import VirtualCard from './components/VirtualCard'
import History from './components/History'
import ErrorBoundary from './ErrorBoundary'
import AdminPanel from './components/AdminPanel'
import Login from './components/Login'
import Profile from './components/Profile'   

// flags de demo
export const API_BASE = 'http://localhost:8000';

export const USE_MOCK = false;

// helper local: lectura segura de sesión
const getSession = () => {
  try { return JSON.parse(localStorage.getItem('wallet.session') || 'null') } catch { return null }
}

const Fallback = () => (
  <div className="text-center py-5">
    <div className="spinner-border"></div>
  </div>
)

export default function App(){
  const [showAdmin, setShowAdmin] = useState(false)
  const [showProfile, setShowProfile] = useState(false)  
  const [session, setSession] = useState(getSession())

  // refrescar si cambia en otra pestaña
  useEffect(()=>{
    const onStorage = (e)=>{ if(e.key==='wallet.session') setSession(getSession()) }
    window.addEventListener('storage', onStorage)
    return ()=> window.removeEventListener('storage', onStorage)
  },[])

  // cerrar Admin con ESC + bloquear scroll body
  useEffect(()=>{
    const onKey = (e)=>{ if(e.key==='Escape' && showAdmin) setShowAdmin(false) }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = (showAdmin || showProfile) ? 'hidden' : '' // ⬅️ bloquea scroll si perfil o admin abiertos
    return ()=>{
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  },[showAdmin, showProfile])

  // si no es admin, cierra admin si estuviera abierto
  useEffect(()=>{
    if (session && session.role !== 'admin' && showAdmin) setShowAdmin(false)
  }, [session, showAdmin])

  // si no hay sesión → login
  if(!session){
    return (
      <>
        <ErrorBoundary>
          <Login/>
        </ErrorBoundary>
        <div className="container my-4 text-center">
          <small>© 2025 Wallet — Todos los derechos reservados</small>
        </div>
      </>
    )
  }

  return (
    <>
      <ErrorBoundary>
        <NAV
          adminOpen={showAdmin}
          onToggleAdmin={() => setShowAdmin(s => !s)}
          onOpenProfile={() => setShowProfile(true)}   // ⬅️ NUEVO
        />
      </ErrorBoundary>

      {/* Overlay Perfil */}
      {showProfile && (
        <ErrorBoundary>
          <Profile onClose={() => setShowProfile(false)} />
        </ErrorBoundary>
      )}

      {/* Overlay Admin */}
      {showAdmin ? (
        <div className="admin-overlay">
          <div className="admin-panel">
            <ErrorBoundary>
              <AdminPanel onClose={() => setShowAdmin(false)} />
            </ErrorBoundary>
          </div>
        </div>
      ) : (
        <>
          <div className="container my-4">
            <ErrorBoundary fallback={<Fallback/>}>
              <HeaderStats/>
            </ErrorBoundary>
          </div>

          <div className="container">
            <div className="row g-4">
              <div className="col-lg-6">
                <ErrorBoundary fallback={<Fallback/>}>
                  <Withdraw/>
                </ErrorBoundary>
              </div>
              <div className="col-lg-6">
                <ErrorBoundary fallback={<Fallback/>}>
                  <VirtualCard/>
                </ErrorBoundary>
              </div>
            </div>

            <div className="row g-4 mt-1">
              <div className="col-lg-12">
                <ErrorBoundary fallback={<Fallback/>}>
                  <History/>
                </ErrorBoundary>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="container my-4 text-center">
        <small>© 2025 Wallet — Todos los derechos reservados</small>
      </div>
    </>
  )
}
