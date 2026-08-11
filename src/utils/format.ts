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
