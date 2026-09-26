import { act, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { OfflineBanner } from './OfflineBanner'

function goOffline() {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    value: false,
  })
  act(() => {
    window.dispatchEvent(new Event('offline'))
  })
}

function goOnline() {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    value: true,
  })
  act(() => {
    window.dispatchEvent(new Event('online'))
  })
}

describe('OfflineBanner', () => {
  it('stays hidden while the app is online', () => {
    render(<OfflineBanner />)

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('warns the user when the connection drops', () => {
    render(<OfflineBanner />)

    goOffline()

    expect(screen.getByRole('status')).toHaveTextContent(
      'Offline — mostrando os últimos dados salvos',
    )
  })

  it('hides again when the connection returns', () => {
    render(<OfflineBanner />)
    goOffline()

    goOnline()

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
