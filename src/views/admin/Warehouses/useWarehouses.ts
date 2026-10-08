import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { paquetesApi, type FiltrosWarehouses, type Warehouse, type EstadoPaquete } from '@/services/paquetes.api'
import { useToastStore } from '@/stores/toast.store'

export const ESTADO_UI: Record<EstadoPaquete, { label: string; tono: 'neutro' | 'proceso' | 'ok' | 'info' }> = {
  importado: { label: 'Recibido', tono: 'neutro' },
  pendiente_validacion: { label: 'Sin cliente', tono: 'proceso' },
  validado: { label: 'Por facturar', tono: 'info' },
  facturado: { label: 'Facturado', tono: 'proceso' },
  pagado: { label: 'Pagado', tono: 'ok' },
  despachado: { label: 'Entregado', tono: 'ok' },
}

/** Máximo de etiquetas por hoja: más que eso la pestaña de impresión se vuelve lenta. */
export const MAX_ETIQUETAS = 300

/** Lista de warehouses con filtros, paginación y selección para imprimir etiquetas. */
export function useWarehouses() {
  const router = useRouter()
  const toast = useToastStore()

  const filtros = reactive<Required<Omit<FiltrosWarehouses, 'page' | 'limit'>>>({
    q: '',
    estado: '',
    agencia: '',
    facturado: '',
    desde: '',
    hasta: '',
  })
  const page = ref(1)
  const limit = 50

  const paquetes = ref<Warehouse[]>([])
  const total = ref(0)
  const pesoTotalLb = ref(0)
  const sinFactura = ref(0)
  const agencias = ref<string[]>([])
  const cargando = ref(false)
  const cargado = ref(false)

  const seleccion = ref<Set<string>>(new Set())
  const abierto = ref<Warehouse | null>(null)

  const paginas = computed(() => Math.max(1, Math.ceil(total.value / limit)))
  const hayFiltros = computed(() => Object.values(filtros).some((v) => String(v).trim() !== ''))
  const todosMarcados = computed(() => paquetes.value.length > 0 && paquetes.value.every((p) => seleccion.value.has(p._id)))

  let pedido = 0
  async function cargar() {
    const mio = ++pedido
    cargando.value = true
    try {
      const r = await paquetesApi.listar({ ...filtros, q: filtros.q.trim(), page: page.value, limit })
      if (mio !== pedido) return
      paquetes.value = r.paquetes
      total.value = r.total
      pesoTotalLb.value = r.pesoTotalLb
      sinFactura.value = r.sinFactura
      if (r.agencias.length) agencias.value = r.agencias
    } catch (e: any) {
      if (mio === pedido) toast.showNotification(e?.data?.error || e?.message || 'No se pudo cargar la lista de warehouses', 'error')
    } finally {
      if (mio === pedido) {
        cargando.value = false
        cargado.value = true
      }
    }
  }

  // Escribir en el buscador espera a que la persona termine; los demás filtros cargan de una.
  let timer: number | undefined
  watch(
    () => filtros.q,
    () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        page.value = 1
        cargar()
      }, 350)
    },
  )
  watch(
    () => [filtros.estado, filtros.agencia, filtros.facturado, filtros.desde, filtros.hasta],
    () => {
      page.value = 1
      cargar()
    },
  )
  watch(page, cargar)

  function limpiarFiltros() {
    Object.assign(filtros, { q: '', estado: '', agencia: '', facturado: '', desde: '', hasta: '' })
  }

  function toggle(id: string) {
    const s = new Set(seleccion.value)
    if (s.has(id)) s.delete(id)
    else s.add(id)
    seleccion.value = s
  }

  function toggleTodos() {
    const s = new Set(seleccion.value)
    if (todosMarcados.value) paquetes.value.forEach((p) => s.delete(p._id))
    else paquetes.value.forEach((p) => s.add(p._id))
    seleccion.value = s
  }

  function limpiarSeleccion() {
    seleccion.value = new Set()
  }

  /** Abre la hoja de etiquetas en otra pestaña para no perder los filtros. */
  function imprimir(ids: string[]) {
    if (!ids.length) return
    if (ids.length > MAX_ETIQUETAS) {
      toast.showNotification(`Imprime hasta ${MAX_ETIQUETAS} etiquetas por vez. Tienes ${ids.length} marcadas.`, 'error')
      return
    }
    const url = router.resolve({ name: 'EtiquetasPrint', query: { ids: ids.join(',') } }).href
    window.open(url, '_blank', 'noopener')
  }

  return {
    filtros,
    page,
    limit,
    paginas,
    paquetes,
    total,
    pesoTotalLb,
    sinFactura,
    agencias,
    cargando,
    cargado,
    hayFiltros,
    seleccion,
    todosMarcados,
    abierto,
    cargar,
    limpiarFiltros,
    toggle,
    toggleTodos,
    limpiarSeleccion,
    imprimir,
  }
}
