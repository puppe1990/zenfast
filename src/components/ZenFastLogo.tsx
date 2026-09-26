export function ZenFastLogo({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id="zenfastLogoGradient"
          x1="0%"
          x2="100%"
          y1="0%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#EF4444" />
        </linearGradient>
      </defs>
      <circle
        cx="50"
        cy="50"
        r="42"
        stroke="#1F2937"
        strokeLinecap="round"
        strokeWidth="8"
      />
      <path
        d="M 50 8 A 42 42 0 1 1 14 68"
        stroke="url(#zenfastLogoGradient)"
        strokeLinecap="round"
        strokeWidth="8"
      />
      <circle cx="50" cy="50" fill="#F59E0B" fillOpacity="0.2" r="16" />
      <path
        d="M50 34 V50 L62 56"
        stroke="#F59E0B"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="5"
      />
      <circle cx="50" cy="8" fill="#FBBF24" r="5" />
    </svg>
  )
}
