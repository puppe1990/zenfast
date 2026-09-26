import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'

import { AppHeader } from '#/components/AppHeader'
import { BottomNav } from '#/components/BottomNav'
import { getShell } from '#/server/actions'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      {
        name: 'viewport',
        content:
          'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover',
      },
      { title: 'ZenFast — Rastreador de Jejum Intermitente' },
      {
        name: 'description',
        content:
          'ZenFast acompanha seu jejum intermitente: timer metabólico, hidratação, protocolos, conquistas e evolução corporal.',
      },
      { name: 'theme-color', content: '#0f131c' },
    ],
    links: [
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@600;700&family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap',
      },
      { rel: 'stylesheet', href: appCss },
    ],
  }),
  loader: async () => ({ shell: await getShell() }),
  shellComponent: RootDocument,
  component: RootLayout,
  notFoundComponent: NotFound,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html className="dark" lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body className="bg-surface font-body-md text-on-surface antialiased flex flex-col min-h-screen selection:bg-primary-container selection:text-on-primary-container">
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function RootLayout() {
  const { shell } = Route.useLoaderData()

  return (
    <>
      <AppHeader
        profileName={shell.profileName}
        streakDays={shell.streakDays}
      />
      <Outlet />
      <BottomNav />
    </>
  )
}

function NotFound() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-space-md px-margin pt-24 pb-32 text-center">
      <span className="material-symbols-outlined text-[48px] text-primary">
        explore_off
      </span>
      <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-extrabold tracking-tight">
        Rota não encontrada
      </h1>
      <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">
        O caminho que você tentou acessar não existe no ZenFast.
      </p>
      <Link
        className="mt-space-sm px-5 py-3 rounded-full bg-primary-container text-on-primary-container font-label-badge text-label-badge font-bold"
        to="/"
      >
        Voltar para o Início
      </Link>
    </main>
  )
}
