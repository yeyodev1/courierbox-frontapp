export interface PhoneCountry {
  code: string
  label: string
  placeholder: string
}

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { code: '593', label: 'EC Ecuador', placeholder: '9XXXXXXXX' },
  { code: '1', label: 'US Estados Unidos', placeholder: '5551234567' },
  { code: '57', label: 'CO Colombia', placeholder: '3001234567' },
  { code: '51', label: 'PE Perú', placeholder: '912345678' },
  { code: '52', label: 'MX México', placeholder: '5512345678' },
]

const STATUS_LABELS: Record<string, string> = {
  borrador: 'Borrador',
  pendiente: 'Pendiente',
  en_proceso: 'En proceso',
  comprado: 'Comprado',
  en_envio: 'En envío',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

export const statusLabel = (status: string) => STATUS_LABELS[status] ?? status

export function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })
}

/**
 * Keeps only the local part of the number.
 *
 * Only the *selected* country's dial code is stripped: trying every known code
 * in turn used to eat the leading "1" of any number that happened to start
 * with one, silently corrupting it.
 */
export function toLocalPhone(value: string, countryCode: string): string {
  const digits = value.replace(/\D+/g, '')
  const withoutCode = digits.startsWith(countryCode) ? digits.slice(countryCode.length) : digits
  return withoutCode.replace(/^0+/, '')
}
