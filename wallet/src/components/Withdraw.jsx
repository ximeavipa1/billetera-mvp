import { useMemo, useState, useEffect, useRef } from 'react'
import { RATES, FEES, CHANNELS, EXCHANGE_DATE } from '../mockConfig'
import { IconPayPal, IconBinance, ProviderBadge } from './icons'
import { notifyAdmin, notifyUser } from '../utils/notify'
// Orígenes (desde)
const FROM = [
  { id:'paypal',  name:'PayPal',   icon:<IconPayPal/> },
  { id:'binance', name:'Binance',  icon:<IconBinance/> },
  { id:'facebook',name:'Facebook', icon:<i className="bi bi-facebook fs-5"></i> },
  { id:'tiktok',  name:'TikTok',   icon:<i className="bi bi-tiktok fs-5"></i> },
]

// Destinos (hacia) — SIN USDT directo
const TO = [
  { id:'BINANCE', name:'Binance (USDT)' },
  { id:'BOB_QR',  name:'Bolivianos (QR bancario)' },
  { id:'CARD',    name:'Tarjeta virtual' }
]

// rate por destino
const rateKey = (_from, to) => (to === 'BOB_QR' ? 'USD_BOB' : 'USD_USDT')
const feeKey  = (from, to) => `${from}->${to}`

// sesión / métodos (demo)
const readSession = () => { try{ return JSON.parse(localStorage.getItem('wallet.session')||'null') }catch{ return null } }
const readMethods = () => { try{ return JSON.parse(localStorage.getItem('wallet.methods')||'null') }catch{ return null } }

// guarda/lee QR destino del usuario (demo)
const LS_USER_QR = 'wallet.userQR'
const saveUserQR = (dataURL) => { try{ localStorage.setItem(LS_USER_QR, JSON.stringify({ dataURL, ts:Date.now() })) }catch{ /* storage off */ } }
const loadUserQR = () => { try{ return JSON.parse(localStorage.getItem(LS_USER_QR)||'null') }catch{ return null } }

export default function Withdraw(){
  const [from, setFrom] = useState('paypal')
  const [to, setTo]     = useState('BOB_QR')
  const [amount, setAmount] = useState('') // USD origen
  const [step, setStep] = useState(1)      // 1 cotizar / 2 instrucciones

  // perfil
  const [profileEmail, setProfileEmail] = useState('')
  const [binanceId, setBinanceId] = useState('')

  // para FB/TikTok
  const adminFromReceiver = CHANNELS[from]?.receiver || null

  // QR destino (BOB): imagen subida o capturada
  const [qrPreview, setQrPreview] = useState(loadUserQR()?.dataURL || '')
  const [qrModal, setQrModal] = useState(false)

  // refs de cámara
  const videoRef  = useRef(null)
  const streamRef = useRef(null)

  // cargar sesión/métodos
  useEffect(()=>{
    const sess = readSession()
    const meth = readMethods()
    setProfileEmail(sess?.email || '')
    setBinanceId(meth?.binanceId || '')
  },[])

  // iniciar/detener cámara cuando se abre/cierra el modal
  useEffect(()=>{
    let active = true
    if (!qrModal) return

    ;(async ()=>{
      try{
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }, audio: false
        })
        if (!active) { stream.getTracks().forEach(t=>t.stop()); return }
        streamRef.current = stream
        if (videoRef.current){
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
      }catch(e){
        // usamos 'e' para evitar 'no-unused-vars' y no dejamos el bloque vacío
        if (import.meta.env?.MODE === 'development') console.debug('camera error:', e)
      }
    })()

    return ()=>{
      active = false
      try{
        streamRef.current?.getTracks()?.forEach(t=>t.stop())
        if (videoRef.current){
          videoRef.current.pause()
          videoRef.current.srcObject = null
        }
      }catch(e){
        if (import.meta.env?.MODE === 'development') console.debug('camera cleanup error:', e)
      }
    }
  },[qrModal])

  const rate = useMemo(()=> RATES[rateKey(from,to)] || 1, [from,to])
  const feePct = useMemo(()=> FEES[feeKey(from,to)] ?? 5, [from,to])

  const feeAmount = useMemo(()=>{
    const a = Number(amount||0)
    return +(a * (feePct/100)).toFixed(2)
  },[amount, feePct])

  const receive = useMemo(()=>{
    const a = Number(amount||0)
    const afterFee = a - (a * (feePct/100))
    const recv = to==='BOB_QR' ? afterFee * rate : afterFee * RATES.USD_USDT
    return to==='BOB_QR' ? `${recv.toFixed(2)} Bs` : `${recv.toFixed(2)} USDT`
  },[amount, feePct, to, rate])

  const canContinue = Number(amount) >= 10

  const fromHint = (() => {
    if (from==='paypal')  return `Se usará tu correo de PayPal: ${profileEmail || '—'}`
    if (from==='binance') return `Se usará tu Binance ID/Wallet: ${binanceId || '—'}`
    if (from==='facebook')return `Usa el correo configurado por el admin: ${adminFromReceiver || '—'}`
    if (from==='tiktok')  return `Usa el correo configurado por el admin: ${adminFromReceiver || '—'}`
    return ''
  })()

  // subir imagen de QR
  const onUploadQR = (e)=>{
    const f = e.target.files?.[0]
    if(!f) return
    if(!/^image\//.test(f.type)) { alert('Elige una imagen de QR'); return }
    const r = new FileReader()
    r.onload = () => { const dataURL = r.result; setQrPreview(dataURL); saveUserQR(dataURL) }
    r.readAsDataURL(f)
  }

  // capturar un frame del video como imagen (no decodificamos)
  const captureFromCamera = ()=>{
    try{
      const video = videoRef.current
      if(!video) return
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 360
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const dataURL = canvas.toDataURL('image/png')
      setQrPreview(dataURL)
      saveUserQR(dataURL)
      setQrModal(false)
    }catch(e){
      if (import.meta.env?.MODE === 'development') console.debug('capture error:', e)
      alert('No se pudo capturar el QR. Intenta de nuevo.')
    }
  }

  // crear solicitud (demo + notificaciones)
  const createRequest = ()=>{
    const sess = readSession()
    const email = sess?.email || 'user@mail.com'
    const req = {
      id: 'RW-'+Date.now(),
      userEmail: email,
      from, to,
      amount: Number(amount||0),
      status: 'pending',
      proof: to==='BOB_QR' ? (qrPreview ? '[QR adjunto]' : '') : '',
      createdAt: Date.now()
    }
    // guardar en “bandeja” del admin (mock)
    try{
      const key = 'wallet.requests'
      const all = JSON.parse(localStorage.getItem(key) || '[]')
      all.push(req)
      localStorage.setItem(key, JSON.stringify(all))
    }catch(e){
      if (import.meta.env?.MODE === 'development') console.debug('save request error:', e)
    }

    // avisos mock
    notifyAdmin('Nueva solicitud de retiro', `${email} solicita ${from} → ${to} por $${req.amount.toFixed(2)}`)
    notifyUser(email, 'Solicitud registrada', `Tu solicitud ${req.id} quedó en estado pendiente`)

    alert('Solicitud creada (demo). La verás en el panel de administración.')
    setStep(1)
    setAmount('')
  }

  return (
    <div className="soft-card" id="withdraw">
      <div className="d-flex align-items-center justify-content-between mb-2">
        <div className="d-flex align-items-center gap-2">
          <i className="bi bi-arrow-left-right text-success"></i>
          <h5 className="mb-0">Intercambiar saldo</h5>
        </div>
        <div className="small text-success">
          tipo de cambio {EXCHANGE_DATE} <strong>{RATES.USD_BOB}</strong> Bs/USD
        </div>
      </div>

      {step===1 && (
        <>
          <div className="row g-3">
            <div className="col-lg-6">
              <div className="text-muted mb-1">Desde</div>
              <div className="row g-2">
                {FROM.map(p=>(
                  <div key={p.id} className="col-12" onClick={()=>setFrom(p.id)}>
                    <ProviderBadge active={from===p.id}>
                      {p.icon} <span className="name">{p.name}</span>
                    </ProviderBadge>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-lg-6">
              <div className="text-muted mb-1">Hacia</div>
              <select className="form-select" value={to} onChange={e=>setTo(e.target.value)}>
                {TO.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
              <div className="small text-muted mt-2">{fromHint}</div>
            </div>
          </div>

          <div className="row g-3 mt-2">
            <div className="col-lg-6">
              <div className="text-muted mb-1">Monto (USD)</div>
              <div className="input-group">
                <span className="input-group-text">$</span>
                <input className="form-control" type="number" min="1" step="0.01"
                  placeholder="0.00" value={amount} onChange={e=>setAmount(e.target.value)} />
              </div>
              <small className="text-muted">Mínimo: $10 • Máximo: $5,000</small>
            </div>

            <div className="col-lg-6">
              <div className="text-muted mb-1">Recibes aprox.</div>
              <div className="form-control bg-light fw-semibold">{receive}</div>
              <div className="d-flex gap-3 small mt-2">
                <span className="badge bg-light text-dark border">Fee {feePct}% (${feeAmount})</span>
                <span className="badge bg-light text-dark border">Rate {rate} {to==='BOB_QR'?'Bs/USD':'USDT/USD'}</span>
              </div>
            </div>
          </div>

          <div className="d-grid mt-3">
            <button className="btn btn-primary btn-pill" disabled={!canContinue} onClick={()=>setStep(2)}>
              Continuar
            </button>
          </div>
        </>
      )}

      {step===2 && (
        <>
          <div className="alert alert-success">
            Revisa los datos y sigue las instrucciones para completar tu intercambio.
          </div>

          <div className="row g-3">
            {/* ORIGEN */}
            <div className="col-lg-6">
              <div className="p-3 rounded border">
                <div className="fw-bold mb-1">(1) Envía desde {from.toUpperCase()}</div>
                <div className="small text-muted">Monto: ${Number(amount||0).toFixed(2)}</div>
                <hr/>
                <div className="small">{CHANNELS[from]?.label}</div>

                {from==='paypal' && (
                  <div className="mt-1 small">Tu correo PayPal: <strong>{profileEmail || '—'}</strong></div>
                )}
                {from==='binance' && (
                  <div className="mt-1 small">Tu Binance ID/Wallet: <strong>{binanceId || '—'}</strong></div>
                )}
                {(from==='facebook' || from==='tiktok') && (
                  <div className="mt-1 small">Correo asignado por admin: <strong>{CHANNELS[from]?.receiver || '—'}</strong></div>
                )}

                {CHANNELS[from]?.note && <div className="small text-muted mt-2">{CHANNELS[from].note}</div>}
              </div>
            </div>

            {/* DESTINO */}
            <div className="col-lg-6">
              <div className="p-3 rounded border">
                <div className="fw-bold mb-1">(2) Recibirás en {to.replace('_',' ').toUpperCase()}</div>
                <div className="small text-muted">Aprox.: {receive} (fee {feePct}%)</div>
                <hr/>
                <div className="small">{CHANNELS[to]?.label}</div>

                {to==='BINANCE' && (
                  <div className="mt-1 small">Wallet destino (tu perfil): <strong>{binanceId || '—'}</strong></div>
                )}

                {to==='BOB_QR' && (
                  <div className="mt-2">
                    <div className="small text-muted mb-2">
                      Carga el <b>QR de tu banco</b> (imagen) o escanéalo con la cámara. Lo usaremos para acreditarte en Bs.
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      <label className="btn btn-outline-secondary btn-sm">
                        <i className="bi bi-upload me-1"></i> Subir imagen
                        <input type="file" accept="image/*" hidden onChange={onUploadQR}/>
                      </label>
                      <button className="btn btn-outline-secondary btn-sm" onClick={()=>setQrModal(true)}>
                        <i className="bi bi-camera me-1"></i> Escanear QR
                      </button>
                    </div>

                    {qrPreview && (
                      <div className="text-center mt-2">
                        <img src={qrPreview} alt="QR destino (tu banco)" className="img-fluid rounded" style={{maxWidth:220}}/>
                        <div className="small text-muted mt-1">QR guardado en este dispositivo (demo).</div>
                      </div>
                    )}
                  </div>
                )}

                {CHANNELS[to]?.note && <div className="small text-muted mt-2">{CHANNELS[to].note}</div>}
              </div>
            </div>
          </div>

          <div className="d-flex gap-2 mt-3">
            <button className="btn btn-outline-secondary btn-pill" onClick={()=>setStep(1)}>
              <i className="bi bi-chevron-left me-1"></i> Volver
            </button>
            <button className="btn btn-primary btn-pill ms-auto" onClick={createRequest}>
              Crear solicitud
            </button>
          </div>
        </>
      )}

      {qrModal && (
        <div className="qr-overlay" role="dialog" aria-modal="true">
          <div className="qr-modal">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h6 className="mb-0"><i className="bi bi-qr-code-scan me-2"></i>Escanear QR (cámara)</h6>
              <button className="btn btn-sm btn-outline-secondary" onClick={()=>setQrModal(false)}>Cerrar</button>
            </div>

            <div className="qr-video-wrap">
              <video ref={videoRef} className="qr-video" playsInline muted />
              <div className="qr-hud"></div>
            </div>

            <div className="d-flex gap-2 mt-2">
              <button className="btn btn-primary btn-pill" onClick={captureFromCamera}>Capturar</button>
              <button className="btn btn-outline-secondary btn-pill ms-auto" onClick={()=>setQrModal(false)}>Cancelar</button>
            </div>

            <div className="small text-muted mt-2">
              Nota: guardamos solo la <b>imagen</b> del QR en este navegador. La lectura/validación real irá en backend.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
