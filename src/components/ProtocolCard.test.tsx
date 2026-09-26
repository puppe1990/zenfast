import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { makeProtocol } from '#/domain/testing/fixtures'

import { ProtocolCard } from './ProtocolCard'

describe('ProtocolCard', () => {
  it('shows the protocol biomarkers and suggested window', () => {
    render(
      <ProtocolCard
        isActive={false}
        onActivate={() => {}}
        protocol={makeProtocol({
          biomarkers: [
            {
              icon: 'psychology',
              label: 'Foco',
              value: 'Elevado',
              tone: 'primary',
            },
            {
              icon: 'bolt',
              label: 'Insulina',
              value: 'Sensível',
              tone: 'secondary',
            },
            {
              icon: 'autorenew',
              label: 'Autofagia',
              value: 'Moderada',
              tone: 'tertiary',
            },
          ],
        })}
      />,
    )

    expect(
      screen.getByRole('heading', { name: '16:8 Diário' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Elevado')).toBeInTheDocument()
    expect(
      screen.getByText(/Janela Sugerida: 12:00 - 20:00/),
    ).toBeInTheDocument()
  })

  it('activates the protocol when the user taps the button', async () => {
    const onActivate = vi.fn()
    const user = userEvent.setup()

    render(
      <ProtocolCard
        isActive={false}
        onActivate={onActivate}
        protocol={makeProtocol({ id: 7 })}
      />,
    )

    await user.click(screen.getByRole('button', { name: /Ativar 16:8/ }))

    expect(onActivate).toHaveBeenCalledWith(7)
  })

  it('marks the active protocol as selected and disables the button', () => {
    render(
      <ProtocolCard isActive onActivate={() => {}} protocol={makeProtocol()} />,
    )

    expect(
      screen.getByRole('button', { name: 'Plano Selecionado' }),
    ).toBeDisabled()
  })
})
