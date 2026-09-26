import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

const protocolIdSchema = z.object({ protocolId: z.number().int().positive() })
const moodSchema = z.enum(['baixa', 'media', 'alta', 'otima'])

export const getDashboard = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { loadDashboard } = await import('./runtime')

    return loadDashboard()
  },
)

export const getShell = createServerFn({ method: 'GET' }).handler(async () => {
  const { loadShell } = await import('./runtime')

  return loadShell()
})

export const getProgress = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { loadProgress } = await import('./runtime')

    return loadProgress()
  },
)

export const getProtocols = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { loadProtocols } = await import('./runtime')

    return loadProtocols()
  },
)

export const getProfile = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { loadProfile } = await import('./runtime')

    return loadProfile()
  },
)

export const postStartFast = createServerFn({ method: 'POST' })
  .validator((data: { protocolId?: number } | undefined) =>
    z
      .object({ protocolId: z.number().int().positive().optional() })
      .parse(data ?? {}),
  )
  .handler(async ({ data }) => {
    const { startFast } = await import('./runtime')

    return startFast(data)
  })

export const postEndFast = createServerFn({ method: 'POST' })
  .validator(
    (
      data:
        { breakFood?: string; moodNote?: string; notes?: string } | undefined,
    ) =>
      z
        .object({
          breakFood: z.string().max(120).optional(),
          moodNote: z.string().max(120).optional(),
          notes: z.string().max(200).optional(),
        })
        .parse(data ?? {}),
  )
  .handler(async ({ data }) => {
    const { endFast } = await import('./runtime')

    return endFast(data)
  })

export const postAddWater = createServerFn({ method: 'POST' })
  .validator((data: { amountMl: number }) =>
    z.object({ amountMl: z.number().int().min(50).max(2000) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { addWater } = await import('./runtime')

    return addWater(data.amountMl)
  })

export const postSaveMood = createServerFn({ method: 'POST' })
  .validator((data: { level: string; note?: string }) =>
    z
      .object({ level: moodSchema, note: z.string().max(160).optional() })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { saveMood } = await import('./runtime')

    return saveMood(data)
  })

export const postSaveWeight = createServerFn({ method: 'POST' })
  .validator((data: { weightKg: number }) =>
    z.object({ weightKg: z.number().min(30).max(300) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { saveWeight } = await import('./runtime')

    return saveWeight(data.weightKg)
  })

export const postSelectProtocol = createServerFn({ method: 'POST' })
  .validator((data: { protocolId: number }) => protocolIdSchema.parse(data))
  .handler(async ({ data }) => {
    const { selectProtocol } = await import('./runtime')

    return selectProtocol(data.protocolId)
  })

export const postSaveGoals = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      name?: string
      dailyTargetHours?: number
      waterGoalMl?: number
      startWeightKg?: number
      targetWeightKg?: number
    }) =>
      z
        .object({
          name: z.string().min(1).max(60).optional(),
          dailyTargetHours: z.number().int().min(10).max(23).optional(),
          waterGoalMl: z.number().int().min(500).max(6000).optional(),
          startWeightKg: z.number().min(30).max(300).optional(),
          targetWeightKg: z.number().min(30).max(300).optional(),
        })
        .parse(data),
  )
  .handler(async ({ data }) => {
    const { saveGoals } = await import('./runtime')

    return saveGoals(data)
  })

export const postCreateCustomProtocol = createServerFn({ method: 'POST' })
  .validator((data: { fastingHours: number; windowStart: string }) =>
    z
      .object({
        fastingHours: z.number().int().min(12).max(23),
        windowStart: z.string().regex(/^\d{2}:\d{2}$/),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { createCustomProtocol } = await import('./runtime')

    return createCustomProtocol(data)
  })
