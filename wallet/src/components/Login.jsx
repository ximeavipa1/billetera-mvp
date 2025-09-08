import { useEffect, useState } from 'react'

const LS_SESSION = 'wallet.session'

const saveSession = (s) => localStorage.setItem(LS_SESSION, JSON.stringify(s))
const isEmail = (v) => /\S+@\S+\.\S+/.test(v)

export default function Login(){
  const [tab, setTab] = useState('login') // login | register

  // login
  const [email, setEmail] = useState('')
  const [pass, setPass]   = useState('')
  const [msg, setMsg]     = useState('')

  // registro
  const [rEmail, setREmail] = useState('')
  const [rPass,  setRPass]  = useState('')
  const [rPass2, setRPass2] = useState('')
  const [rMsg,   setRMsg]   = useState('')

  useEffect(()=>{ setMsg(''); setRMsg('') }, [tab])

  const doLogin = (e) => {
    e.preventDefault()
    if (!isEmail(email) || pass.length < 6) { setMsg('Correo o contraseña inválidos'); return }
    // Admin demo
    if (email.toLowerCase()==='admin@demo.com' && pass==='admin123') {
      saveSession({ email, role:'admin', displayName:'Admin' })
    } else {
      saveSession({ email, role:'user', displayName: email.split('@')[0] })
    }
    location.reload()
  }

  const doRegister = (e) => {
    e.preventDefault()
    if (!isEmail(rEmail)) { setRMsg('Correo inválido'); return }
    if (rPass.length < 6) { setRMsg('La contraseña debe tener al menos 6 caracteres'); return }
    if (rPass !== rPass2) { setRMsg('Las contraseñas no coinciden'); return }
    // registro sencillo -> sesión iniciada
    saveSession({ email: rEmail, role:'user', displayName: rEmail.split('@')[0] })
    location.reload()
  }

  return (
    <div className="container py-5" style={{maxWidth:520}}>
      <div className="soft-card">
        <div className="d-flex gap-2 mb-3">
          <button className={`btn btn-sm ${tab==='login'?'btn-primary':'btn-outline-primary'}`} onClick={()=>setTab('login')}>
            Iniciar sesión
          </button>
          <button className={`btn btn-sm ${tab==='register'?'btn-primary':'btn-outline-primary'}`} onClick={()=>setTab('register')}>
            Crear cuenta
          </button>
        </div>

        {tab==='login' && (
          <form onSubmit={doLogin}>
            <div className="mb-3">
              <label className="form-label small">Correo</label>
              <input className="form-control" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="mail@ejemplo.com" />
              <div className="small text-muted mt-1">Recomendado: mismo correo que usas en PayPal/Binance.</div>
            </div>
            <div className="mb-3">
              <label className="form-label small">Contraseña</label>
              <input className="form-control" type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" />
            </div>

            {msg && <div className="alert alert-warning py-2">{msg}</div>}

            <div className="d-grid">
              <button className="btn btn-primary btn-pill" type="submit">Entrar</button>
            </div>

            <hr className="my-4"/>

            <div className="text-center">
              <div className="small mb-2">o entra con</div>
              <div className="d-flex justify-content-center gap-2">
                <button className="btn btn-light border">
                  <img src="https://www.paypalobjects.com/webstatic/icon/favicon.ico" alt="PayPal" width="16" className="me-1"/>
                  PayPal
                </button>
                <button className="btn btn-light border">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/e/e8/Binance_Logo.svg" alt="Binance" width="16" className="me-1"/>
                  Binance
                </button>
              </div>
              <div className="small text-muted mt-2">Facil y Seguro</div>
            </div>
          </form>
        )}

        {tab==='register' && (
          <form onSubmit={doRegister}>
            <div className="mb-3">
              <label className="form-label small">Correo</label>
              <input className="form-control" type="email" value={rEmail} onChange={e=>setREmail(e.target.value)} placeholder="mail@ejemplo.com" />
              <div className="small text-muted mt-1">Usa el correo que empleas en PayPal/Binance.</div>
            </div>
            <div className="mb-3">
              <label className="form-label small">Contraseña</label>
              <input className="form-control" type="password" value={rPass} onChange={e=>setRPass(e.target.value)} placeholder="mín. 6 caracteres" />
            </div>
            <div className="mb-3">
              <label className="form-label small">Confirmar contraseña</label>
              <input className="form-control" type="password" value={rPass2} onChange={e=>setRPass2(e.target.value)} placeholder="repite tu contraseña" />
            </div>

            {rMsg && <div className="alert alert-warning py-2">{rMsg}</div>}

            <div className="d-grid">
              <button className="btn btn-primary btn-pill" type="submit">Crear cuenta</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
