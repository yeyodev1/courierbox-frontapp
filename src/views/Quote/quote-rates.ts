import { computed, ref } from 'vue'

export type Origin = 'esp' | 'usa-std' | 'usa-exp'

export interface RateConfig {
  id: Origin
  flag: string
  title: string
  badge: string
  timeframe: string
  importPerLb: number
  importApplyIva: boolean
  arancelPerLb: number
  ivaRate: number
  example: { lb: number; importe: number; arancel: number; total: number }
  notes: string[]
}

export const RATES: Record<Origin, RateConfig> = {
  esp: {
    id: 'esp',
    flag: 'ESP',
    title: 'España → Ecuador',
    badge: 'Recibimos en Madrid · UE completa',
    timeframe: 'Tiempo de tránsito según consolidación',
    importPerLb: 8,
    importApplyIva: true,
    arancelPerLb: 2.5,
    ivaRate: 0.15,
    example: { lb: 2, importe: 18.4, arancel: 5.0, total: 23.4 },
    notes: [
      'Importación: $8 + IVA por libra',
      'Arancel: $2.50 por libra',
      'Recibimos envíos de toda la Unión Europea',
    ],
  },
  'usa-std': {
    id: 'usa-std',
    flag: 'USA',
    title: 'USA Estándar → Ecuador',
    badge: 'Florida · Medley',
    timeframe: '5 a 9 días hábiles desde recepción en Florida',
    importPerLb: 5.99,
    importApplyIva: false,
    arancelPerLb: 2.5,
    ivaRate: 0,
    example: { lb: 2, importe: 11.98, arancel: 5.0, total: 16.98 },
    notes: [
      'Importación: $5.99 por libra',
      'Arancel: $2.50 por libra',
      'Bodega Medley, FL · 8988 NW 105th Way',
    ],
  },
  'usa-exp': {
    id: 'usa-exp',
    flag: 'USA',
    title: 'USA Express → Ecuador',
    badge: 'Florida · Pembroke Pines',
    timeframe: 'Una semana tras recepción en Florida',
    importPerLb: 8.99,
    importApplyIva: false,
    arancelPerLb: 0,
    ivaRate: 0,
    example: { lb: 2, importe: 17.98, arancel: 0, total: 17.98 },
    notes: [
      'Tarifa final: $8.99 por libra',
      'Valor neto · sin cargos adicionales',
      'Bodega Pembroke Pines, FL · 13176 NW 19th Street',
    ],
  },
}

export const fmt = (value: number) =>
  value.toLocaleString('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })

/** Route picker plus the per-pound estimate for the chosen lane. */
export function useQuote() {
  const origin = ref<Origin>('esp')
  const lb = ref('2')

  const rate = computed(() => RATES[origin.value])

  const calc = computed(() => {
    const r = rate.value
    const weight = Math.max(0, Number.parseFloat(lb.value || '0') || 0)
    const importeBase = weight * r.importPerLb
    const iva = r.importApplyIva ? importeBase * r.ivaRate : 0
    const importe = importeBase + iva
    const arancel = weight * r.arancelPerLb
    return { weight, importeBase, iva, importe, arancel, total: importe + arancel }
  })

  /** Express has neither VAT nor duty, so its figure is final rather than an estimate. */
  const totalLabel = computed(() =>
    rate.value.arancelPerLb === 0 && !rate.value.importApplyIva ? 'Total final' : 'Total estimado',
  )

  return { origin, lb, rate, calc, totalLabel }
}
