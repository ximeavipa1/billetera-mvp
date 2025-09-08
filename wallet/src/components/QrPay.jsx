import { useState } from 'react'

export default function QrPay(){
  const [mode,setMode] = useState('recibir')
  const [amount,setAmount] = useState('')
  const [qr,setQr] = useState(null)

  const generate = ()=>{
    const payload = encodeURIComponent(`${mode.toUpperCase()}|${Number(amount||0)}|USD|${Date.now()}`)
    setQr(`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${payload}`)
  }

  return (
    <div className="soft-card">
      <div className="d-flex align-items-center gap-2 mb-2">
        <i className="bi bi-qr-code text-success"></i>
        <h5 className="mb-0">Pagos QR</h5>
      </div>

      <div className="pill-switch mb-3">
        <div className={`pill ${mode==='recibir'?'active':''}`} onClick={()=>setMode('recibir')}>
          <i className="bi bi-download me-1"></i> Recibir Pago
        </div>
        <div className={`pill ${mode==='enviar'?'active':''}`} onClick={()=>setMode('enviar')}>
          <i className="bi bi-upload me-1"></i> Enviar Pago
        </div>
      </div>

      <div className="row g-3 align-items-end">
        <div className="col-md-6">
          <label className="form-label">Cantidad</label>
          <div className="input-group">
            <span className="input-group-text">$</span>
            <input className="form-control" type="number" min="1" step="0.01"
              placeholder="0.00" value={amount} onChange={e=>setAmount(e.target.value)} />
          </div>
        </div>
        <div className="col-md-6 text-md-end">
          <button className="btn btn-primary" onClick={generate} disabled={Number(amount)<=0}>
            {mode==='recibir'?'Generar QR':'Generar QR'}
          </button>
        </div>
      </div>

      {qr && (
        <div className="text-center mt-3">
          <img src={qr} alt="QR" className="img-fluid rounded shadow-sm" style={{maxWidth:240}}/>
        </div>
      )}
    </div>
  )
}
