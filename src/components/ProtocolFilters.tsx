import type { ProtocolCategoryOption } from '#/server/services/protocols'
import type { ProtocolCategory } from '#/domain/types'

export interface ProtocolFiltersProps {
  categories: ProtocolCategoryOption[]
  active: ProtocolCategory | 'todos'
  onChange: (category: ProtocolCategory | 'todos') => void
}

export function ProtocolFilters({
  categories,
  active,
  onChange,
}: ProtocolFiltersProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
      {categories.map((category) => {
        const isActive = category.id === active

        return (
          <button
            className={`px-4 py-2 rounded-full font-label-badge text-label-badge transition-all flex items-center gap-1.5 shrink-0 ${
              isActive
                ? 'bg-primary-container text-on-primary-container font-bold shadow-md shadow-primary-container/20'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
            key={category.id}
            onClick={() => onChange(category.id)}
            type="button"
          >
            {category.label}
          </button>
        )
      })}
    </div>
  )
}
