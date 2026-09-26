import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const rootDir = fileURLToPath(new URL('../../', import.meta.url))

interface ManifestIcon {
  src: string
  sizes: string
  type: string
  purpose?: string
}

interface Manifest {
  name: string
  short_name: string
  description: string
  lang: string
  start_url: string
  scope: string
  display: string
  orientation: string
  background_color: string
  theme_color: string
  icons: ManifestIcon[]
  shortcuts: Array<{ name: string; url: string }>
}

const manifest = JSON.parse(
  readFileSync(path.join(rootDir, 'public/manifest.webmanifest'), 'utf8'),
) as Manifest

function pngDimensions(relativePath: string) {
  const buffer = readFileSync(path.join(rootDir, relativePath))

  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
}

function parseSizes(sizes: string) {
  const [width, height] = sizes.split('x').map(Number)

  return { width, height }
}

describe('manifest.webmanifest', () => {
  it('identifies the app with the pt-BR product copy', () => {
    expect(manifest.name).toBe('ZenFast — Rastreador de Jejum Intermitente')
    expect(manifest.short_name).toBe('ZenFast')
    expect(manifest.lang).toBe('pt-BR')
    expect(manifest.description.length).toBeGreaterThan(40)
  })

  it('installs as a standalone portrait app starting at the dashboard', () => {
    expect(manifest.display).toBe('standalone')
    expect(manifest.orientation).toBe('portrait')
    expect(manifest.start_url.startsWith('/')).toBe(true)
    expect(manifest.scope).toBe('/')
  })

  it('matches the obsidian theme of the design system', () => {
    expect(manifest.theme_color).toBe('#0f131c')
    expect(manifest.background_color).toBe('#0f131c')
  })

  it('declares the 192, 512 and maskable icons that exist on disk', () => {
    for (const icon of manifest.icons) {
      const file = path.join(rootDir, 'public', icon.src)
      const dimensions = parseSizes(icon.sizes)

      expect(existsSync(file), `${icon.src} should exist`).toBe(true)
      expect(icon.type).toBe('image/png')
      expect(pngDimensions(path.join('public', icon.src))).toEqual(dimensions)
    }

    expect(manifest.icons.map((icon) => icon.sizes)).toEqual(
      expect.arrayContaining(['192x192', '512x512']),
    )
    expect(manifest.icons.some((icon) => icon.purpose === 'maskable')).toBe(
      true,
    )
  })

  it('shortcuts straight into the main routes', () => {
    expect(manifest.shortcuts.map((shortcut) => shortcut.url)).toEqual([
      '/',
      '/planos',
      '/progresso',
    ])
  })
})

describe('app icons', () => {
  it('ships an apple touch icon without transparency', () => {
    expect(pngDimensions('public/apple-touch-icon.png')).toEqual({
      width: 180,
      height: 180,
    })
  })

  it('ships the svg favicon used by the browser tab', () => {
    expect(existsSync(path.join(rootDir, 'public/favicon.svg'))).toBe(true)
  })
})

describe('open graph preview', () => {
  it('ships a 1200x630 social card', () => {
    expect(pngDimensions('public/og.png')).toEqual({ width: 1200, height: 630 })
  })
})

describe('offline fallback page', () => {
  const html = readFileSync(path.join(rootDir, 'public/offline.html'), 'utf8')

  it('reassures the user with the design brand colors', () => {
    expect(html).toContain('Você está offline')
    expect(html).toContain('#0f131c')
    expect(html).toContain('ZenFast')
  })

  it('offers a retry action without external assets', () => {
    expect(html).toContain('location.reload()')
    expect(html).not.toContain('https://fonts.googleapis.com')
  })
})
