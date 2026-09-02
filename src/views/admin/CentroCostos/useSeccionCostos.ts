import { computed, onMounted, ref, watch } from 'vue'
import {
  costosApi,
  CATEGORIAS_POR_TIPO,
  type CostoSeccion,
  type CostosResumen,
  type Gasto,
  type GastoTipo,
} from '@/services/costos.api'
import { useToastStore } from '@/stores/toast.store'

/**
 * One Cost Centre section: its own list, its own totals, its own form.
 *
 * Expenses and receptions used to share a screen, so the same list held both what
 * the business spent and how many pounds the warehouse took in. Each section now
 * loads only its own slice — the server decides what belongs to it — and files new
 * records under a fixed `tipo`, so nothing lands in a section by accident.
 */
export interface SeccionConfig {
  seccion: CostoSeccion
  /** What a record created from this section is filed as. */
  tipoPorDefecto: GastoTipo
}

const firstOfThisMonth = () => {
  const now = new Date()
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)).toISOString().slice(0, 10)
}

const today = () => new Date().toISOString().slice(0, 10)

export function useSeccionCostos(config: SeccionConfig) {
  const toastStore = useToastStore()

  const gastos = ref<Gasto[]>([])
  const resumen = ref<CostosResumen | null>(null)
  const loading = ref(false)
  const saving = ref(false)
  const deleting = ref(false)
  const error = ref('')

  const filtroCategoria = ref('')
  const filtroProveedor = ref('')
  const filtroDesde = ref(firstOfThisMonth())
  const filtroHasta = ref(today())

  const showFormModal = ref(false)
  const showDetailModal = ref(false)
  const selectedGasto = ref<Gasto | null>(null)
  const createIdempotencyKey = ref(crypto.randomUUID())

  const categoriasDisponibles = computed(
    () => CATEGORIAS_POR_TIPO[config.tipoPorDefecto] || [],
  )

  /** `null` totals mean "not loaded"; the panels show a dash rather than a made-up zero. */
  const resumenSeguro = computed(() => {
    if (!resumen.value) return null
    return {
      total: resumen.value.total || { total: 0, facturas: 0, libras: 0, paquetes: 0, costoPorLibra: 0 },
      porMes: resumen.value.porMes || [],
      porCategoria: resumen.value.porCategoria || [],
      porProveedor: resumen.value.porProveedor || [],
    }
  })

  function filtros() {
    return {
      seccion: config.seccion,
      categoria: filtroCategoria.value || undefined,
      proveedor: filtroProveedor.value || undefined,
      desde: filtroDesde.value || undefined,
      hasta: filtroHasta.value || undefined,
    }
  }

  async function load() {
    loading.value = true
    error.value = ''
    try {
      const [lista, totales] = await Promise.all([
        costosApi.list({ ...filtros(), limit: 200 }),
        costosApi.resumen(filtros()),
      ])
      // A list screen with a malformed payload should show an empty state, not
      // take the table down with it.
      gastos.value = Array.isArray(lista?.gastos) ? lista.gastos : []
      resumen.value = totales?.resumen ?? null
    } catch (e: any) {
      error.value = e.message || 'No pudimos cargar los registros'
      toastStore.showNotification(error.value, 'error')
    } finally {
      loading.value = false
    }
  }

  function openCreate() {
    createIdempotencyKey.value = crypto.randomUUID()
    selectedGasto.value = null
    showFormModal.value = true
  }

  function openDetail(gasto: Gasto) {
    selectedGasto.value = gasto
    showDetailModal.value = true
  }

  function openEdit(gasto: Gasto) {
    selectedGasto.value = gasto
    showDetailModal.value = false
    showFormModal.value = true
  }

  function closeForm() {
    showFormModal.value = false
    selectedGasto.value = null
  }

  async function handleSave(payload: Record<string, any>, file: File | null) {
    if (saving.value) return
    saving.value = true
    const editing = selectedGasto.value
    try {
      const body = { ...payload, tipo: payload.tipo || config.tipoPorDefecto }
      const saved = editing
        ? await costosApi.update(editing._id, body)
        : await costosApi.create({ ...body, idempotencyKey: createIdempotencyKey.value } as any)
      if (file && saved.gasto?._id) await costosApi.uploadFactura(saved.gasto._id, file)
      toastStore.showNotification(editing ? 'Registro actualizado' : 'Registro guardado', 'success')
      closeForm()
      await load()
    } catch (e: any) {
      toastStore.showNotification(e.message || 'Error al guardar', 'error')
    } finally {
      saving.value = false
    }
  }

  async function handleRemove(id: string, done?: (success: boolean) => void) {
    deleting.value = true
    let removed = false
    try {
      await costosApi.remove(id)
      removed = true
      toastStore.showNotification('Registro eliminado', 'success')
      done?.(true)
    } catch (e: any) {
      toastStore.showNotification(e.message || 'Error al eliminar', 'error')
      done?.(false)
    } finally {
      deleting.value = false
    }
    if (removed) await load()
  }

  onMounted(load)
  watch([filtroCategoria, filtroProveedor, filtroDesde, filtroHasta], load)

  return {
    gastos,
    resumen,
    resumenSeguro,
    loading,
    saving,
    deleting,
    error,
    filtroCategoria,
    filtroProveedor,
    filtroDesde,
    filtroHasta,
    categoriasDisponibles,
    showFormModal,
    showDetailModal,
    selectedGasto,
    load,
    openCreate,
    openDetail,
    openEdit,
    closeForm,
    handleSave,
    handleRemove,
  }
}
