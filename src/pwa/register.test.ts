import { afterEach, describe, expect, it, vi } from 'vitest'

import { canRegisterServiceWorker, registerServiceWorker } from './register'

function stubNavigator(serviceWorker?: {
  register: (url: string) => Promise<unknown>
}) {
  vi.stubGlobal('navigator', serviceWorker ? { serviceWorker } : {})
}

describe('canRegisterServiceWorker', () => {
  it('registers in production builds with browser support', () => {
    expect(canRegisterServiceWorker({ dev: false, supported: true })).toBe(true)
  })

  it('skips the dev server and unsupported browsers', () => {
    expect(canRegisterServiceWorker({ dev: true, supported: true })).toBe(false)
    expect(canRegisterServiceWorker({ dev: false, supported: false })).toBe(
      false,
    )
  })
})

describe('registerServiceWorker', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('registers the offline worker in production', async () => {
    const registration = { addEventListener: vi.fn(), installing: null }
    const register = vi.fn().mockResolvedValue(registration)
    stubNavigator({ register })

    const result = await registerServiceWorker({ dev: false })

    expect(register).toHaveBeenCalledWith('/sw.js')
    expect(result).toBe(registration)
  })

  it('does nothing on the dev server', () => {
    const register = vi.fn()
    stubNavigator({ register })

    expect(registerServiceWorker({ dev: true })).toBeNull()
    expect(register).not.toHaveBeenCalled()
  })

  it('survives a failing registration', async () => {
    const register = vi.fn().mockRejectedValue(new Error('blocked'))
    stubNavigator({ register })

    await expect(registerServiceWorker({ dev: false })).resolves.toBeNull()
  })

  it('does nothing when the browser has no service worker support', () => {
    stubNavigator()

    expect(registerServiceWorker({ dev: false })).toBeNull()
  })
})
