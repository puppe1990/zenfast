import { describe, expect, it } from 'vitest'

import { createDeterministicRandom } from './random'

describe('createDeterministicRandom', () => {
  it('replays the same sequence for the same seed', () => {
    const first = createDeterministicRandom(42)
    const second = createDeterministicRandom(42)

    const sample = (random: ReturnType<typeof createDeterministicRandom>) => [
      random.float(0, 1),
      random.int(1, 10),
      random.boolean(0.5),
      random.pick(['a', 'b', 'c']),
    ]

    expect(sample(first)).toEqual(sample(second))
  })

  it('diverges for different seeds', () => {
    const first = createDeterministicRandom(1)
    const second = createDeterministicRandom(2)

    expect(first.float(0, 1)).not.toBe(second.float(0, 1))
  })

  it('respects the requested ranges', () => {
    const random = createDeterministicRandom(7)

    for (let index = 0; index < 50; index += 1) {
      const value = random.float(19.5, 21)
      const integer = random.int(4, 11)

      expect(value).toBeGreaterThanOrEqual(19.5)
      expect(value).toBeLessThanOrEqual(21)
      expect(Number.isInteger(integer)).toBe(true)
      expect(integer).toBeGreaterThanOrEqual(4)
      expect(integer).toBeLessThanOrEqual(11)
    }
  })

  it('honours the fraction digits of float values', () => {
    const random = createDeterministicRandom(3)
    const value = random.float(15.2, 18.6)

    expect(Math.round(value * 100) / 100).toBe(value)
  })

  it('picks real items from the collection', () => {
    const random = createDeterministicRandom(11)
    const items = ['x', 'y', 'z'] as const

    for (let index = 0; index < 20; index += 1) {
      expect(items).toContain(random.pick(items))
    }
  })

  it('marks every event as happening when the probability is certain', () => {
    const random = createDeterministicRandom(9)

    expect(Array.from({ length: 10 }, () => random.boolean(1))).toEqual(
      Array.from({ length: 10 }, () => true),
    )
  })
})
