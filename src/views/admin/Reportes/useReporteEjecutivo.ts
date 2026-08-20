import { computed, ref } from 'vue'
import { adminApi } from '@/services/admin.api'

export type FinancialSummary = { ingresos: number; egresos: number; utilidad: number }
export type FunnelStep = { cantidad: number; valor: number }
export type ShipmentProfitability = { _id: string | null; total: number; cobrado: number; costo: number }
export type ProviderSummary = { _id: string | null; total: number; cobrado: number; costo: number }
export type VentaDiaria = { _id: string; total: number; cantidad: number }
export type ComisionAsesor = { asesorNombre?: string; ventas: number; comision: number; margenNeto: number }
export type ExportFormat = 'csv' | 'xlsx' | 'pdf'

export type ExecutiveReport = {
  finanzas: FinancialSummary
  gastos: { total: number; pagado: number }
  caja: FinancialSummary
  envios: ShipmentProfitability[]
  proveedores: ProviderSummary[]
  embudo: { creadas: FunnelStep; pagadas: FunnelStep; entregadas: FunnelStep }
}

export const emptyReport: ExecutiveReport = {
  finanzas: { ingresos: 0, egresos: 0, utilidad: 0 },
  gastos: { total: 0, pagado: 0 },
  caja: { ingresos: 0, egresos: 0, utilidad: 0 },
  envios: [],
  proveedores: [],
  embudo: {
    creadas: { cantidad: 0, valor: 0 },
    pagadas: { cantidad: 0, valor: 0 },
    entregadas: { cantidad: 0, valor: 0 },
  },
}

export function toDateValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function toMonthValue(date: Date) {
  return toDateValue(date).slice(0, 7)
}

export function parseDate(value: string) {
  if (!value) return null
  const date = new Date(`${value}T12:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat('es-EC', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

export function formatMoney(value: number | undefined) {
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(
    Number(value || 0),
  )
}

export function formatMode(mode: string | null) {
  if (!mode) return 'Sin modalidad'
  return mode.replace(/[_-]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function margin(cobrado: number, costo: number) {
  return Number(cobrado || 0) - Number(costo || 0)
}

export function marginPercent(cobrado: number, costo: number) {
  if (!cobrado) return 0
  return Math.round((margin(cobrado, costo) / cobrado) * 100)
}

/** Period selection, data loading and file export for the executive report. */
export function useReporteEjecutivo() {
  const today = new Date()

  const selectedMonth = ref(toMonthValue(today))
  const desde = ref(toDateValue(new Date(today.getFullYear(), today.getMonth(), 1)))
  const hasta = ref(toDateValue(today))

  const loading = ref(false)
  const exporting = ref(false)
  const error = ref('')

  const report = ref<ExecutiveReport>(emptyReport)
  const ventasDiarias = ref<VentaDiaria[]>([])
  const comisiones = ref<ComisionAsesor[]>([])

  const periodLabel = computed(() => {
    const start = parseDate(desde.value)
    const end = parseDate(hasta.value)
    if (!start || !end) return 'Periodo sin definir'
    return `${formatShortDate(start)} al ${formatShortDate(end)}`
  })

  async function load() {
    if (!desde.value || !hasta.value || desde.value > hasta.value) {
      error.value = 'Selecciona un rango de fechas válido.'
      return
    }

    loading.value = true
    error.value = ''
    try {
      const query = new URLSearchParams({ desde: desde.value, hasta: hasta.value })
      // The charts read from dedicated endpoints; a failure there must not blank
      // out the executive numbers, so they settle independently.
      const [response, ventasRes, comisionesRes] = await Promise.all([
        adminApi.getData(`v1/reportes/ejecutivo?${query.toString()}`),
        adminApi.getData(`v1/reportes/ventas-diarias?${query.toString()}`).catch(() => ({ ventas: [] })),
        adminApi.getData(`v1/reportes/comisiones?${query.toString()}`).catch(() => ({ comisiones: [] })),
      ])
      ventasDiarias.value = Array.isArray(ventasRes?.ventas) ? ventasRes.ventas : []
      comisiones.value = Array.isArray(comisionesRes?.comisiones) ? comisionesRes.comisiones : []
      report.value = {
        finanzas: { ...emptyReport.finanzas, ...(response.finanzas || {}) },
        gastos: { ...emptyReport.gastos, ...(response.gastos || {}) },
        caja: { ...emptyReport.caja, ...(response.caja || {}) },
        envios: Array.isArray(response.envios) ? response.envios : [],
        proveedores: Array.isArray(response.proveedores) ? response.proveedores : [],
        embudo: {
          creadas: { ...emptyReport.embudo.creadas, ...(response.embudo?.creadas || {}) },
          pagadas: { ...emptyReport.embudo.pagadas, ...(response.embudo?.pagadas || {}) },
          entregadas: { ...emptyReport.embudo.entregadas, ...(response.embudo?.entregadas || {}) },
        },
      }
    } catch (cause: unknown) {
      error.value = cause instanceof Error ? cause.message : 'No se pudo cargar el reporte ejecutivo.'
    } finally {
      loading.value = false
    }
  }

  /**
   * The proposal promises periods beyond the old 30-day window: monthly,
   * quarterly and annual. The backend already accepts any desde/hasta, so these
   * are just shortcuts onto the same range.
   */
  function aplicarPreset(preset: 'mes' | 'trimestre' | 'anio') {
    const now = new Date()
    const inicio =
      preset === 'mes'
        ? new Date(now.getFullYear(), now.getMonth(), 1)
        : preset === 'trimestre'
          ? new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
          : new Date(now.getFullYear(), 0, 1)
    desde.value = toDateValue(inicio)
    hasta.value = toDateValue(now)
    void load()
  }

  function useSelectedMonth() {
    const [year, month] = selectedMonth.value.split('-').map(Number)
    if (!year || !month) return
    const lastDay = new Date(year, month, 0)
    desde.value = toDateValue(new Date(year, month - 1, 1))
    hasta.value = toDateValue(lastDay > today ? today : lastDay)
    void load()
  }

  async function download(endpoint: string, filename: string, format: ExportFormat) {
    exporting.value = true
    error.value = ''
    try {
      const query = new URLSearchParams({ desde: desde.value, hasta: hasta.value, formato: format })
      const blob = await adminApi.downloadData(`${endpoint}?${query.toString()}`)
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `${filename}_${desde.value}_${hasta.value}.${format}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(link.href)
    } catch (cause: unknown) {
      error.value = cause instanceof Error ? cause.message : 'No se pudo exportar el reporte.'
    } finally {
      exporting.value = false
    }
  }

  const exportReport = (format: ExportFormat) => download('v1/reportes/ejecutivo', 'reporte_ejecutivo', format)

  /** Monthly deliveries report: what we charged, what it cost and the margin. */
  const exportEnvios = (format: ExportFormat) => download('v1/reportes/envios-rentabilidad', 'reporte_envios', format)

  return {
    today,
    selectedMonth,
    desde,
    hasta,
    loading,
    exporting,
    error,
    report,
    ventasDiarias,
    comisiones,
    periodLabel,
    load,
    aplicarPreset,
    useSelectedMonth,
    exportReport,
    exportEnvios,
  }
}
