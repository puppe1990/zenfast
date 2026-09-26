import { Link } from '@tanstack/react-router'

import { Avatar } from './Avatar'
import { ZenFastLogo } from './ZenFastLogo'

export interface AppHeaderProps {
  streakDays: number
  profileName: string
}

export function AppHeader({ streakDays, profileName }: AppHeaderProps) {
  return (
    <header className="fixed top-0 w-full z-40 pt-safe bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.25)]">
      <div className="h-16 px-gutter flex items-center justify-between">
        <Link className="flex items-center gap-space-sm" to="/">
          <ZenFastLogo className="h-8 w-8" />
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm text-on-surface font-bold tracking-tight">
              ZenFast
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-space-sm">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high/70 backdrop-blur-md shadow-[0_0_12px_rgba(245,158,11,0.15)]">
            <span className="material-symbols-outlined text-primary text-[18px]">
              local_fire_department
            </span>
            <span className="font-label-badge text-label-badge text-primary font-bold tracking-wide tabular-nums">
              {streakDays} dias
            </span>
          </div>
          <Link
            aria-label="Perfil"
            className="w-11 h-11 flex items-center justify-center rounded-full p-0.5 transition-transform active:scale-95"
            to="/perfil"
          >
            <Avatar name={profileName} />
          </Link>
        </div>
      </div>
    </header>
  )
}
