import { formatMonthDay } from '#/domain/format'
import type { AchievementTimelineEntry } from '#/server/services/achievements'
import { TONE_CHIP, TONE_SOFT_BG, TONE_TEXT } from './tone'

export interface AchievementsGridProps {
  achievements: AchievementTimelineEntry[]
  unlockedCount: number
}

export function AchievementsGrid({
  achievements,
  unlockedCount,
}: AchievementsGridProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">
            military_tech
          </span>
          <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
            Conquistas
          </h2>
        </div>
        <span className="font-label-badge text-label-badge text-on-surface-variant tabular-nums">
          {unlockedCount} de {achievements.length} desbloqueadas
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {achievements.map((achievement) =>
          achievement.unlocked ? (
            <div
              className="p-3.5 rounded-lg bg-surface-container-low flex flex-col justify-between relative overflow-hidden group"
              key={achievement.slug}
            >
              <div className="flex items-start justify-between">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${TONE_SOFT_BG[achievement.tint]}`}
                >
                  {achievement.icon}
                </div>
                <span
                  className={`font-label-badge text-label-badge px-2 py-0.5 rounded-full font-bold ${TONE_CHIP[achievement.tint]}`}
                >
                  {achievement.tierLabel}
                </span>
              </div>
              <div className="mt-3">
                <h3 className="font-body-md text-body-md text-on-surface font-bold">
                  {achievement.title}
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  {achievement.description}
                </p>
                {achievement.unlockedAt ? (
                  <p className="font-label-caps text-label-caps text-on-surface-variant/70 mt-1.5">
                    Conquistada em {formatMonthDay(achievement.unlockedAt)}
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <div
              className="p-3.5 rounded-lg bg-surface-container-low/60 flex flex-col justify-between relative overflow-hidden opacity-75"
              key={achievement.slug}
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-[20px]">
                    lock
                  </span>
                </div>
                <span className="font-label-badge text-label-badge text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full font-bold tabular-nums">
                  {achievement.progressPercent}%
                </span>
              </div>
              <div className="mt-3">
                <h3 className="font-body-md text-body-md text-on-surface font-bold">
                  {achievement.title}
                </h3>
                <div className="w-full h-1.5 rounded-full bg-surface-container-highest mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${TONE_TEXT[achievement.tint]} bg-current`}
                    style={{
                      width: `${Math.max(4, achievement.progressPercent)}%`,
                    }}
                  />
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5">
                  {achievement.progressLabel}
                </p>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  )
}
