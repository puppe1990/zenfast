import type { ReactNode } from 'react'

export interface SheetProps {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
}

export function Sheet({
  open,
  title,
  description,
  onClose,
  children,
}: SheetProps) {
  if (!open) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end justify-center"
      role="dialog"
      aria-label={title}
      aria-modal="true"
    >
      <button
        aria-label="Fechar"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        type="button"
      />
      <div className="relative w-full max-w-lg bg-surface-container-low rounded-t-xl p-6 shadow-2xl space-y-5 pb-safe">
        <div className="w-12 h-1.5 rounded-full bg-surface-container-highest mx-auto" />
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              {title}
            </h3>
            {description ? (
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {description}
              </p>
            ) : null}
          </div>
          <button
            aria-label="Fechar"
            className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
            onClick={onClose}
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
