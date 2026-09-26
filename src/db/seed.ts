import { faker } from '@faker-js/faker'

import { createDatabase } from './client'
import { ensureCatalog } from './bootstrap'
import type { SeedRandom } from './random'
import { seedDatabase } from './seeding'

function readNumberFlag(flag: string, fallback: number): number {
  const index = process.argv.indexOf(flag)
  if (index === -1) {
    return fallback
  }

  const value = Number(process.argv[index + 1])

  return Number.isFinite(value) ? value : fallback
}

export function createFakerRandom(seed: number): SeedRandom {
  faker.seed(seed)

  return {
    float: (min, max, fractionDigits = 2) =>
      Number(
        faker.number
          .float({ min, max, fractionDigits })
          .toFixed(fractionDigits),
      ),
    int: (min, max) => faker.number.int({ min, max }),
    boolean: (probability = 0.5) => faker.datatype.boolean({ probability }),
    pick: <T>(items: readonly T[]): T => faker.helpers.arrayElement([...items]),
  }
}

function main() {
  const reset = process.argv.includes('--reset')
  const days = readNumberFlag('--days', 45)
  const seed = readNumberFlag('--seed', 42)

  const db = createDatabase()
  ensureCatalog(db)

  const summary = seedDatabase(db, {
    days,
    reset,
    random: createFakerRandom(seed),
  })

  console.log(
    [
      `ZenFast seed concluído${reset ? ' (reset)' : ''}`,
      `  sessões: ${summary.sessions}`,
      `  hidratação: ${summary.waterLogs}`,
      `  humor: ${summary.moodLogs}`,
      `  peso: ${summary.weightLogs}`,
      `  conquistas: ${summary.achievementsUnlocked}`,
    ].join('\n'),
  )

  db.close()
}

main()
