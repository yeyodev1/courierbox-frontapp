import { computed, ref } from 'vue'
import { enviosApi, type EnvioDomicilio, type Motorizado } from '@/services/envios.api'
import { useToastStore } from '@/stores/toast.store'

export const ESTADO_LABEL: Record<string, string> = {
  pendiente: 'Pendiente',
  asignado: 'Asignado',
  en_ruta: 'En ruta',
  entregado: 'Entregado',
  fallido: 'Fallido',
}

export interface ResumenEnvios {
  locales: { total: number; cobrados: number; costo?: number; novedades?: number }
  interprovinciales: { total: number; cobrados: number; pagados: number; costo?: number; novedades?: number }
  porEstado: Array<{ _id: string; total: number }>
  saldo: number
}

export function formatMoney(value: number) {
  return `$${(value || 0).toFixed(2)}`
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** The API returns asignadoA either populated or as a bare id, depending on the endpoint. */
export function asignadoId(envio: EnvioDomicilio): string {
  const asignado = envio.asignadoA
  if (!asignado) return ''
  return typeof asignado === 'string' ? asignado : asignado._id
}

const startOfMonth = () => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
}

/** Everything the Envíos tab needs: the list, its filters and the row actions. */
export function useEnvios() {
  const toastStore = useToastStore()

  const envios = ref<EnvioDomicilio[]>([])
  const motorizados = ref<Motorizado[]>([])
  const resumen = ref<ResumenEnvios | null>(null)
  const loading = ref(false)

  const filtroEstado = ref('')
  const filtroDesde = ref(startOfMonth())
  const filtroHasta = ref(new Date().toISOString().slice(0, 10))

  const filtered = computed(() =>
    filtroEstado.value ? envios.value.filter((e) => e.estado === filtroEstado.value) : envios.value,
  )

  function fail(error: unknown, fallback: string) {
    toastStore.showNotification((error as Error)?.message || fallback, 'error')
  }

  async function load() {
    loading.value = true
    try {
      const [data, sum] = await Promise.all([
        enviosApi.list({
          estado: filtroEstado.value || undefined,
          desde: filtroDesde.value || undefined,
          hasta: filtroHasta.value || undefined,
          limit: 200,
        }),
        enviosApi.resumen({ desde: filtroDesde.value || undefined, hasta: filtroHasta.value || undefined }),
      ])
      envios.value = data.envios
      resumen.value = sum
    } catch (error) {
      fail(error, 'Error al cargar envíos')
    } finally {
      loading.value = false
    }
  }

  async function loadMotorizados() {
    try {
      const data = await enviosApi.listMotorizados()
      motorizados.value = data.motorizados
    } catch {
      motorizados.value = []
    }
  }

  /** Reassign a delivery so it lands on another motorizado's daily list. */
  async function reasignar(envio: EnvioDomicilio, asignadoA: string) {
    if (!asignadoA) return
    try {
      await enviosApi.asignar(envio._id, asignadoA)
      toastStore.showNotification('Envío asignado', 'success')
      await load()
    } catch (error) {
      fail(error, 'Error al asignar')
    }
  }

  async function updateStatus(envio: EnvioDomicilio, estado: string) {
    try {
      await enviosApi.update(envio._id, { estado: estado as EnvioDomicilio['estado'] })
      await load()
    } catch (error) {
      fail(error, 'Error al actualizar el estado')
    }
  }

  async function togglePago(envio: EnvioDomicilio, trayecto: 'trayectoUsa' | 'trayectoLocal') {
    const leg = trayecto === 'trayectoUsa' ? envio.trayectoUsa : envio.trayectoLocal
    try {
      await enviosApi.marcarPago(envio._id, trayecto, !leg.pagado)
      await load()
    } catch (error) {
      fail(error, 'Error al marcar el pago')
    }
  }

  function openGuide(envio: EnvioDomicilio) {
    if (!envio.guiaUrl || !envio.clienteTelefono) return
    const message = encodeURIComponent(`Hola ${envio.clienteNombre}, te comparto la guía de tu envío: ${envio.guiaUrl}`)
    const phone = String(envio.clienteTelefono).replace(/\D/g, '')
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank', 'noopener,noreferrer')
  }

  return {
    envios,
    motorizados,
    resumen,
    loading,
    filtroEstado,
    filtroDesde,
    filtroHasta,
    filtered,
    load,
    loadMotorizados,
    reasignar,
    updateStatus,
    togglePago,
    openGuide,
  }
}
