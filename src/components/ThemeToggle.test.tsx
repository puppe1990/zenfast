import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { ThemeToggle } from './ThemeToggle'
import { THEME_STORAGE_KEY } from './theme'

describe('ThemeToggle', () => {
  beforeEach(() => {
    window.localStorage.clear()
    document.documentElement.className = ''
  })

  afterEach(() => {
    window.localStorage.clear()
    document.documentElement.className = ''
  })

  it('starts in dark mode and offers the light mode action', () => {
    render(<ThemeToggle />)

    expect(
      screen.getByRole('button', { name: 'Ativar modo claro' }),
    ).toBeInTheDocument()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('switches to light mode, persisting the choice', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    await user.click(screen.getByRole('button', { name: 'Ativar modo claro' }))

    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
    expect(
      screen.getByRole('button', { name: 'Ativar modo escuro' }),
    ).toBeInTheDocument()
  })

  it('restores the stored light theme on mount', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'light')

    render(<ThemeToggle />)

    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(
      screen.getByRole('button', { name: 'Ativar modo escuro' }),
    ).toBeInTheDocument()
  })
})
