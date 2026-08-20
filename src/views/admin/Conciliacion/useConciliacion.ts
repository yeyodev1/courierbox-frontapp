import { ref } from 'vue'
import { adminApi } from '@/services/admin.api'
import { useToastStore } from '@/stores/toast.store'

export interface FacturaVerificando {
  _id: string
  numeroFactura: string
  totalGeneral: number
  referenciaPago: string
  comprobanteUrl: string
  estado: string
  createdAt: string
  masterClienteId?: { nombreOficial: string; codigoCasillero: string }
}

export interface CsvResultado {
  totalReferencias: number
  facturasVerificando: number
  conciliadas: number
}

export function formatMoney(value: number) {
  return `$${(value || 0).toFixed(2)}`
}

/** Bank reconciliation: verify client payments and cross them against a CSV. */
export function useConciliacion() {
  const toastStore = useToastStore()

  const facturas = ref<FacturaVerificando[]>([])
  const resumen = ref({ pendientes: 0, verificando: 0, pagadas: 0, total: 0 })
  const loading = ref(false)

  const csvFile = ref<File | null>(null)
  const csvResultado = ref<CsvResultado | null>(null)
  const uploadingCsv = ref(false)

  function fail(error: unknown, fallback: string) {
    toastStore.showNotification((error as Error)?.message || fallback, 'error')
  }

  async function cargarVerificando() {
    loading.value = true
    try {
      const data = await adminApi.getData('v1/conciliacion/verificando')
      facturas.value = data.facturas || []
    } catch {
      toastStore.showNotification('Error al cargar pagos pendientes', 'error')
    } finally {
      loading.value = false
    }
  }

  async function cargarResumen() {
    try {
      const data = await adminApi.getData('v1/conciliacion/resumen')
      resumen.value = data.resumen || resumen.value
    } catch {
      // The summary is a nice-to-have; the verification list still works.
    }
  }

  const load = () => Promise.all([cargarVerificando(), cargarResumen()])

  function setCsv(file: File | null) {
    csvFile.value = file
    csvResultado.value = null
  }

  async function subirCsv() {
    if (!csvFile.value) return
    uploadingCsv.value = true
    try {
      const form = new FormData()
      form.append('csv', csvFile.value)
      const data = await adminApi.postData('v1/conciliacion/cargar-csv', form)
      csvResultado.value = data
      toastStore.showNotification(`${data.conciliadas} facturas conciliadas`, 'success')
      await load()
    } catch (error) {
      fail(error, 'Error al procesar CSV')
    } finally {
      uploadingCsv.value = false
    }
  }

  async function confirmarPago(facturaId: string) {
    try {
      await adminApi.postData(`v1/facturacion/confirmar/${facturaId}`, {})
      toastStore.showNotification('Pago confirmado', 'success')
      await load()
    } catch (error) {
      fail(error, 'Error al confirmar')
    }
  }

  return { facturas, resumen, loading, csvFile, csvResultado, uploadingCsv, load, setCsv, subirCsv, confirmarPago }
}
