// === utils/notify.js ================================================
// Almacén de notificaciones (solo frontend / demo)
const LS_NOTIF   = 'wallet.notifications'; // array de notifs
const LS_SESSION = 'wallet.session';       // sesión local (para admin email mock)

// ---------------- storage helpers ----------------
const readAll = () => {
  try { return JSON.parse(localStorage.getItem(LS_NOTIF) || '[]'); }
  catch { return []; }
};
const writeAll = (arr) => localStorage.setItem(LS_NOTIF, JSON.stringify(arr));

// ---------------- email (mock) -------------------
// En producción: esto hará fetch a tu backend PHP para que envíe email real.
export async function sendAdminEmail({ subject, text }) {
  // await fetch('/api/notify/email', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({subject, text}) })
  console.info('[MOCK email → admin]', subject, text);
}

// ---------------- admin email helper -------------
export function getAdminEmail() {
  try {
    const s = JSON.parse(localStorage.getItem(LS_SESSION) || 'null');
    return (s?.role === 'admin' && s?.email) ? s.email : 'admin@tu-empresa.com';
  } catch {
    return 'admin@tu-empresa.com';
  }
}

// ---------------- núcleo de notificaciones -------
// Estructura del item:
// { id, channel:'admin'|'user', kind:'withdraw'|'deposit'|'card'|string,
//   type:'info'|'success'|'warning'|'error', title, message, meta, read, when }
function push({ channel='user', kind='info', type='info', title='', message='', meta={} }) {
  const arr = readAll();
  const item = {
    id: 'N' + Date.now() + Math.random().toString(16).slice(2,6).toUpperCase(),
    channel, kind, type, title, message, meta,
    read: false,
    when: Date.now()
  };
  arr.push(item);
  writeAll(arr);
  // eventos para que la UI (campanita) pueda reaccionar
  window.dispatchEvent(new CustomEvent('wallet:notify', { detail: item }));
  window.dispatchEvent(new Event('wallet:notify:update'));
  return item;
}

// Wrappers que ya usan tus componentes:
export function notifyAdmin(kind, payload = {}) {
  // payload puede incluir: { title, message, meta, type }
  const { title='', message='', meta={}, type='info' } = payload;
  return push({ channel:'admin', kind, type, title, message, meta });
}

export function notifyUser(kind, payload = {}) {
  const { title='', message='', meta={}, type='info' } = payload;
  return push({ channel:'user', kind, type, title, message, meta });
}

// ---------------- consulta / gestión -------------
// Lista total o filtrada por canal
export function listNotifications(channel /* 'admin' | 'user' | undefined */) {
  const all = readAll();
  return channel ? all.filter(n => n.channel === channel) : all;
}
export function listUserNotifications()  { return listNotifications('user'); }
export function listAdminNotifications() { return listNotifications('admin'); }

// contadores
export function unreadCount(channel) {
  return listNotifications(channel).filter(n => !n.read).length;
}

// marcar como leídas (todas o por canal)
export function markAllRead(channel) {
  const all = readAll().map(n => channel && n.channel !== channel ? n : ({ ...n, read:true }));
  writeAll(all);
  window.dispatchEvent(new Event('wallet:notify:update'));
}

// limpiar (todas o por canal)
export function clearNotifications(channel) {
  if (!channel) {
    writeAll([]);
  } else {
    const left = readAll().filter(n => n.channel !== channel);
    writeAll(left);
  }
  window.dispatchEvent(new Event('wallet:notify:update'));
}


