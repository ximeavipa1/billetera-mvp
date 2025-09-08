// src/auth/session.js
const LS_SESSION = 'wallet.session'
const LS_USERS   = 'wallet.users'

// Lista blanca para rol admin (demo)
export const ADMIN_EMAILS = ['admin@demo.com']

export const getUsers = () => {
  try { return JSON.parse(localStorage.getItem(LS_USERS) || '[]') } catch { return [] }
}
export const setUsers = (list) => localStorage.setItem(LS_USERS, JSON.stringify(list))

export const getSession = () => {
  try { return JSON.parse(localStorage.getItem(LS_SESSION) || 'null') } catch { return null }
}
export const setSession = (s) => localStorage.setItem(LS_SESSION, JSON.stringify(s))
export const clearSession = () => localStorage.removeItem(LS_SESSION)

// Helper: decide rol a partir del correo
export const roleForEmail = (email) => (
  ADMIN_EMAILS.map(e=>e.toLowerCase()).includes((email||'').toLowerCase()) ? 'admin' : 'user'
)
