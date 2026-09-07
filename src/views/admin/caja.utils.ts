export type CajaMovimiento = {
  _id: string
  tipo: 'ingreso' | 'egreso'
  categoria: string
  monto: number
  clienteNombre?: string
  clienteId?: string
  descripcion?: string
  referencia?: string
  comprobanteUrl?: string
  fecha: string
  createdAt: string
}

export type CajaTotales = { total: number; count: number }

export type CajaResumen = {
  /** Ingresos, egresos y neto del rango filtrado. */
  ingresos: CajaTotales
  egresos: CajaTotales
  saldo: number
  /**
   * El dinero que realmente queda en caja: todo el histórico hasta la fecha
   * "Hasta", sin importar el "Desde" ni los filtros de tipo y categoría.
   */
  acumulado: {
    ingresos: CajaTotales
    egresos: CajaTotales
    saldo: number
    hasta: string | null
  }
  porTipo: Array<{ _id: string; total: number; count: number }>
  porCategoria: Array<{ _id: string; total: number; count: number }>
}

export const CATEGORIAS_INGRESO = ['VENTA', 'GDC', 'COURIER']
export const CATEGORIAS_EGRESO = ['TRANSPORTE', 'COMBUSTIBLE', 'GASTOS FIJOS', 'GASTOS VARIABLES', 'GASTOS EVENTUALES', 'ADELANTOS', 'ALIMENTOS', 'INSUMOS BASICOS', 'DEVOLUCIONES']

export function buildQuery(params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') searchParams.set(key, String(value))
  })
  return searchParams.toString()
}

/**
 * El signo va antes del símbolo: un neto negativo se leía como "$-32.00", que
 * en una pantalla de plata se confunde con un monto raro en vez de una resta.
 */
export function formatMoney(value: number) {
  const amount = Number(value) || 0
  return `${amount < 0 ? '-' : ''}$${Math.abs(amount).toFixed(2)}`
}

/**
 * `fecha` es un día de calendario, no un instante: viaja como medianoche UTC y
 * leerlo con el calendario local (UTC-5) restaba un día — el gasto del 28 se
 * mostraba como 27. La utilidad compartida ya lo lee en UTC; Caja seguía con su
 * propia copia porque el arreglo original sólo tocó Costos y Gestiones.
 */
export { formatDate } from '@/utils/format'

export function canDeleteCajaMovimiento(movement: Pick<CajaMovimiento, 'fecha' | 'createdAt'>) {
  const referenceDate = new Date(movement.fecha || movement.createdAt)
  const diffDays = (Date.now() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays <= 7
}
