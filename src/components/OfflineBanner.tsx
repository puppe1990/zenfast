import { useEffect, useState } from 'react'

export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(true)

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)

    setOnline(navigator.onLine)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)

    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  return online
}

export function OfflineBanner() {
  const online = useOnlineStatus()

  if (online) {
    return null
  }

  return (
    <div
      aria-live="polite"
      className="fixed top-16 inset-x-0 z-30 px-margin pt-2 pointer-events-none"
      role="status"
    >
      <div className="mx-auto max-w-lg flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-high/90 backdrop-blur-md border border-primary/25 shadow-lg">
        <span className="material-symbols-outlined text-[18px] text-primary">
          cloud_off
        </span>
        <span className="font-label-badge text-label-badge text-on-surface">
          Offline — mostrando os últimos dados salvos
        </span>
      </div>
    </div>
  )
}
