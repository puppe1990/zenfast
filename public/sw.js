const VERSION = 'zenfast-v1'
const SHELL_CACHE = `${VERSION}-shell`
const RUNTIME_CACHE = `${VERSION}-runtime`
const OFFLINE_URL = '/offline.html'
const PRECACHE_URLS = [
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/apple-touch-icon.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.startsWith(VERSION))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

function isServerFunction(url) {
  return url.pathname.startsWith('/_serverFn')
}

function isNavigationRequest(request) {
  if (request.mode === 'navigate') {
    return true
  }

  const accept = request.headers.get('accept') ?? ''

  return accept.includes('text/html')
}

function isCacheableAsset(request, url) {
  const destinations = ['style', 'script', 'font', 'image', 'manifest']

  if (url.origin !== self.location.origin) {
    return request.destination === 'font' || request.destination === 'style'
  }

  return destinations.includes(request.destination)
}

async function remember(cache, request, response) {
  if (response && (response.ok || response.type === 'opaque')) {
    await cache.put(request, response.clone())
  }

  return response
}

async function networkFirst(request, fallbackUrl) {
  const cache = await caches.open(RUNTIME_CACHE)

  try {
    const response = await fetch(request)

    if (isNavigationRequest(request)) {
      await remember(cache, request, response)
      return response
    }

    return remember(cache, request, response)
  } catch (error) {
    const cached = await cache.match(request)

    if (cached) {
      return cached
    }

    if (fallbackUrl) {
      const shell = await caches.open(SHELL_CACHE)
      const offline = await shell.match(fallbackUrl)

      if (offline) {
        return offline
      }
    }

    throw error
  }
}

async function cacheFirstWithRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE)
  const cached = await cache.match(request)

  const revalidation = fetch(request)
    .then((response) => remember(cache, request, response))
    .catch(() => undefined)

  if (cached) {
    return cached
  }

  const response = await revalidation

  if (response) {
    return response
  }

  const shell = await caches.open(SHELL_CACHE)

  return (await shell.match(request)) ?? Response.error()
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method !== 'GET' || isServerFunction(url)) {
    return
  }

  if (isNavigationRequest(request)) {
    event.respondWith(networkFirst(request, OFFLINE_URL))
    return
  }

  if (isCacheableAsset(request, url)) {
    event.respondWith(cacheFirstWithRevalidate(request))
  }
})
