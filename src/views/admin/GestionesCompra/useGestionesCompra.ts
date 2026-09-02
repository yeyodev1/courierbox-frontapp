import { computed, ref } from 'vue'
import { gestionesCompraAPI, type GestionCompra, type GestionesStats } from '@/services/gestiones_compra.api'
import { adminApi } from '@/services/admin.api'
import { useToastStore } from '@/stores/toast.store'
import { formatDate as formatCalendarDate } from '@/utils/format'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export const ESTADO_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'borrador', label: 'Borrador' },
  { value: 'activa', label: 'Activa' },
  { value: 'completado', label: 'Completado' },
  { value: 'cancelado', label: 'Cancelado' },
]

export const MES_OPTIONS = [
  { value: '', label: 'Todo el año' },
  ...MESES.map((label, index) => ({ value: String(index + 1), label })),
]

const ESTADO_LABELS: Record<string, string> = {
  borrador: 'Borrador',
  activa: 'Activa',
  completado: 'Completado',
  cancelado: 'Cancelado',
}

export const estadoLabel = (estado: string) => ESTADO_LABELS[estado] ?? estado

export function clienteNombre(g: GestionCompra) {
  return typeof g.contactoId === 'object' ? g.contactoId.nombre : '—'
}

export function clienteEmail(g: GestionCompra) {
  return typeof g.contactoId === 'object' ? ((g.contactoId as { email?: string }).email ?? '') : ''
}

export function asesorNombre(g: GestionCompra) {
  return typeof g.asesorId === 'object' ? ((g.asesorId as { name?: string }).name ?? '—') : '—'
}

/** Net margin left after the advisor's commission and the cost of the sale. */
export const margenNeto = (g: GestionCompra) => g.valorTotal - g.valorComision - g.costoVenta

/** `fechaEntregaTentativa` is a calendar day — see `formatDate` in utils/format. */
export const formatDate = formatCalendarDate

const emptyStats = (): GestionesStats => ({
  totalGestiones: 0,
  sumaValorTotal: 0,
  sumaComision: 0,
  sumaCostoVenta: 0,
  sumaMargenNeto: 0,
  sumaValorPagado: 0,
  ventasConfirmadas: 0,
  comisionGanada: 0,
  porEstado: {},
  porEstadoPago: {},
})

const defaultFilters = () => {
  const now = new Date()
  return { q: '', asesorId: '', estado: '', mes: String(now.getMonth() + 1), año: String(now.getFullYear()) }
}

/** All purchase gestiones with their filters, KPIs and export. */
export function useGestionesCompra() {
  const toast = useToastStore()

  const gestiones = ref<GestionCompra[]>([])
  const stats = ref<GestionesStats>(emptyStats())
  const asesores = ref<{ _id: string; name: string; email: string; role?: string }[]>([])

  const loading = ref(true)
  const statsLoading = ref(true)
  const exportLoading = ref(false)

  const page = ref(1)
  const pages = ref(1)
  const filters = ref(defaultFilters())

  const currentYear = new Date().getFullYear()
  const anioOptions = [-2, -1, 0, 1].map((offset) => ({
    value: String(currentYear + offset),
    label: String(currentYear + offset),
  }))

  const asesorOptions = computed(() =>
    asesores.value.map((u) => ({ value: u._id, label: u.name || u.email || u._id })),
  )

  /** The filter set shared by the listing, the KPIs and the export. */
  const queryFilters = () => ({
    q: filters.value.q.trim() || undefined,
    estado: filters.value.estado || undefined,
    asesorId: filters.value.asesorId || undefined,
    mes: filters.value.mes ? Number(filters.value.mes) : undefined,
    año: filters.value.año ? Number(filters.value.año) : undefined,
  })

  async function loadGestiones() {
    loading.value = true
    try {
      const result = await gestionesCompraAPI.list({ page: page.value, limit: 20, ...queryFilters() })
      gestiones.value = result.gestiones
      pages.value = result.pages
    } finally {
      loading.value = false
    }
  }

  async function loadStats() {
    statsLoading.value = true
    try {
      stats.value = await gestionesCompraAPI.getStatsMensuales(queryFilters())
    } finally {
      statsLoading.value = false
    }
  }

  async function loadAsesores() {
    try {
      const data = await adminApi.getUsers()
      asesores.value = (data.users || []).filter(
        (u: { role?: string }) => u.role === 'asesor' || u.role === 'admin',
      )
    } catch {
      asesores.value = []
    }
  }

  function applyFilters() {
    page.value = 1
    loadGestiones()
    loadStats()
  }

  function resetFilters() {
    filters.value = defaultFilters()
    applyFilters()
  }

  function changePage(next: number) {
    page.value = next
    loadGestiones()
  }

  async function exportar(format: 'excel' | 'pdf') {
    exportLoading.value = true
    try {
      const blob = await gestionesCompraAPI.downloadExport({ format, ...queryFilters() })
      if (!blob.size) throw new Error('El servidor devolvió un archivo vacío')

      const extension = format === 'excel' ? 'xlsx' : 'pdf'
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = `gestiones_compra_${new Date().toISOString().slice(0, 10)}.${extension}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      // Revoking immediately can cancel the download in some browsers.
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)

      toast.showNotification(`${format === 'excel' ? 'Excel' : 'PDF'} descargado correctamente`, 'success')
    } catch (err: unknown) {
      toast.showNotification((err as Error)?.message || 'No se pudo exportar el archivo', 'error')
    } finally {
      exportLoading.value = false
    }
  }

  async function load() {
    await Promise.all([loadGestiones(), loadStats(), loadAsesores()])
  }

  return {
    gestiones,
    stats,
    loading,
    statsLoading,
    exportLoading,
    page,
    pages,
    filters,
    anioOptions,
    asesorOptions,
    load,
    applyFilters,
    resetFilters,
    changePage,
    exportar,
  }
}
