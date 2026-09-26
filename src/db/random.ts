export interface SeedRandom {
  float: (min: number, max: number, fractionDigits?: number) => number
  int: (min: number, max: number) => number
  boolean: (probability?: number) => boolean
  pick: <T>(items: readonly T[]) => T
}

export function createDeterministicRandom(seed: number): SeedRandom {
  let state = seed >>> 0

  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)

    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }

  const float = (min: number, max: number, fractionDigits = 2) => {
    const value = min + next() * (max - min)
    const factor = 10 ** fractionDigits

    return Math.round(value * factor) / factor
  }

  return {
    float,
    int: (min, max) => Math.floor(min + next() * (max - min + 1)),
    boolean: (probability = 0.5) => next() < probability,
    pick: <T>(items: readonly T[]): T =>
      items[Math.floor(next() * items.length)],
  }
}
