import { computed, ref } from 'vue'
import { courierBridgeApi } from '@/services/courierbridge.api'
import { useToastStore } from '@/stores/toast.store'

export interface PortalCliente {
  nombre: string
  casillero: string
}

export interface PortalFactura {
  _id: string
  numeroFactura: string
  estado: 'pendiente' | 'verificando' | string
  totalGeneral: number
  pesoTotalLb: number
  totalFlete: number
  totalArancel: number
  iva: number
  pdfUrl?: string
}

export function formatMoney(value: number) {
  return `$${(value || 0).toFixed(2)}`
}

const NOT_FOUND = 'No encontramos un cliente con ese código de casillero'

/**
 * Public payment portal. The client looks their invoices up by locker code,
 * picks which ones they are settling and uploads the transfer receipt.
 */
export function usePaymentPortal() {
  const toastStore = useToastStore()

  const casillero = ref('')
  const cliente = ref<PortalCliente | null>(null)
  const facturas = ref<PortalFactura[]>([])
  const totalDeuda = ref(0)
  const loading = ref(false)
  const searched = ref(false)
  const errorMsg = ref('')
  const submitting = ref(false)

  /**
   * The proposal asks the client to pick which items they want to collect, so the
   * payment covers exactly those invoices. Only `pendiente` ones are selectable —
   * anything already `verificando` is locked until the cashier reviews it.
   */
  const seleccion = ref<Set<string>>(new Set())

  const seleccionables = computed(() => facturas.value.filter((f) => f.estado === 'pendiente'))
  const seleccionadas = computed(() => seleccionables.value.filter((f) => seleccion.value.has(f._id)))
  const totalSeleccionado = computed(() =>
    seleccionadas.value.reduce((sum, f) => sum + (Number(f.totalGeneral) || 0), 0),
  )
  const todasSeleccionadas = computed(
    () => seleccionables.value.length > 0 && seleccionadas.value.length === seleccionables.value.length,
  )

  function alternar(id: string) {
    const next = new Set(seleccion.value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    seleccion.value = next
  }

  function alternarTodas() {
    seleccion.value = todasSeleccionadas.value ? new Set() : new Set(seleccionables.value.map((f) => f._id))
  }

  function reset() {
    cliente.value = null
    casillero.value = ''
    facturas.value = []
    totalDeuda.value = 0
    seleccion.value = new Set()
    errorMsg.value = ''
    searched.value = false
  }

  async function buscarDeudas() {
    if (!casillero.value.trim()) return
    loading.value = true
    errorMsg.value = ''
    searched.value = false
    cliente.value = null
    facturas.value = []
    totalDeuda.value = 0

    try {
      const data = await courierBridgeApi.getFacturasPendientes(casillero.value.trim().toUpperCase())
      if (!data.cliente) {
        errorMsg.value = NOT_FOUND
        return
      }
      cliente.value = data.cliente
      facturas.value = data.facturas || []
      totalDeuda.value = data.totalDeuda || 0
      // Start with everything ticked: paying the full balance is the common case.
      seleccion.value = new Set(facturas.value.filter((f) => f.estado === 'pendiente').map((f) => f._id))
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string }
      errorMsg.value = e?.status === 404 ? NOT_FOUND : e?.message || 'Error al consultar tus facturas'
    } finally {
      loading.value = false
      searched.value = true
    }
  }

  async function enviarPago(referencia: string, comprobante: File | null): Promise<boolean> {
    if (!referencia.trim() || !comprobante || !seleccionadas.value.length) return false

    submitting.value = true
    try {
      const form = new FormData()
      form.append('comprobante', comprobante)
      form.append('facturaIds', JSON.stringify(seleccionadas.value.map((f) => f._id)))
      form.append('referenciaPago', referencia.trim())

      await courierBridgeApi.registrarPago(form)
      toastStore.showNotification('Pago registrado. Estamos verificando tu transferencia.', 'success')
      await buscarDeudas()
      return true
    } catch (err: unknown) {
      toastStore.showNotification((err as Error)?.message || 'Error al registrar pago', 'error')
      return false
    } finally {
      submitting.value = false
    }
  }

  return {
    casillero,
    cliente,
    facturas,
    totalDeuda,
    loading,
    searched,
    errorMsg,
    submitting,
    seleccion,
    seleccionables,
    seleccionadas,
    totalSeleccionado,
    todasSeleccionadas,
    alternar,
    alternarTodas,
    reset,
    buscarDeudas,
    enviarPago,
  }
}
