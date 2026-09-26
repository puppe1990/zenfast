import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { beforeEach, describe, expect, it, vi } from 'vitest'

const swSource = readFileSync(
  fileURLToPath(new URL('../../public/sw.js', import.meta.url)),
  'utf8',
)

const ORIGIN = 'https://zenfast.test'
const SHELL_CACHE = 'zenfast-v1-shell'
const RUNTIME_CACHE = 'zenfast-v1-runtime'

type Handler = (event: Record<string, unknown>) => void

function createHarness(
  fetchImpl: (request: { url: string }) => Promise<Response> = async () =>
    new Response('network', { status: 200 }),
) {
  const handlers = new Map<string, Handler[]>()
  const stores = new Map<string, Map<string, Response>>()
  const fetchMock = vi.fn(fetchImpl)

  const storeFor = (name: string) => {
    const existing = stores.get(name) ?? new Map<string, Response>()
    stores.set(name, existing)

    return existing
  }

  const cachesMock = {
    open: async (name: string) => {
      const store = storeFor(name)

      return {
        addAll: async (urls: string[]) => {
          for (const url of urls) {
            store.set(url, new Response('precached', { status: 200 }))
          }
        },
        match: async (request: unknown) =>
          store.get(
            typeof request === 'string'
              ? request
              : (request as { url: string }).url,
          ),
        put: async (request: unknown, response: Response) => {
          store.set(
            typeof request === 'string'
              ? request
              : (request as { url: string }).url,
            response,
          )
        },
      }
    },
    keys: async () => [...stores.keys()],
    delete: async (name: string) => stores.delete(name),
  }

  const selfMock = {
    location: { origin: ORIGIN },
    addEventListener: (type: string, handler: Handler) => {
      handlers.set(type, [...(handlers.get(type) ?? []), handler])
    },
    skipWaiting: vi.fn(),
    clients: { claim: vi.fn() },
  }

  const evaluate = new Function(
    'self',
    'caches',
    'fetch',
    'Response',
    'URL',
    swSource,
  )
  evaluate(selfMock, cachesMock, fetchMock, Response, URL)

  const dispatch = async (type: string, event: Record<string, unknown>) => {
    const waits: Array<Promise<unknown>> = []
    const enriched = {
      ...event,
      waitUntil: (promise: Promise<unknown>) => waits.push(promise),
      respondWith: (promise: Promise<Response>) => {
        enriched.response = promise
      },
      response: undefined as Promise<Response> | undefined,
    }

    for (const handler of handlers.get(type) ?? []) {
      handler(enriched)
    }

    await Promise.all(waits)

    return enriched.response ? await enriched.response : undefined
  }

  const request = (
    url: string,
    overrides: Partial<{
      method: string
      mode: string
      destination: string
      accept: string
    }> = {},
  ) => ({
    url: url.startsWith('http') ? url : `${ORIGIN}${url}`,
    method: overrides.method ?? 'GET',
    mode: overrides.mode ?? 'cors',
    destination: overrides.destination ?? '',
    headers: new Headers(
      overrides.accept ? { accept: overrides.accept } : undefined,
    ),
  })

  return {
    dispatch,
    dispatchFetch: (req: ReturnType<typeof request>) =>
      dispatch('fetch', { request: req }),
    request,
    fetchMock,
    selfMock,
    cachesMock,
    storeFor,
    cached: (cache: string) => [...storeFor(cache).keys()],
  }
}

describe('service worker install', () => {
  it('precaches the app shell and takes over immediately', async () => {
    const harness = createHarness()

    await harness.dispatch('install', {})

    expect(harness.cached(SHELL_CACHE)).toEqual(
      expect.arrayContaining([
        '/offline.html',
        '/manifest.webmanifest',
        '/favicon.svg',
        '/icons/icon-192.png',
      ]),
    )
    expect(harness.selfMock.skipWaiting).toHaveBeenCalled()
  })
})

describe('service worker activate', () => {
  it('deletes caches from previous versions and claims the clients', async () => {
    const harness = createHarness()
    harness.storeFor('zenfast-v0-shell').set('/old', new Response('old'))
    harness.storeFor(SHELL_CACHE)

    await harness.dispatch('activate', {})

    const remaining = await harness.cachesMock.keys()
    expect(remaining).not.toContain('zenfast-v0-shell')
    expect(remaining).toContain(SHELL_CACHE)
    expect(harness.selfMock.clients.claim).toHaveBeenCalled()
  })
})

describe('navigation requests', () => {
  let harness: ReturnType<typeof createHarness>

  beforeEach(() => {
    harness = createHarness(
      async (request) => new Response(`html:${request.url}`),
    )
  })

  it('serves fresh html from the network while online', async () => {
    const response = await harness.dispatchFetch(
      harness.request('/', { mode: 'navigate', accept: 'text/html' }),
    )

    expect(await response?.text()).toBe(`html:${ORIGIN}/`)
    expect(harness.cached(RUNTIME_CACHE)).toContain(`${ORIGIN}/`)
  })

  it('falls back to the cached page when the network fails', async () => {
    await harness.dispatchFetch(
      harness.request('/progresso', { mode: 'navigate', accept: 'text/html' }),
    )

    const offline = createHarness(async () => {
      throw new Error('offline')
    })
    offline
      .storeFor(RUNTIME_CACHE)
      .set(`${ORIGIN}/progresso`, new Response('cached-progresso'))

    const response = await offline.dispatchFetch(
      offline.request('/progresso', { mode: 'navigate', accept: 'text/html' }),
    )

    expect(await response?.text()).toBe('cached-progresso')
  })

  it('serves the offline page when nothing was cached yet', async () => {
    const offline = createHarness(async () => {
      throw new Error('offline')
    })
    offline
      .storeFor(SHELL_CACHE)
      .set('/offline.html', new Response('offline-page'))

    const response = await offline.dispatchFetch(
      offline.request('/', { mode: 'navigate', accept: 'text/html' }),
    )

    expect(await response?.text()).toBe('offline-page')
  })
})

describe('mutations and server functions', () => {
  it('never intercepts server function calls', async () => {
    const harness = createHarness()

    const response = await harness.dispatchFetch(
      harness.request('/_serverFn/abc123', { method: 'POST' }),
    )

    expect(response).toBeUndefined()
    expect(harness.fetchMock).not.toHaveBeenCalled()
  })

  it('never intercepts non GET requests', async () => {
    const harness = createHarness()

    const response = await harness.dispatchFetch(
      harness.request('/progresso', { method: 'POST' }),
    )

    expect(response).toBeUndefined()
    expect(harness.fetchMock).not.toHaveBeenCalled()
  })
})

describe('static assets', () => {
  it('serves from cache and revalidates in the background', async () => {
    const harness = createHarness(
      async () => new Response('asset', { status: 200 }),
    )
    const asset = harness.request('/icons/icon-192.png', {
      destination: 'image',
      accept: 'image/png',
    })

    const first = await harness.dispatchFetch(asset)
    expect(await first?.text()).toBe('asset')
    expect(harness.fetchMock).toHaveBeenCalledTimes(1)

    harness
      .storeFor(RUNTIME_CACHE)
      .set(`${ORIGIN}/icons/icon-192.png`, new Response('cached'))

    const second = await harness.dispatchFetch(asset)
    expect(await second?.text()).toBe('cached')

    await vi.waitFor(() => expect(harness.fetchMock).toHaveBeenCalledTimes(2))
  })

  it('ignores requests that are not assets', async () => {
    const harness = createHarness()

    const response = await harness.dispatchFetch(
      harness.request('/qualquer-coisa', { destination: '' }),
    )

    expect(response).toBeUndefined()
  })
})

describe('update message', () => {
  it('skips waiting when the page asks for the new version', async () => {
    const harness = createHarness()

    await harness.dispatch('message', { data: 'SKIP_WAITING' })

    expect(harness.selfMock.skipWaiting).toHaveBeenCalled()
  })
})
