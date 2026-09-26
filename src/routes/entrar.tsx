import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'

import { ZenFastLogo } from '#/components/ZenFastLogo'
import {
  getSession,
  postGuestSession,
  postSignIn,
  postSignUp,
} from '#/server/actions'

export const Route = createFileRoute('/entrar')({
  loader: async () => {
    const session = await getSession()

    if (session.authenticated) {
      throw redirect({ to: '/' })
    }

    return { session }
  },
  component: SignInScreen,
})

type Mode = 'entrar' | 'criar'

function SignInScreen() {
  const [mode, setMode] = useState<Mode>('entrar')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setPending(true)
    setMessage(null)

    try {
      const result =
        mode === 'criar'
          ? await postSignUp({ data: { name, email, password } })
          : await postSignIn({ data: { email, password } })

      if (!result.ok) {
        setMessage(result.message)
        return
      }

      window.location.assign('/')
    } catch (cause) {
      setMessage(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível entrar. Tente novamente.',
      )
    } finally {
      setPending(false)
    }
  }

  const enterAsGuest = async () => {
    setPending(true)
    setMessage(null)

    try {
      await postGuestSession()
      window.location.assign('/')
    } catch {
      setMessage('Não foi possível abrir a sessão de visitante.')
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-margin pt-20 pb-28 bg-surface">
      <div className="w-full max-w-sm flex flex-col gap-space-lg">
        <div className="flex flex-col items-center text-center gap-space-sm">
          <ZenFastLogo className="h-14 w-14" />
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-extrabold tracking-tight">
            ZenFast
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Seu jejum, hidratação e evolução metabólica em um espaço só seu.
          </p>
        </div>

        <div className="flex p-1 rounded-full bg-surface-container">
          {(
            [
              ['entrar', 'Entrar'],
              ['criar', 'Criar conta'],
            ] as Array<[Mode, string]>
          ).map(([value, label]) => (
            <button
              className={`flex-1 py-2 rounded-full font-label-badge text-label-badge transition-all ${
                mode === value
                  ? 'bg-primary-container text-on-primary-container font-bold'
                  : 'text-on-surface-variant'
              }`}
              key={value}
              onClick={() => {
                setMode(value)
                setMessage(null)
              }}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        <form className="flex flex-col gap-space-sm" onSubmit={submit}>
          {mode === 'criar' ? (
            <input
              autoComplete="name"
              className="w-full bg-surface-container-lowest rounded-2xl py-4 px-5 text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              onChange={(event) => setName(event.target.value)}
              placeholder="Seu nome"
              required
              value={name}
            />
          ) : null}

          <input
            autoComplete="email"
            className="w-full bg-surface-container-lowest rounded-2xl py-4 px-5 text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="E-mail"
            required
            type="email"
            value={email}
          />

          <input
            autoComplete={
              mode === 'criar' ? 'new-password' : 'current-password'
            }
            className="w-full bg-surface-container-lowest rounded-2xl py-4 px-5 text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            minLength={mode === 'criar' ? 8 : undefined}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={
              mode === 'criar' ? 'Senha (mínimo 8 caracteres)' : 'Senha'
            }
            required
            type="password"
            value={password}
          />

          {message ? (
            <p
              className="font-body-sm text-body-sm text-error text-center"
              role="alert"
            >
              {message}
            </p>
          ) : null}

          <button
            className="w-full h-14 rounded-full bg-gradient-to-r from-primary-container via-primary to-primary-fixed-dim text-on-primary-container font-headline-sm text-headline-sm font-bold flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(245,158,11,0.35)] active:scale-[0.98] transition-all disabled:opacity-60"
            disabled={pending}
            type="submit"
          >
            {pending
              ? 'Aguarde...'
              : mode === 'criar'
                ? 'Criar minha conta'
                : 'Entrar'}
          </button>
        </form>

        <button
          className="w-full h-12 rounded-full bg-surface-container-highest/60 backdrop-blur-md text-on-surface hover:text-primary font-label-badge text-label-badge font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
          disabled={pending}
          onClick={() => void enterAsGuest()}
          type="button"
        >
          <span className="material-symbols-outlined text-secondary-fixed-dim text-[18px]">
            explore
          </span>
          Explorar como visitante
        </button>

        <p className="font-body-sm text-body-sm text-on-surface-variant text-center">
          Seus jejuns, água, humor e peso ficam isolados por conta — ninguém vê
          seus dados.
        </p>
      </div>
    </main>
  )
}
