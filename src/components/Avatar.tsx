export function Avatar({
  name,
  className = 'w-8 h-8',
}: {
  name: string
  className?: string
}) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')

  return (
    <span
      aria-label={name}
      className={`${className} rounded-full bg-gradient-to-br from-primary-container to-tertiary-container text-on-primary-container font-label-badge font-bold flex items-center justify-center ring-1 ring-white/10`}
      role="img"
    >
      {initials || 'ZF'}
    </span>
  )
}
