import { METABOLIC_STAGES } from '#/domain/metabolic'

export interface MetabolicStepperProps {
  stageIndex: number
  cyclePercent: number
}

export function MetabolicStepper({
  stageIndex,
  cyclePercent,
}: MetabolicStepperProps) {
  const activeIndex = Math.min(
    Math.max(stageIndex, 0),
    METABOLIC_STAGES.length - 1,
  )
  const fillPercent =
    METABOLIC_STAGES.length > 1
      ? Math.min(
          100,
          Math.max(0, (activeIndex / (METABOLIC_STAGES.length - 1)) * 100),
        )
      : 0

  return (
    <div className="flex flex-col gap-space-xs">
      <div className="flex items-center justify-between px-1">
        <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest font-semibold">
          Estágios Metabólicos
        </span>
        <span className="font-label-badge text-label-badge text-primary font-semibold tabular-nums">
          {cyclePercent}% do ciclo
        </span>
      </div>
      <div className="p-space-md rounded-2xl bg-surface-container-low/80 backdrop-blur-md shadow-sm overflow-x-auto no-scrollbar">
        <div className="flex items-center min-w-[520px] justify-between relative py-2">
          <div className="absolute left-6 right-6 top-5 h-1 bg-surface-container-highest -z-0" />
          <div
            className="absolute left-6 top-5 h-1 bg-gradient-to-r from-secondary-container via-primary-container to-primary -z-0 transition-all duration-700"
            style={{ width: `calc((100% - 3rem) * ${fillPercent / 100})` }}
          />
          {METABOLIC_STAGES.map((stage, index) => {
            const isActive = index === activeIndex
            const isDone = index < activeIndex

            return (
              <div
                className={`flex flex-col items-center gap-1.5 z-10 text-center ${
                  isActive
                    ? 'w-28 scale-105'
                    : isDone
                      ? 'w-24'
                      : 'w-24 opacity-60'
                }`}
                key={stage.id}
              >
                <div
                  className={`flex items-center justify-center ${
                    isActive
                      ? 'w-9 h-9 rounded-full bg-primary-container text-on-primary-container ring-4 ring-primary/20 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                      : isDone
                        ? 'w-8 h-8 rounded-full bg-secondary-container text-on-secondary shadow-md'
                        : 'w-8 h-8 rounded-full bg-surface-container-highest text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {isDone ? 'check' : stage.icon}
                  </span>
                </div>
                <span
                  className={`font-label-caps text-label-caps ${
                    isActive
                      ? 'text-primary font-bold'
                      : isDone
                        ? 'text-on-surface font-semibold'
                        : 'text-on-surface-variant'
                  }`}
                >
                  {stage.label}
                </span>
                <span
                  className={`text-[10px] ${
                    isActive
                      ? 'font-label-caps text-primary/80 font-bold'
                      : 'font-body-sm text-on-surface-variant/70'
                  }`}
                >
                  {isActive ? `${stage.rangeLabel} • Agora` : stage.rangeLabel}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
