/**
 * Shared number formatting for the admin panels.
 *
 * Money used to be built as `'$' + value.toFixed(2)` in each component, which
 * renders 12280.5 as "$12280.50" — no thousands separator, so the eye has to
 * count digits to tell twelve thousand from a hundred and twenty-two thousand.
 * Ecuador uses the US convention for USD amounts (point for decimals, comma for
 * thousands), which is also what every existing screen already showed, so the
 * separator is the only thing that changes.
 *
 * `null` is not zero: it means the figure could not be loaded, and on a finance
 * panel a fabricated 0 is worse than an honest dash.
 */

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  return '$' + value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/** Counts of things — no decimals, same thousands separator as the amounts. */
export function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  return value.toLocaleString('en-US')
}

/**
 * Day-precision dates (`fecha`, `fechaFactura`, `fechaEntregaTentativa`, ...) travel
 * as UTC midnight, because that is what `new Date('2026-08-28')` produces both in the
 * date picker and on the server. Rendering that instant with the browser's local
 * calendar moved every one of them a day back in Ecuador (UTC-5): an expense filed on
 * the 28th was shown as the 27th. Reading them back in UTC returns the day the
 * operator actually typed, in any timezone.
 *
 * Use this for a calendar day. For a real instant — `createdAt`, `entregadoEn`, an
 * audit trail — use `formatDateTime`, which stays local on purpose.
 */
export function formatDate(
  value: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' },
): string {
  const date = toDate(value)
  if (!date) return '—'
  return date.toLocaleDateString('es-EC', { ...options, timeZone: 'UTC' })
}

/** A moment in time, shown in the reader's own timezone. */
export function formatDateTime(
  value: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' },
): string {
  const date = toDate(value)
  if (!date) return '—'
  return date.toLocaleString('es-EC', options)
}

/** The `YYYY-MM-DD` a date input expects, read in UTC to match `formatDate`. */
export function toDateInputValue(value: string | Date | null | undefined): string {
  const date = toDate(value)
  if (!date) return ''
  return date.toISOString().slice(0, 10)
}

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}
