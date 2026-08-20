import { computed, ref, watch } from 'vue'
import {
  calcularTotalesLocal,
  facturacionApi,
  type PaqueteFacturable,
  type Tarifas,
  type TotalesFactura,
} from '@/services/facturacion.api'
import { useToastStore } from '@/stores/toast.store'

export function money(value: number) {
  return `$${(Number(value) || 0).toFixed(2)}`
}

/**
 * Counter invoicing. Search a client's packages, tick what goes on the invoice,
 * see the total build up, and emit the electronic invoice to Contifico.
 */
export function useFacturacion() {
  const toast = useToastStore()

  const query = ref('')
  const searching = ref(false)
  const searched = ref(false)
  const paquetes = ref<PaqueteFacturable[]>([])
  const tarifas = ref<Tarifas>({ fleteLb: 0, arancelLb: 0, iva: 0 })
  const selectedIds = ref<Set<string>>(new Set())

  const emitting = ref(false)
  const lastFactura = ref<{ facturaId: string; cliente: string; total: number } | null>(null)

  const seleccionados = computed(() => paquetes.value.filter((p) => selectedIds.value.has(p._id)))

  const cliente = computed(() => {
    const master = seleccionados.value[0]?.masterClienteId
    return {
      id: master?._id,
      nombre: master?.nombreOficial || seleccionados.value[0]?.consigneeLimpio || '',
      identificacion: master?.cedulaRuc || '',
      email: master?.email || '',
      telefono: master?.telefono || '',
      casillero: master?.codigoCasillero || '',
    }
  })

  /** One invoice belongs to one client — the API rejects a mixed selection too. */
  const clientesDistintos = computed(
    () => new Set(seleccionados.value.map((p) => p.masterClienteId?._id ?? '')).size > 1,
  )

  const totales = computed<TotalesFactura>(() =>
    calcularTotalesLocal(
      seleccionados.value.map((p) => Number(p.pesoLb) || 0),
      tarifas.value,
    ),
  )

  const puedeFacturar = computed(
    () => seleccionados.value.length > 0 && !clientesDistintos.value && Boolean(cliente.value.id),
  )

  let timer: number | undefined

  watch(query, (value) => {
    window.clearTimeout(timer)
    if (value.trim().length < 2) {
      paquetes.value = []
      searched.value = false
      return
    }
    timer = window.setTimeout(buscar, 350)
  })

  function fail(error: unknown, fallback: string) {
    const e = error as { data?: { error?: string }; message?: string }
    toast.showNotification(e?.data?.error || e?.message || fallback, 'error')
  }

  async function buscar() {
    searching.value = true
    try {
      const data = await facturacionApi.facturables(query.value.trim())
      paquetes.value = data.paquetes
      tarifas.value = data.tarifas
      searched.value = true
    } catch (error) {
      fail(error, 'No se pudo buscar paquetes')
    } finally {
      searching.value = false
    }
  }

  function toggle(id: string) {
    const next = new Set(selectedIds.value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    selectedIds.value = next
  }

  const seleccionarTodos = () => {
    selectedIds.value = new Set(paquetes.value.map((p) => p._id))
  }

  const limpiar = () => {
    selectedIds.value = new Set()
  }

  /** Returns true once Contifico accepted the invoice. */
  async function emitir(): Promise<boolean> {
    emitting.value = true
    try {
      const res = await facturacionApi.generar(seleccionados.value.map((p) => p._id))
      lastFactura.value = {
        facturaId: res.facturaId,
        cliente: cliente.value.nombre,
        total: totales.value.totalGeneral,
      }
      toast.showNotification('Factura emitida y enviada al cliente.', 'success')
      limpiar()
      paquetes.value = []
      query.value = ''
      searched.value = false
      return true
    } catch (error) {
      fail(error, 'No se pudo emitir la factura')
      return false
    } finally {
      emitting.value = false
    }
  }

  return {
    query,
    searching,
    searched,
    paquetes,
    selectedIds,
    emitting,
    lastFactura,
    seleccionados,
    cliente,
    clientesDistintos,
    totales,
    puedeFacturar,
    toggle,
    seleccionarTodos,
    limpiar,
    emitir,
  }
}
