import { useRouter } from '@tanstack/react-router'
import { useCallback, useState } from 'react'

export function useAction<TArgs extends Array<unknown>>(
  action: (...args: TArgs) => Promise<unknown>,
) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const run = useCallback(
    async (...args: TArgs) => {
      setPending(true)
      setError(null)

      try {
        await action(...args)
        await router.invalidate()
      } catch (cause) {
        setError(cause instanceof Error ? cause : new Error(String(cause)))
      } finally {
        setPending(false)
      }
    },
    [action, router],
  )

  return { run, pending, error }
}
