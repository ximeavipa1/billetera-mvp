export function IconPayPal({size=26}) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M33.7 9.6c-2.7-3.1-8.1-4-13.3-2.7-5.2 1.3-8.7 4.5-9.4 8.6l-3 18.8c-.1.7.4 1.3 1.1 1.3h6.6l.8-5h3.7c7.9 0 14.6-3.2 16.2-11.6.8-4.3-.1-7.6-2.7-9.4z" fill="#002F86"/>
      <path d="M36.2 18.9c-1.6 8.4-8.3 11.6-16.2 11.6h-3.7l-1.6 10.1h6.1c.7 0 1.2-.5 1.3-1.1l.5-3.2h1.9c6.5 0 11.9-2.6 13.5-10 .7-3.5.4-6.3-1.8-7.4z" fill="#009CDE"/>
    </svg>
  )
}
export function IconBinance({size=26}) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="#F3BA2F" aria-hidden="true">
      <path d="M127.9 22.7 86.4 64.2l18 18 23.6-23.6 23.7 23.7 18-18-41.5-41.6zM64.3 86.3 22.7 127.9l18 18 41.6-41.6-18-18zm127.4 0-18 18 41.6 41.6 18-18-41.6-41.6zM86.3 149.5l41.6 41.6 41.6-41.6-18-18-23.6 23.6-23.6-23.6-18 18z"/>
    </svg>
  )
}
export function ProviderBadge({children, active}) {
  return <div className={`provider ${active?'active':''}`}>{children}</div>
}
