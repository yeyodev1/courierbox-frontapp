export interface CalendarDay {
  date: Date | null
  key: string
  disabled?: boolean
  empty?: boolean
}

/** Noon avoids the day shifting under timezones east or west of UTC. */
export function parseDate(value: string): Date | null {
  if (!value) return null
  const date = new Date(`${value}T12:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function addMonths(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1)
}

export function toIsoDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function isSameDay(a: Date | null, b: Date | null) {
  return (
    !!a &&
    !!b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function isOutOfRange(date: Date, min?: string, max?: string) {
  const minDate = min ? parseDate(min) : null
  const maxDate = max ? parseDate(max) : null
  if (minDate && date < startOfDay(minDate)) return true
  if (maxDate && date > startOfDay(maxDate)) return true
  return false
}

/** Week starts on Monday, so Sunday (0) has to wrap round to index 6. */
export function buildCalendarDays(month: Date, min?: string, max?: string): CalendarDay[] {
  const firstWeekday = (startOfMonth(month).getDay() + 6) % 7
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const days: CalendarDay[] = []

  for (let i = 0; i < firstWeekday; i += 1) {
    days.push({ date: null, key: `empty-${i}`, empty: true })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(month.getFullYear(), month.getMonth(), day)
    days.push({ date, key: toIsoDate(date), disabled: isOutOfRange(date, min, max) })
  }

  return days
}

export const WEEKDAY_LABELS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']

export function formatLong(date: Date) {
  return date.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatMonth(date: Date) {
  return date.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' })
}
