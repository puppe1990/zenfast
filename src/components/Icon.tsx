export interface IconProps {
  name: string
  filled?: boolean
  className?: string
  size?: number
}

export function Icon({
  name,
  filled = false,
  className = '',
  size,
}: IconProps) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined ${className}`}
      data-filled={filled ? 'true' : undefined}
      style={size ? { fontSize: `${size}px` } : undefined}
    >
      {name}
    </span>
  )
}
