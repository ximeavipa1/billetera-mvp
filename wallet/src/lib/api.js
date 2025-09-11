// src/lib/api.js
// Client HTTP para la API real (sin mocks)

// Base URL desde Vite (.env). Quita cualquier "/" final.
const API_BASE =
  (import.meta.env.VITE_API_BASE || 'http://localhost:8000').replace(/\/+$/, '')

// Lee sesión guardada por el Login (token, email, role)
function getSession () {
  try { return JSON.parse(localStorage.getItem('wallet.session') || 'null') }
  catch { return null }
}

// Construye un Error con mensaje del backend si existe
async function buildError (res) {
  try {
    const data = await res.json()
    const msg = data?.error || data?.message || `HTTP ${res.status}`
    return new Error(msg)
  } catch {
    return new Error(`HTTP ${res.status}`)
  }
}

// Wrapper de fetch con headers comunes, token y fallback /list.php si 404
async function apiFetch (path, opts = {}) {
  const url = `${API_BASE}${path.startsWith('/') ? path : '/' + path}`

  const headers = new Headers(opts.headers || {})
  headers.set('Accept', 'application/json')
  if (opts.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const s = getSession()
  if (s?.token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${s.token}`)
  }

  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',    // permite cookies si algún día las usamos
    ...opts,
    headers
  })

  // Fallback legacy para /list → /list.php si el router no lo reconoce
  if (res.status === 404 && path.startsWith('/list')) {
    const q = path.includes('?') ? path.slice(path.indexOf('?')) : ''
    const res2 = await fetch(`${API_BASE}/list.php${q}`, {
      method: 'GET',
      credentials: 'include',
      headers
    })
    if (!res2.ok) throw await buildError(res2)
    return res2.json()
  }

  if (!res.ok) throw await buildError(res)
  return res.json()
}

export const api = {
  config () {
    return apiFetch('/config')        // GET público
  },
  list (email) {
    const p = new URLSearchParams({ email })
    return apiFetch(`/list?${p.toString()}`)   // GET público (por email)
  },
  create (payload) {
    return apiFetch('/create', { method: 'POST', body: JSON.stringify(payload) }) // requiere token
  },
  login (email, password) {
    return apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
  },
  me () {
    return apiFetch('/me')            // requiere token
  }
}
