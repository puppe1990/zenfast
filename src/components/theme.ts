export type Theme = 'dark' | 'light'

export const THEME_STORAGE_KEY = 'zenfast-theme'

export const THEME_COLORS: Record<Theme, string> = {
  dark: '#0f131c',
  light: '#f7f4ee',
}

export const THEME_INIT_SCRIPT = `
try {
  var theme = localStorage.getItem('${THEME_STORAGE_KEY}') === 'light' ? 'light' : 'dark';
  var root = document.documentElement;
  root.classList.toggle('light', theme === 'light');
  root.classList.toggle('dark', theme === 'dark');
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) { meta.setAttribute('content', theme === 'light' ? '${THEME_COLORS.light}' : '${THEME_COLORS.dark}'); }
} catch (error) {}
`

export function readStoredTheme(): Theme {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === 'light'
      ? 'light'
      : 'dark'
  } catch {
    return 'dark'
  }
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement
  root.classList.toggle('light', theme === 'light')
  root.classList.toggle('dark', theme === 'dark')

  const meta = document.querySelector('meta[name="theme-color"]')
  meta?.setAttribute('content', THEME_COLORS[theme])
}

export function storeTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Storage may be unavailable (private mode); the class toggle still works.
  }
}
