import type { ProtocolSeed } from '#/domain/protocol-catalog'
import type {
  Biomarker,
  MetabolicTone,
  Protocol,
  ProtocolCategory,
} from '#/domain/types'

import type { Db } from '../client'

interface ProtocolRow {
  id: number
  slug: string
  name: string
  method: string
  category: string
  tagline: string | null
  description: string
  fasting_hours: number
  eating_hours: number
  badge_label: string | null
  badge_tone: string
  suggested_window_start: string
  suggested_window_end: string
  biomarkers: string
  popularity: number
}

function mapProtocol(row: ProtocolRow): Protocol {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    method: row.method,
    category: row.category as ProtocolCategory,
    tagline: row.tagline,
    description: row.description,
    fastingHours: row.fasting_hours,
    eatingHours: row.eating_hours,
    badgeLabel: row.badge_label,
    badgeTone: row.badge_tone as MetabolicTone,
    suggestedWindowStart: row.suggested_window_start,
    suggestedWindowEnd: row.suggested_window_end,
    biomarkers: JSON.parse(row.biomarkers) as Biomarker[],
    popularity: row.popularity,
  }
}

export function seedProtocols(db: Db, protocols: ProtocolSeed[]): void {
  const statement = db.prepare(`
    insert into protocols (
      slug, name, method, category, tagline, description, fasting_hours,
      eating_hours, badge_label, badge_tone, suggested_window_start,
      suggested_window_end, biomarkers, popularity
    ) values (
      @slug, @name, @method, @category, @tagline, @description, @fastingHours,
      @eatingHours, @badgeLabel, @badgeTone, @suggestedWindowStart,
      @suggestedWindowEnd, @biomarkers, @popularity
    )
    on conflict (slug) do update set
      name = excluded.name,
      method = excluded.method,
      category = excluded.category,
      tagline = excluded.tagline,
      description = excluded.description,
      fasting_hours = excluded.fasting_hours,
      eating_hours = excluded.eating_hours,
      badge_label = excluded.badge_label,
      badge_tone = excluded.badge_tone,
      suggested_window_start = excluded.suggested_window_start,
      suggested_window_end = excluded.suggested_window_end,
      biomarkers = excluded.biomarkers,
      popularity = excluded.popularity
  `)

  const run = db.transaction((items: ProtocolSeed[]) => {
    for (const protocol of items) {
      statement.run({
        ...protocol,
        biomarkers: JSON.stringify(protocol.biomarkers),
      })
    }
  })

  run(protocols)
}

export function insertProtocol(db: Db, protocol: ProtocolSeed): Protocol {
  seedProtocols(db, [protocol])

  const inserted = findProtocolBySlug(db, protocol.slug)
  if (!inserted) {
    throw new Error(`Protocol ${protocol.slug} could not be created`)
  }

  return inserted
}

export function listProtocols(db: Db, category?: ProtocolCategory): Protocol[] {
  const rows = category
    ? db
        .prepare<[string], ProtocolRow>(
          'select * from protocols where category = ? order by popularity desc, id asc',
        )
        .all(category)
    : db
        .prepare<[], ProtocolRow>(
          'select * from protocols order by popularity desc, id asc',
        )
        .all()

  return rows.map(mapProtocol)
}

export function findProtocolById(db: Db, id: number): Protocol | null {
  const row = db
    .prepare<[number], ProtocolRow>('select * from protocols where id = ?')
    .get(id)

  return row ? mapProtocol(row) : null
}

export function findProtocolBySlug(db: Db, slug: string): Protocol | null {
  const row = db
    .prepare<[string], ProtocolRow>('select * from protocols where slug = ?')
    .get(slug)

  return row ? mapProtocol(row) : null
}
