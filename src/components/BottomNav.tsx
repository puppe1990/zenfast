import { Link } from '@tanstack/react-router'

const ACTIVE_CLASSES =
  'text-primary font-bold drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]'
const IDLE_CLASSES = 'text-on-surface-variant hover:text-on-surface'

const TABS = [
  { to: '/', icon: 'timer', label: 'Início' },
  { to: '/planos', icon: 'explore', label: 'Planos' },
  { to: '/progresso', icon: 'bar_chart', label: 'Progresso' },
  { to: '/perfil', icon: 'account_circle', label: 'Perfil' },
] as const

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 w-full z-40 pb-safe bg-surface/90 backdrop-blur-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.45)]">
      <div className="flex items-center justify-around h-16 px-gutter">
        {TABS.map((tab) => (
          <Link
            activeProps={{ className: ACTIVE_CLASSES, 'aria-current': 'page' }}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] gap-1 transition-all duration-200 active:scale-95 ${IDLE_CLASSES}`}
            key={tab.to}
            to={tab.to}
          >
            <span className="material-symbols-outlined text-[24px]">
              {tab.icon}
            </span>
            <span className="font-label-caps text-label-caps">{tab.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
