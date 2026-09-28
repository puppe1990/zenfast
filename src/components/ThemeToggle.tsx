import { useEffect, useState } from 'react'

import { applyTheme, readStoredTheme, storeTheme } from './theme'
import type { Theme } from './theme'

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const stored = readStoredTheme()
    setTheme(stored)
    applyTheme(stored)
  }, [])

  const toggle = () => {
    const next: Theme = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    applyTheme(next)
    storeTheme(next)
  }

  const label = theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'

  return (
    <button
      aria-label={label}
      aria-pressed={theme === 'light'}
      className="w-11 h-11 flex items-center justify-center rounded-full bg-surface-container-high/70 backdrop-blur-md text-on-surface-variant hover:text-primary transition-colors active:scale-95"
      onClick={toggle}
      type="button"
    >
      <span className="material-symbols-outlined text-[20px]">
        {theme === 'light' ? 'dark_mode' : 'light_mode'}
      </span>
    </button>
  )
}
