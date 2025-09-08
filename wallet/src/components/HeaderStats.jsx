export default function HeaderStats(){
  // 👉 función para scroll suave
  const go = (id) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="gradient-card">
      <div className="row g-3 align-items-center">
        <div className="col-lg-8">
          <div className="d-flex align-items-center gap-2 mb-1">
            <i className="bi bi-rocket-takeoff"></i>
            <span className="opacity-75">Balance Total</span>
          </div>
          <div className="balance-number">$12,847.50</div>
          <div className="d-flex flex-wrap gap-3 mt-3">
            <div className="kpi">Disponible<br/><strong>$11,200.30</strong></div>
            <div className="kpi">Pendiente<br/><strong>$1,647.20</strong></div>
          </div>
          <div className="d-flex gap-2 mt-3">
            {/* scroll suave a la sección de Retiro */}
            <button 
              className="btn btn-light fw-semibold" 
              onClick={()=>go('withdraw')}
            >
              <i className="bi bi-box-arrow-in-down me-1"></i> Retirar
            </button>

            {/* scroll suave a la sección de Depósito */}
            <button 
              className="btn btn-ghost text-white border" 
              onClick={()=>go('deposit')}
            >
              <i className="bi bi-upload me-1"></i> Depositar
            </button>
          </div>
        </div>

        <div className="col-lg-4 text-end">
          <div className="opacity-75">USDT Equivalente</div>
          <div className="h5 fw-bold">12,847.50 USDT</div>
        </div>
      </div>
    </div>
  )
}
