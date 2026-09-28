import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { METABOLIC_STAGES } from '#/domain/metabolic'

import { MetabolicStepper } from './MetabolicStepper'

describe('MetabolicStepper', () => {
  it('shows a trigger button per stage with an accessible name', () => {
    render(<MetabolicStepper cyclePercent={20} stageIndex={0} />)

    for (const stage of METABOLIC_STAGES) {
      expect(
        screen.getByRole('button', { name: new RegExp(stage.label) }),
      ).toBeInTheDocument()
    }
  })

  it('reveals the stage explanation when the user taps it', async () => {
    const user = userEvent.setup()
    render(<MetabolicStepper cyclePercent={20} stageIndex={0} />)

    const gordura = METABOLIC_STAGES[2]

    expect(screen.queryByText(gordura.description)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Gordura/ }))

    expect(await screen.findByText(gordura.title)).toBeInTheDocument()
    expect(screen.getByText(gordura.description)).toBeInTheDocument()
    expect(screen.getByText(gordura.badge)).toBeInTheDocument()
  })

  it('closes the explanation when the close control is pressed', async () => {
    const user = userEvent.setup()
    render(<MetabolicStepper cyclePercent={20} stageIndex={0} />)

    const cetose = METABOLIC_STAGES[3]

    await user.click(screen.getByRole('button', { name: /Cetose/ }))
    expect(await screen.findByText(cetose.description)).toBeInTheDocument()

    const [closeButton] = screen.getAllByRole('button', { name: 'Fechar' })
    await user.click(closeButton)

    expect(screen.queryByText(cetose.description)).not.toBeInTheDocument()
  })
})
