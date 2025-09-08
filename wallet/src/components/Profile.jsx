import { useEffect, useState } from 'react'

const LS_SESSION = 'wallet.session'
const LS_METHODS = 'wallet.methods'      // { paypalEmail, binanceId, bankQrDataUrl }
const LS_PREFS   = 'wallet.prefs'        // { emailAlerts, locale, timezone }

// helpers
const readJSON = (k, fallback=null) => { try { return JSON.parse(localStorage.getItem(k) || 'null') ?? fallback } catch { return fallback } }
const saveJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v))

const readSession = () => readJSON(LS_SESSION, null)
const saveSession = (s) => saveJSON(LS_SESSION, s)

const fileToDataURL = (file) => new Promise((res, rej)=>{
  const r = new FileReader()
  r.onload = () => res(r.result)
  r.onerror = rej
  r.readAsDataURL(file)
})

export default function Profile({ onClose = ()=>{} }){
  const [tab, setTab] = useState('account')     // account | methods | prefs

  const [session, setSession] = useState(readSession())
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [avatar, setAvatar] = useState('')

  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [msg, setMsg] = useState('')

  // Métodos vinculados
  const [paypalEmail, setPaypalEmail] = useState('')
  const [binanceId, setBinanceId] = useState('')
  const [bankQr, setBankQr] = useState('')            // dataURL QR

  // Preferencias
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [locale, setLocale] = useState('es-BO')
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/La_Paz')

  useEffect(()=>{
    if (session) {
      setDisplayName(session.displayName || '')
      setEmail(session.email || '')
      setAvatar(session.avatar || '')
    }
    const m = readJSON(LS_METHODS, {})
    setPaypalEmail(m?.paypalEmail || '')
    setBinanceId(m?.binanceId || '')
    setBankQr(m?.bankQrDataUrl || '')

    const p = readJSON(LS_PREFS, {})
    setEmailAlerts(p?.emailAlerts ?? true)
    setLocale(p?.locale || 'es-BO')
    setTimezone(p?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/La_Paz')
  },[session])

  // --- ACCOUNT ---
  const onPickAvatar = async (e) => {
    const f = e.target.files?.[0]
    if(!f) return
    if (!/^image\//.test(f.type)) { alert('Elige una imagen'); return }
    const data = await fileToDataURL(f)
    setAvatar(data)
  }

  const onSaveAccount = () => {
    if(!/\S+@\S+\.\S+/.test(email)) { setMsg('Ingresa un correo válido'); return }
    if (newPass || confirmPass) {
      if (newPass.length < 6) { setMsg('La contraseña debe tener al menos 6 caracteres'); return }
      if (newPass !== confirmPass) { setMsg('Las contraseñas no coinciden'); return }
    }
    const next = { ...session, email: email.trim(), displayName: displayName.trim(), avatar: avatar || '' }
    saveSession(next)
    setSession(next)
    setNewPass('')
    setConfirmPass('')
    setMsg('Perfil actualizado (demo).')
    // backend: PATCH /me, POST /me/password
  }

  const onLogout = () => { localStorage.removeItem(LS_SESSION); window.location.reload() }

  // --- METHODS ---
  const onPickBankQr = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!/^image\//.test(f.type)) { alert('Sube una imagen QR'); return }
    const data = await fileToDataURL(f)
    setBankQr(data)
  }

  const onSaveMethods = () => {
    // recomendaciones: usar correo de PayPal real y/o ID/wallet real
    const payload = {
      paypalEmail: paypalEmail.trim(),
      binanceId: binanceId.trim(),
      bankQrDataUrl: bankQr || ''
    }
    saveJSON(LS_METHODS, payload)
    setMsg('Métodos guardados (demo).')
    // backend: PATCH /me/methods
  }

  // --- PREFS ---
  const onSavePrefs = () => {
    const payload = { emailAlerts: !!emailAlerts, locale, timezone }
    saveJSON(LS_PREFS, payload)
    setMsg('Preferencias guardadas (demo).')
    // backend: PATCH /me/prefs
  }

  if(!session){
    onClose?.()
    return null
  }

  const role = session.role || 'user'
  const roleBadge = role==='admin'
    ? <span className="badge bg-dark ms-2">Admin</span>
    : <span className="badge bg-secondary ms-2">Usuario</span>

  const Tab = ({id, icon, label}) => (
    <button
      className={`btn btn-sm ${tab===id?'btn-primary':'btn-outline-primary'}`}
      onClick={()=>setTab(id)}
    >
      <i className={`bi ${icon} me-1`}></i>{label}
    </button>
  )

  return (
    <div className="admin-overlay">
      <div className="admin-panel" style={{maxWidth: 860}}>
        <div className="d-flex align-items-center justify-content-between mb-2">
          <h5 className="mb-0"><i className="bi bi-person-circle me-2"></i>Mi perfil {roleBadge}</h5>
          <div className="d-flex gap-2">
            <Tab id="account" icon="bi-person" label="Cuenta" />
            <Tab id="methods" icon="bi-link-45deg" label="Métodos" />
            <Tab id="prefs"   icon="bi-gear" label="Preferencias" />
            <button className="btn btn-outline-secondary btn-sm" onClick={onClose}>
              Cerrar
            </button>
            <button className="btn btn-outline-danger btn-sm" onClick={onLogout}>
              Cerrar sesión
            </button>
          </div>
        </div>

        <div className="alert alert-light border small">
          Sugerencia: usa el <b>mismo correo</b> que empleas en <b>PayPal/Binance</b> para evitar rechazos de identidad.
        </div>

        {/* ===== TAB CUENTA ===== */}
        {tab==='account' && (
          <div className="row g-4">
            <div className="col-md-4">
              <div className="soft-card h-100 d-flex flex-column align-items-center text-center">
                <div className="mb-3">
                  <div className="avatar-xl mb-2">
                    {avatar
                      ? <img src={avatar} alt="avatar" className="rounded-circle border" style={{width:112, height:112, objectFit:'cover'}} />
                      : <div className="rounded-circle border d-flex align-items-center justify-content-center bg-light"
                            style={{width:112, height:112}}>
                          <i className="bi bi-person fs-1 text-muted"></i>
                        </div>}
                  </div>
                  <label className="btn btn-outline-secondary btn-sm">
                    <i className="bi bi-upload me-1"></i> Cambiar foto
                    <input type="file" accept="image/*" hidden onChange={onPickAvatar}/>
                  </label>
                </div>
                <div className="small text-muted">JPG/PNG • recomendado 256×256</div>
              </div>
            </div>

            <div className="col-md-8">
              <div className="soft-card">
                <div className="mb-3">
                  <label className="form-label small">Nombre para mostrar</label>
                  <input className="form-control" value={displayName} onChange={e=>setDisplayName(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="form-label small">Correo</label>
                  <input className="form-control" type="email" value={email} onChange={e=>setEmail(e.target.value)} />
                </div>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small">Nueva contraseña</label>
                    <input className="form-control" type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small">Confirmar contraseña</label>
                    <input className="form-control" type="password" value={confirmPass} onChange={e=>setConfirmPass(e.target.value)} />
                  </div>
                </div>

                {msg && <div className="alert alert-info py-2 mt-3">{msg}</div>}

                <div className="d-flex gap-2 mt-3">
                  <button className="btn btn-primary btn-pill" onClick={onSaveAccount}>
                    Guardar cambios
                  </button>
                  <button className="btn btn-outline-secondary btn-pill" onClick={()=>setMsg('')}>
                    Cancelar
                  </button>
                </div>
              </div>

              <div className="alert alert-light border small mt-3">
                Próximamente: verificación de correo, 2FA, y conexiones externas.
              </div>
            </div>
          </div>
        )}

        {/* ===== TAB MÉTODOS ===== */}
        {tab==='methods' && (
          <div className="row g-4">
            <div className="col-lg-6">
              <div className="soft-card">
                <h6 className="mb-3"><i className="bi bi-paypal me-1"></i>PayPal</h6>
                <label className="form-label small">Correo de PayPal</label>
                <input
                  className="form-control mb-3"
                  placeholder="tu-correo@paypal.com"
                  value={paypalEmail}
                  onChange={e=>setPaypalEmail(e.target.value)}
                />

                <h6 className="mb-3 mt-1"><i className="bi bi-currency-bitcoin me-1"></i>Binance</h6>
                <label className="form-label small">ID o Wallet (USDT)</label>
                <input
                  className="form-control"
                  placeholder="TU-WALLET-USDT (ej. TRC20)"
                  value={binanceId}
                  onChange={e=>setBinanceId(e.target.value)}
                />
              </div>
            </div>

            <div className="col-lg-6">
              <div className="soft-card">
                <h6 className="mb-3"><i className="bi bi-qr-code-scan me-1"></i>QR bancario (Bs)</h6>
                <div className="mb-2">
                  <label className="form-label small">Subir QR (imagen)</label>
                  <input className="form-control" type="file" accept="image/*" onChange={onPickBankQr}/>
                </div>
                {bankQr
                  ? <div className="text-center"><img src={bankQr} alt="QR bancario" className="img-fluid rounded border" style={{maxWidth:240}}/></div>
                  : <div className="text-muted small">Aún no hay QR cargado.</div>}
              </div>
            </div>

            <div className="col-12">
              {msg && <div className="alert alert-info py-2">{msg}</div>}
              <div className="d-flex gap-2">
                <button className="btn btn-primary btn-pill" onClick={onSaveMethods}>Guardar métodos</button>
                <button className="btn btn-outline-secondary btn-pill" onClick={()=>setMsg('')}>Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {/* ===== TAB PREFERENCIAS ===== */}
        {tab==='prefs' && (
          <div className="row g-4">
            <div className="col-lg-6">
              <div className="soft-card">
                <h6 className="mb-3"><i className="bi bi-envelope-check me-1"></i>Notificaciones</h6>
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" id="emailAlerts" checked={emailAlerts} onChange={e=>setEmailAlerts(e.target.checked)} />
                  <label className="form-check-label" htmlFor="emailAlerts">Alertas por correo (retiros/estado)</label>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="soft-card">
                <h6 className="mb-3"><i className="bi bi-globe me-1"></i>Regional</h6>
                <div className="mb-2">
                  <label className="form-label small">Idioma</label>
                  <select className="form-select" value={locale} onChange={e=>setLocale(e.target.value)}>
                    <option value="es-BO">Español (BO)</option>
                    <option value="es-CO">Español (CO)</option>
                    <option value="es-MX">Español (MX)</option>
                    <option value="en-US">English (US)</option>
                  </select>
                </div>
                <div>
                  <label className="form-label small">Zona horaria</label>
                  <input className="form-control" value={timezone} onChange={e=>setTimezone(e.target.value)} />
                  <div className="small text-muted mt-1">Detectada: {Intl.DateTimeFormat().resolvedOptions().timeZone}</div>
                </div>
              </div>
            </div>

            <div className="col-12">
              {msg && <div className="alert alert-info py-2">{msg}</div>}
              <div className="d-flex gap-2">
                <button className="btn btn-primary btn-pill" onClick={onSavePrefs}>Guardar preferencias</button>
                <button className="btn btn-outline-secondary btn-pill" onClick={()=>setMsg('')}>Cancelar</button>
              </div>

              <div className="alert alert-light border small mt-3">
                Próximamente: 2FA, cerrar sesión en todos los dispositivos y eliminación de cuenta.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
