export const SITE_NAME = 'ZenFast'
export const DEFAULT_OG_IMAGE = '/og.png'
export const DEFAULT_TITLE = 'ZenFast — Rastreador de Jejum Intermitente'
export const DEFAULT_DESCRIPTION =
  'Timer metabólico com fases biológicas, protocolos 16:8 → OMAD, hidratação, conquistas e evolução corporal.'

export interface MetaTag {
  title?: string
  charSet?: string
  name?: string
  property?: string
  content?: string
}

export interface SocialMetaInput {
  title: string
  description: string
  path: string
  origin: string
  imagePath?: string
}

export function absoluteUrl(origin: string, path: string): string {
  const base = origin.replace(/\/+$/, '')
  const suffix = path.startsWith('/') ? path : `/${path}`

  return `${base}${suffix}`
}

export function buildOrigin(
  host: string | null | undefined,
  protocol: string,
  fallback = 'http://localhost:3000',
): string {
  if (!host) {
    return fallback
  }

  return `${protocol || 'http'}://${host}`
}

export function socialMeta({
  title,
  description,
  path,
  origin,
  imagePath = DEFAULT_OG_IMAGE,
}: SocialMetaInput): MetaTag[] {
  const url = absoluteUrl(origin, path)
  const image = absoluteUrl(origin, imagePath)

  return [
    { title },
    { name: 'description', content: description },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: SITE_NAME },
    { property: 'og:locale', content: 'pt_BR' },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: url },
    { property: 'og:image', content: image },
    { property: 'og:image:type', content: 'image/png' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:alt', content: title },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: image },
  ]
}

export function canonicalLink(origin: string, path: string) {
  return { rel: 'canonical', href: absoluteUrl(origin, path) }
}

export interface PageMeta {
  title: string
  description: string
}

export const PAGE_META: Record<string, PageMeta> = {
  '/': {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  '/planos': {
    title: 'Protocolos de Jejum — ZenFast',
    description:
      'Compare 16:8, 14:10, 18:6, 20:4 e OMAD, veja a adesão do protocolo ativo e monte seu próprio horário de jejum.',
  },
  '/progresso': {
    title: 'Evolução Metabólica — ZenFast',
    description:
      'KPIs de sequência e eficácia, consistência semanal, progresso de peso, conquistas e histórico de jejuns.',
  },
  '/perfil': {
    title: 'Perfil e Metas — ZenFast',
    description:
      'Ajuste metas de água, peso e horas de jejum e acompanhe o resumo metabólico da sua jornada.',
  },
}

export function pageMetaFor(pathname: string): PageMeta {
  return PAGE_META[pathname] ?? PAGE_META['/']
}
