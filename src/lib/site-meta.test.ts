import { describe, expect, it } from 'vitest'

import {
  DEFAULT_OG_IMAGE,
  absoluteUrl,
  buildOrigin,
  canonicalLink,
  pageMetaFor,
  socialMeta,
} from './site-meta'

describe('absoluteUrl', () => {
  it('joins the origin with the path', () => {
    expect(absoluteUrl('https://zenfast.dev', '/planos')).toBe(
      'https://zenfast.dev/planos',
    )
  })

  it('normalizes trailing slashes and missing leading slash', () => {
    expect(absoluteUrl('https://zenfast.dev/', '/og.png')).toBe(
      'https://zenfast.dev/og.png',
    )
    expect(absoluteUrl('https://zenfast.dev', 'progresso')).toBe(
      'https://zenfast.dev/progresso',
    )
  })
})

describe('buildOrigin', () => {
  it('prefers the forwarded host and protocol', () => {
    expect(buildOrigin('zenfast.dev', 'https')).toBe('https://zenfast.dev')
  })

  it('falls back to the local dev server without a host', () => {
    expect(buildOrigin(undefined, 'https')).toBe('http://localhost:3000')
    expect(buildOrigin(null, 'https', 'https://zenfast.app')).toBe(
      'https://zenfast.app',
    )
  })

  it('defaults the protocol to http', () => {
    expect(buildOrigin('localhost:3000', '')).toBe('http://localhost:3000')
  })
})

describe('socialMeta', () => {
  const meta = socialMeta({
    title: 'Evolução Metabólica — ZenFast',
    description: 'KPIs de jejum, consistência semanal e composição corporal.',
    path: '/progresso',
    origin: 'https://zenfast.dev',
  })

  const lookup = (key: 'name' | 'property', value: string) =>
    meta.find((tag) => tag[key] === value)?.content

  it('sets the document title and description', () => {
    expect(meta[0].title).toBe('Evolução Metabólica — ZenFast')
    expect(lookup('name', 'description')).toBe(
      'KPIs de jejum, consistência semanal e composição corporal.',
    )
  })

  it('points the preview at the absolute og image', () => {
    expect(lookup('property', 'og:image')).toBe(
      'https://zenfast.dev' + DEFAULT_OG_IMAGE,
    )
    expect(lookup('property', 'og:image:width')).toBe('1200')
    expect(lookup('property', 'og:image:height')).toBe('630')
    expect(lookup('property', 'og:image:type')).toBe('image/png')
  })

  it('publishes the canonical url of the page', () => {
    expect(lookup('property', 'og:url')).toBe('https://zenfast.dev/progresso')
  })

  it('uses the large twitter card with the same artwork', () => {
    expect(lookup('name', 'twitter:card')).toBe('summary_large_image')
    expect(lookup('name', 'twitter:image')).toBe(
      'https://zenfast.dev' + DEFAULT_OG_IMAGE,
    )
  })

  it('declares the pt-BR locale and site name', () => {
    expect(lookup('property', 'og:locale')).toBe('pt_BR')
    expect(lookup('property', 'og:site_name')).toBe('ZenFast')
    expect(lookup('property', 'og:type')).toBe('website')
  })

  it('accepts a custom preview image', () => {
    const custom = socialMeta({
      title: 'ZenFast',
      description: 'desc',
      path: '/',
      origin: 'https://zenfast.dev',
      imagePath: '/icons/icon-512.png',
    })

    expect(custom.find((tag) => tag.property === 'og:image')?.content).toBe(
      'https://zenfast.dev/icons/icon-512.png',
    )
  })
})

describe('canonicalLink', () => {
  it('links the canonical url of the route', () => {
    expect(canonicalLink('https://zenfast.dev', '/')).toEqual({
      rel: 'canonical',
      href: 'https://zenfast.dev/',
    })
  })
})

describe('pageMetaFor', () => {
  it('describes each route of the app', () => {
    expect(pageMetaFor('/planos').title).toBe('Protocolos de Jejum — ZenFast')
    expect(pageMetaFor('/progresso').description).toContain(
      'consistência semanal',
    )
    expect(pageMetaFor('/perfil').title).toContain('Perfil')
  })

  it('falls back to the dashboard metadata for unknown routes', () => {
    expect(pageMetaFor('/nao-existe')).toEqual({
      title: 'ZenFast — Rastreador de Jejum Intermitente',
      description:
        'Timer metabólico com fases biológicas, protocolos 16:8 → OMAD, hidratação, conquistas e evolução corporal.',
    })
  })
})
