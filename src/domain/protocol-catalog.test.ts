import { describe, expect, it } from 'vitest'

import {
  CUSTOM_PROTOCOL_BOUNDS,
  PROTOCOL_CATALOG,
  buildCustomProtocol,
  shiftWindow,
} from './protocol-catalog'

describe('PROTOCOL_CATALOG', () => {
  it('maps the five protocols from the design', () => {
    expect(PROTOCOL_CATALOG.map((protocol) => protocol.slug)).toEqual([
      '16-8-diario',
      '14-10-suave',
      '18-6-avancado',
      '20-4-guerreiro',
      'omad-23-1',
    ])
  })

  it('keeps fasting + eating windows at 24h', () => {
    for (const protocol of PROTOCOL_CATALOG) {
      expect(protocol.fastingHours + protocol.eatingHours).toBe(24)
    }
  })

  it('carries the suggested windows and biomarkers of the design', () => {
    const daily = PROTOCOL_CATALOG[0]

    expect(daily.name).toBe('16:8 Diário')
    expect(daily.method).toBe('Leangains')
    expect(daily.tagline).toBe('Mais Popular')
    expect(daily.badgeLabel).toBe('Fácil de manter')
    expect(daily.suggestedWindowStart).toBe('12:00')
    expect(daily.suggestedWindowEnd).toBe('20:00')
    expect(daily.biomarkers).toHaveLength(3)
  })

  it('flags the extreme protocol with the error tone', () => {
    const omad = PROTOCOL_CATALOG.find(
      (protocol) => protocol.slug === 'omad-23-1',
    )

    expect(omad?.fastingHours).toBe(23)
    expect(omad?.tagline).toBe('Extremo')
    expect(omad?.biomarkers[0].tone).toBe('error')
  })
})

describe('buildCustomProtocol', () => {
  it('builds a personalised protocol from the slider value', () => {
    const custom = buildCustomProtocol(17, '13:00')

    expect(custom.name).toBe('Personalizado 17:7')
    expect(custom.category).toBe('personalizado')
    expect(custom.fastingHours).toBe(17)
    expect(custom.eatingHours).toBe(7)
    expect(custom.suggestedWindowEnd).toBe('20:00')
  })

  it('derives the biomarkers from the chosen hours', () => {
    const leve = buildCustomProtocol(14, '10:00')
    const intenso = buildCustomProtocol(20, '16:00')

    expect(leve.biomarkers[1]).toMatchObject({
      label: 'Insulina',
      value: 'Sensível',
    })
    expect(leve.biomarkers[2]).toMatchObject({
      label: 'Autofagia',
      value: 'Leve',
    })
    expect(intenso.biomarkers[0]).toMatchObject({ value: '4h para comer' })
    expect(intenso.biomarkers[1]).toMatchObject({ value: 'Minimizada' })
    expect(intenso.biomarkers[2]).toMatchObject({ value: 'Ativa' })
  })

  it('clamps values to the slider bounds', () => {
    expect(buildCustomProtocol(30, '12:00').fastingHours).toBe(
      CUSTOM_PROTOCOL_BOUNDS.maxFastingHours,
    )
    expect(buildCustomProtocol(4, '12:00').fastingHours).toBe(
      CUSTOM_PROTOCOL_BOUNDS.minFastingHours,
    )
  })
})

describe('shiftWindow', () => {
  it('wraps around midnight', () => {
    expect(shiftWindow('19:00', 4)).toBe('23:00')
    expect(shiftWindow('20:00', 10)).toBe('06:00')
  })
})
