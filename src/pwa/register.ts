export const SERVICE_WORKER_URL = '/sw.js'

export interface RegisterOptions {
  dev?: boolean
}

export function canRegisterServiceWorker(options: {
  dev: boolean
  supported: boolean
}): boolean {
  return !options.dev && options.supported
}

export function registerServiceWorker({
  dev = import.meta.env.DEV,
}: RegisterOptions = {}): Promise<ServiceWorkerRegistration | null> | null {
  const supported =
    typeof navigator !== 'undefined' && 'serviceWorker' in navigator

  if (!canRegisterServiceWorker({ dev, supported })) {
    return null
  }

  return navigator.serviceWorker
    .register(SERVICE_WORKER_URL)
    .then((registration) => {
      registration.addEventListener('updatefound', () => {
        registration.installing?.postMessage('SKIP_WAITING')
      })

      return registration
    })
    .catch(() => null)
}
