import { describe, expect, it } from 'vitest'
import { formatDate, formatDateTime, toDateInputValue } from '../format'

/**
 * Oscar filed an expense on 28 Aug and the detail modal showed 27 Aug. The value
 * leaves the date picker as `2026-08-28`, which the server stores as UTC midnight;
 * reading it back through Ecuador's local calendar (UTC-5) lands on the 27th at 19:00.
 */
describe('formatDate', () => {
  it('keeps the day the operator typed, not the local-timezone day before', () => {
    expect(formatDate('2026-08-28T00:00:00.000Z')).toContain('28')
  })

  it('reads a bare YYYY-MM-DD as that same calendar day', () => {
    expect(formatDate('2026-08-28')).toContain('28')
  })

  it('does not drift on the first day of a month', () => {
    expect(formatDate('2026-09-01T00:00:00.000Z')).toContain('01')
  })

  it('honours a custom option set while staying in UTC', () => {
    expect(formatDate('2026-08-28T00:00:00.000Z', { day: '2-digit', month: 'long', year: 'numeric' }))
      .toContain('28')
  })

  it('shows a dash rather than inventing a date', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate('')).toBe('—')
    expect(formatDate('no es una fecha')).toBe('—')
  })
})

describe('formatDateTime', () => {
  it('renders a real instant, which is allowed to be local', () => {
    expect(formatDateTime('2026-08-28T15:30:00.000Z')).not.toBe('—')
  })

  it('shows a dash for a missing timestamp', () => {
    expect(formatDateTime(undefined)).toBe('—')
  })
})

describe('toDateInputValue', () => {
  it('round-trips the day a date input needs', () => {
    expect(toDateInputValue('2026-08-28T00:00:00.000Z')).toBe('2026-08-28')
  })

  it('returns an empty string when there is nothing to edit', () => {
    expect(toDateInputValue(null)).toBe('')
  })
})
