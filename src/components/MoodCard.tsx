import { formatTime } from '#/domain/format'

export interface MoodCardProps {
  mood: {
    label: string
    emoji: string
    note: string | null
    loggedAt: string
  } | null
  onEdit: () => void
}

export function MoodCard({ mood, onEdit }: MoodCardProps) {
  return (
    <div className="p-space-md rounded-2xl bg-surface-container-high/50 backdrop-blur-md flex flex-col justify-between shadow-sm min-h-[148px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-[20px]">
            psychology
          </span>
          <span className="font-label-badge text-label-badge text-on-surface font-semibold">
            Disposição
          </span>
        </div>
        <button
          aria-label="Registrar disposição"
          className="w-7 h-7 rounded-full bg-surface-container-highest text-primary flex items-center justify-center hover:bg-primary-container hover:text-on-primary-container transition-all active:scale-90"
          onClick={onEdit}
          type="button"
        >
          <span className="material-symbols-outlined text-[16px]">
            edit_note
          </span>
        </button>
      </div>
      <div className="my-2">
        {mood ? (
          <>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-primary-container/15">
              <span className="text-base leading-none">{mood.emoji}</span>
              <span className="font-label-badge text-label-badge text-primary font-bold">
                {mood.label}
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 line-clamp-1">
              {mood.note ?? 'Sem observações registradas'}
            </p>
          </>
        ) : (
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Registre como está sua energia durante o jejum.
          </p>
        )}
      </div>
      <span className="font-label-caps text-label-caps text-on-surface-variant/80 text-[10px]">
        {mood
          ? `Registrado às ${formatTime(mood.loggedAt)}`
          : 'Sem registro hoje'}
      </span>
    </div>
  )
}
