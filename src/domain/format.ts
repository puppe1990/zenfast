const MONTHS_SHORT = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
]

const MONTHS_LONG = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

const WEEKDAYS_LONG = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
]

const waterFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 0,
})

export function formatClockFromSeconds(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const seconds = safe % 60

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':')
}

export function formatDurationFromHours(hours: number): string {
  const totalMinutes = Math.round(Math.max(0, hours) * 60)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60

  return `${h}h ${String(m).padStart(2, '0')}m`
}

export function formatHoursValue(value: number): string {
  return value.toFixed(1)
}

export function formatDecimal(value: number, digits = 1): string {
  return value.toFixed(digits)
}

export function formatWater(ml: number): string {
  return waterFormatter.format(Math.round(ml))
}

export function formatWaterLiters(ml: number): string {
  return `${(ml / 1000).toFixed(1)}L`
}

export function formatTime(date: Date | string): string {
  const value = typeof date === 'string' ? new Date(date) : date
  const h = String(value.getHours()).padStart(2, '0')
  const m = String(value.getMinutes()).padStart(2, '0')

  return `${h}:${m}`
}

export function formatDateTimeInput(date: Date | string): string {
  const value = typeof date === 'string' ? new Date(date) : date
  const pad = (part: number) => String(part).padStart(2, '0')

  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(
    value.getDate(),
  )}T${pad(value.getHours())}:${pad(value.getMinutes())}`
}

export function parseDateTimeInput(value: string): Date | null {
  const date = value === '' ? new Date(Number.NaN) : new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}

export function formatMonthDay(date: Date | string): string {
  const value = typeof date === 'string' ? new Date(date) : date
  const day = String(value.getDate()).padStart(2, '0')

  return `${day}/${MONTHS_SHORT[value.getMonth()]}`
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function formatDateLabel(date: Date | string, now: Date): string {
  const value = typeof date === 'string' ? new Date(date) : date

  if (isSameDay(value, now)) {
    return 'Hoje'
  }

  const yesterday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1,
  )
  if (isSameDay(value, yesterday)) {
    return 'Ontem'
  }

  return `${WEEKDAYS_LONG[value.getDay()]}, ${value.getDate()} de ${
    MONTHS_LONG[value.getMonth()]
  }`
}

export function formatDayPhrase(date: Date | string, now: Date): string {
  const value = typeof date === 'string' ? new Date(date) : date

  if (isSameDay(value, now)) {
    return 'hoje'
  }

  const yesterday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1,
  )
  if (isSameDay(value, yesterday)) {
    return 'ontem'
  }

  return `${value.getDate()} de ${MONTHS_LONG[value.getMonth()]}`
}

export function formatRelativeTime(date: Date | string, now: Date): string {
  const value = typeof date === 'string' ? new Date(date) : date
  const minutes = Math.max(
    0,
    Math.round((now.getTime() - value.getTime()) / 60_000),
  )

  if (minutes < 1) {
    return 'agora mesmo'
  }

  if (minutes < 60) {
    return `há ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`
  }

  const hours = Math.round(minutes / 60)
  if (hours < 24) {
    return `há ${hours}h`
  }

  const days = Math.round(hours / 24)
  return `há ${days} ${days === 1 ? 'dia' : 'dias'}`
}
