import { render, screen } from '@testing-library/react'
import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { computeFastingProgress } from '#/domain/fasting'

import { RadialFastingTimer } from './RadialFastingTimer'

describe('RadialFastingTimer', () => {
  const startedAt = new Date(2026, 1, 24, 20, 0, 0)
  const now = new Date(2026, 1, 25, 10, 25, 41)

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(now)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the server progress on the first paint', () => {
    render(
      <RadialFastingTimer
        initialProgress={computeFastingProgress(startedAt, 16, now)}
        startedAt={startedAt.toISOString()}
        targetHours={16}
      />,
    )

    expect(screen.getByRole('timer')).toHaveTextContent('14:25:41')
    expect(screen.getByText(/Faltam 1h 35m • Meta 12:00/)).toBeInTheDocument()
  })

  it('ticks the elapsed clock every second', () => {
    render(
      <RadialFastingTimer
        initialProgress={computeFastingProgress(startedAt, 16, now)}
        startedAt={startedAt.toISOString()}
        targetHours={16}
      />,
    )

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(screen.getByRole('timer')).toHaveTextContent('14:25:43')
  })

  it('explains the empty state when no fast is running', () => {
    render(
      <RadialFastingTimer
        initialProgress={null}
        startedAt={null}
        targetHours={16}
      />,
    )

    expect(screen.getByRole('timer')).toHaveTextContent('00:00:00')
    expect(screen.getByText(/Nenhum jejum em andamento/)).toBeInTheDocument()
  })
})
