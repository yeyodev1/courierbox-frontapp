export interface DateRange {
  start: string
  end: string
}

export interface CalendarDay {
  empty: boolean
  dateString?: string
  dayNumber?: number
}

export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

/**
 * Local `YYYY-MM-DD`. `toISOString()` converts to UTC first, which shifts the
 * day for anyone east of Greenwich and would select the wrong date.
 */
export function toISODate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function formatDateDisplay(dateStr: string | undefined): string {
  if (!dateStr) return '--/--/----'
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

/** The month's cells, padded with blanks so the first day lands on Monday. */
export function buildCalendar(year: number, month: number): CalendarDay[] {
  const weekday = new Date(year, month, 1).getDay()
  const leading = weekday === 0 ? 6 : weekday - 1
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const days: CalendarDay[] = Array.from({ length: leading }, () => ({ empty: true }))
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ empty: false, dateString: toISODate(new Date(year, month, i)), dayNumber: i })
  }
  return days
}

export function isSelected(range: DateRange, dateStr?: string): boolean {
  return Boolean(dateStr) && (range.start === dateStr || range.end === dateStr)
}

/** Strictly between the two ends, so the endpoints keep their own styling. */
export function isInRange(range: DateRange, dateStr?: string): boolean {
  if (!dateStr || !range.start || !range.end) return false
  return dateStr > range.start && dateStr < range.end
}

/**
 * Applies a click to the range: the first pick sets the start, the second the
 * end. Picking a day before the start restarts the selection from that day.
 */
export function pickDay(
  range: DateRange,
  selectingStart: boolean,
  dateStr: string,
): { range: DateRange; selectingStart: boolean } {
  if (selectingStart) {
    const end = range.end && dateStr > range.end ? '' : range.end
    return { range: { start: dateStr, end }, selectingStart: false }
  }
  if (dateStr < range.start) {
    return { range: { start: dateStr, end: '' }, selectingStart: false }
  }
  return { range: { start: range.start, end: dateStr }, selectingStart: true }
}

/** The last `days` days, ending today. */
export function presetRange(days: number): DateRange {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - days)
  return { start: toISODate(start), end: toISODate(end) }
}
