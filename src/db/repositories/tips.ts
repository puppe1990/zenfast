import type { Tip } from '#/domain/types'

import type { Db } from '../client'

interface TipRow {
  id: number
  title: string
  body: string
}

export function seedTips(db: Db, tips: Array<Omit<Tip, 'id'>>): void {
  const statement = db.prepare<[string, string]>(
    `insert into expert_tips (title, body) values (?, ?)
     on conflict (title) do update set body = excluded.body`,
  )

  const run = db.transaction((items: Array<Omit<Tip, 'id'>>) => {
    for (const tip of items) {
      statement.run(tip.title, tip.body)
    }
  })

  run(tips)
}

export function listTips(db: Db): Tip[] {
  return db
    .prepare<[], TipRow>('select * from expert_tips order by id asc')
    .all()
}

export function randomTip(db: Db): Tip | null {
  const row = db
    .prepare<[], TipRow>('select * from expert_tips order by random() limit 1')
    .get()

  return row ?? null
}
