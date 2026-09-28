import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { HistoryEntry } from '#/server/services/progress'

import { HistoryList } from './HistoryList'

function makeEntry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    id: 1,
    dateLabel: 'Ontem',
    statusLabel: '16:8 Atingido',
    statusTone: 'secondary',
    durationLabel: '16h 00m',
    startedAtLabel: '20:00',
    endedAtLabel: '12:00',
    details: [
      {
        label: 'Fase Atingida',
        value: 'Autofagia Ativa',
        tone: 'tertiary',
      },
    ],
    startedAt: new Date(2026, 1, 24, 20, 0).toISOString(),
    endedAt: new Date(2026, 1, 25, 12, 0).toISOString(),
    breakFood: null,
    moodNote: null,
    notes: null,
    ...overrides,
  }
}

describe('HistoryList', () => {
  it('opens the create flow from the header', async () => {
    const onCreate = vi.fn()
    const user = userEvent.setup()

    render(<HistoryList entries={[makeEntry()]} onCreate={onCreate} />)

    await user.click(screen.getByRole('button', { name: /Adicionar/ }))

    expect(onCreate).toHaveBeenCalledOnce()
  })

  it('exposes edit and delete for the expanded entry', async () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    const user = userEvent.setup()
    const entry = makeEntry()

    render(
      <HistoryList entries={[entry]} onDelete={onDelete} onEdit={onEdit} />,
    )

    await user.click(screen.getByRole('button', { name: /Editar/ }))
    expect(onEdit).toHaveBeenCalledWith(entry)

    await user.click(screen.getByRole('button', { name: /Excluir/ }))
    expect(onDelete).toHaveBeenCalledWith(entry)
  })

  it('shows an empty state with the create affordance', () => {
    render(<HistoryList entries={[]} onCreate={() => {}} />)

    expect(screen.getByText(/Nenhum jejum no histórico/)).toBeInTheDocument()
  })
})
