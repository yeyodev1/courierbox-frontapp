import { computed, ref } from 'vue'
import { gestionesCompraAPI, type GestionCompra } from '@/services/gestiones_compra.api'

export type RangePreset = 'todos' | 'hoy' | '7' | '30' | 'custom'
export type EstadoFiltro = 'todos' | 'por_recibir' | 'en_bodega'

export const RANGE_PRESETS: Array<{ key: RangePreset; label: string }> = [
  { key: 'todos', label: 'Todas' },
  { key: 'hoy', label: 'Hoy' },
  { key: '7', label: '7 días' },
  { key: '30', label: '30 días' },
]

export const ETA_CHIPS = ['Hoy mismo', '24 horas', '1 a 2 días', '3 a 5 días', '1 semana']

export const money = (value: unknown) => (Number(value) || 0).toFixed(2)

export function clienteNombre(g: GestionCompra) {
  return typeof g.contactoId === 'object' && g.contactoId ? g.contactoId.nombre : 'Cliente'
}

export function asesorNombre(g: GestionCompra) {
  return typeof g.asesorId === 'object' && g.asesorId ? (g.asesorId as { name?: string }).name ?? '—' : '—'
}

export function clienteEmail(g: GestionCompra | null) {
  if (!g || typeof g.contactoId !== 'object' || !g.contactoId) return ''
  return (g.contactoId as { email?: string }).email || ''
}

/** Newer records carry `estadoBodega`; older ones are inferred from the stage. */
export function isRecibido(g: GestionCompra) {
  return g.estadoBodega
    ? ['recibida', 'preparando_despacho', 'despachada'].includes(g.estadoBodega)
    : ['comprada', 'en_transito', 'entregada'].includes(g.stage)
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: '2-digit' })
}

/** Purchases the warehouse is waiting on, with search and date filters. */
export function useCompras() {
  const gestiones = ref<GestionCompra[]>([])
  const loading = ref(true)

  const q = ref('')
  const estadoFiltro = ref<EstadoFiltro>('todos')
  const rangePreset = ref<RangePreset>('todos')
  const desde = ref('')
  const hasta = ref('')

  function setPreset(key: RangePreset) {
    rangePreset.value = key
    desde.value = ''
    hasta.value = ''
  }

  function inRange(g: GestionCompra) {
    const created = new Date(g.createdAt)
    const now = new Date()

    if (rangePreset.value === 'hoy') {
      return created >= new Date(now.getFullYear(), now.getMonth(), now.getDate())
    }
    if (rangePreset.value === '7' || rangePreset.value === '30') {
      const days = rangePreset.value === '7' ? 7 : 30
      return created >= new Date(now.getTime() - days * 86400000)
    }
    if (rangePreset.value === 'custom') {
      if (desde.value && created < new Date(`${desde.value}T00:00:00`)) return false
      if (hasta.value && created > new Date(`${hasta.value}T23:59:59`)) return false
    }
    return true
  }

  const filtered = computed(() => {
    const term = q.value.trim().toLowerCase()

    return gestiones.value.filter((g) => {
      if (
        term &&
        !clienteNombre(g).toLowerCase().includes(term) &&
        !(g.paginaCompra || '').toLowerCase().includes(term)
      ) {
        return false
      }
      if (estadoFiltro.value === 'por_recibir' && isRecibido(g)) return false
      if (estadoFiltro.value === 'en_bodega' && !isRecibido(g)) return false
      return inRange(g)
    })
  })

  async function load() {
    loading.value = true
    try {
      gestiones.value = (await gestionesCompraAPI.list({ limit: 100 })).gestiones
    } finally {
      loading.value = false
    }
  }

  return { gestiones, loading, q, estadoFiltro, rangePreset, desde, hasta, filtered, setPreset, load }
}
