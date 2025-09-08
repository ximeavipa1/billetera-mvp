import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state = { hasError:false, error:null } }
  static getDerivedStateFromError(error){ return { hasError:true, error } }
  componentDidCatch(error, info){ console.error('ErrorBoundary:', error, info) }
  render(){
    if (this.state.hasError) {
      return (
        <div className="container my-5">
          <div className="alert alert-danger">
            <strong>Ups… algo falló al renderizar este bloque.</strong><br/>
            Revisa la consola para ver el detalle. Puedes deshacer el último cambio y recargar.
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
