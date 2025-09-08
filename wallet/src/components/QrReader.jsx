import { useEffect, useRef, useState } from 'react'
import { BrowserQRCodeReader } from '@zxing/browser'

export default function QrReader({ onResult, onClose }) {
  const videoRef = useRef(null)
  const controlsRef = useRef(null)
  const [tab, setTab] = useState('camera') // 'camera' | 'image'
  const [error, setError] = useState('')

  // Escaneo por cámara
  useEffect(() => {
    if (tab !== 'camera') return
    let stopped = false
    const codeReader = new BrowserQRCodeReader()

    ;(async () => {
      try {
        const controls = await codeReader.decodeFromVideoDevice(
          undefined, // auto-select
          videoRef.current,
          (result, err, controls) => {
            if (stopped) return
            if (result) {
              onResult?.(result.getText())
              controls.stop()
              controlsRef.current = null
              onClose?.()
            }
          }
        )
        controlsRef.current = controls
      } catch (e) {
        console.error(e)
        // No tirar la app: solo mostramos el error
        setError('No se pudo iniciar la cámara. Usa HTTPS o revisa permisos.')
      }
    })()

    return () => {
     stopped = true
     try {
       controlsRef.current?.stop()
      } catch (err) {
        console.warn("No se pudo detener el escáner:", err)
      }
      controlsRef.current = null
    }
      
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  // Escaneo por imagen
  const onPickImage = async (e) => {
    setError('')
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onload = async () => {
        try {
          const reader = new BrowserQRCodeReader()
          const result = await reader.decodeFromImageElement(img)
          if (result) {
            onResult?.(result.getText())
            onClose?.()
          } else {
            setError('No se pudo leer el QR de la imagen.')
          }
        } catch (err) {
          console.error(err)
          setError('Error leyendo el QR de la imagen.')
        } finally {
          URL.revokeObjectURL(url)
        }
      }
      img.onerror = () => {
        setError('Imagen inválida.')
        URL.revokeObjectURL(url)
      }
      img.src = url
    } catch (err) {
      console.error(err)
      setError('Error al procesar la imagen.')
    }
  }

  return (
    <div className="qr-overlay">
      <div className="qr-modal">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h6 className="mb-0">Escanear QR</h6>
          <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="btn-group w-100 mb-3">
          <button
            className={`btn btn-sm ${tab==='camera'?'btn-primary':'btn-outline-primary'}`}
            onClick={()=>setTab('camera')}
          >Cámara</button>
          <button
            className={`btn btn-sm ${tab==='image'?'btn-primary':'btn-outline-primary'}`}
            onClick={()=>setTab('image')}
          >Imagen</button>
        </div>

        {tab==='camera' ? (
          <div className="qr-video-wrap">
            <video ref={videoRef} className="qr-video" muted playsInline />
            <div className="qr-hud"></div>
          </div>
        ) : (
          <div className="text-center">
            <input type="file" accept="image/*" onChange={onPickImage} className="form-control" />
            <div className="small text-muted mt-2">Sube una foto del QR (png/jpg).</div>
          </div>
        )}

        {error && <div className="alert alert-warning mt-3">{error}</div>}
      </div>
    </div>
  )
}
