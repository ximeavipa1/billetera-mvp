// src/lib/apiClient.js
import { API_BASE } from '../App'

const tokenKey = 'wallet.token'

export const getToken = () => localStorage.getItem(tokenKey) || ''
export const setToken = (t) => localStorage.setItem(tokenKey, t)
export const clearToken = () => localStorage.removeItem(tokenKey)

export async function fetchJSON(path, opts = {}){
  const headers = { 'Content-Type': 'application/json', ...(opts.headers||{}) }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers })
  if (!res.ok){
    const msg = await res.text().catch(()=>res.statusText)
    throw new Error(msg || `HTTP ${res.status}`)
  }
  return res.status === 204 ? null : res.json()
}

// multipart (para subir QR)
export async function uploadFormData(path, formData){
  const headers = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${API_BASE}${path}`, { method:'POST', headers, body: formData })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
