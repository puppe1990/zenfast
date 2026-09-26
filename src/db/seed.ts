import { createDatabase } from './client'
import { ensureCatalog } from './bootstrap'
import { seedDatabase } from './seeding'

function readNumberFlag(flag: string, fallback: number): number {
  const index = process.argv.indexOf(flag)
  if (index === -1) {
    return fallback
  }

  const value = Number(process.argv[index + 1])

  return Number.isFinite(value) ? value : fallback
}

function main() {
  const reset = process.argv.includes('--reset')
  const days = readNumberFlag('--days', 45)
  const seed = readNumberFlag('--seed', 42)

  const db = createDatabase()
  ensureCatalog(db)

  const summary = seedDatabase(db, { days, seed, reset })

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
