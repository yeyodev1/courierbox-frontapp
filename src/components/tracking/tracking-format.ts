import type { TrackingResult } from '@/services/tracking'

/** Badge tone that matches the shipment's current stage. */
export function toneFor(estado: TrackingResult['estado']) {
  switch (estado) {
    case 'entregado':
      return 'success' as const
    case 'incidencia':
      return 'danger' as const
    case 'en_transito':
    case 'en_aduana':
    case 'en_distribucion':
    case 'en_bodega_miami':
      return 'warning' as const
    default:
      return 'neutral' as const
  }
}

/** The payload comes from a scraper, so an unparseable date is echoed as-is. */
export function fmtDateShort(iso: string | null): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function fmtDateTime(iso: string | null): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('es-EC', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
