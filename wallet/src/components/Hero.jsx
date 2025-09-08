export default function Hero({onCTA}){
  return (
    <div className="hero p-4 p-md-5">
      <div className="row align-items-center">
        <div className="col-lg-7">
          <h1 className="display-6 fw-bold mb-2">Retira,todo en orden</h1>
          <p className="lead mb-4">Retiros claros, tarjeta virtual e historial. Diseño verde botella con acabado glass.</p>
          <button className="btn btn-cta btn-lg me-2" onClick={onCTA}>
            <i className="bi bi-qr-code-scan me-1"></i> Solicitar retiro
          </button>
          <a className="btn btn-ghost btn-lg" href="#historial"><i className="bi bi-list-check me-1"></i> Historial</a>
        </div>
      </div>
    </div>
  )
}
