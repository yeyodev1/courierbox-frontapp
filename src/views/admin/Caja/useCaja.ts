import { computed, ref } from 'vue'
import { adminApi } from '@/services/admin.api'
import { useToastStore } from '@/stores/toast.store'
import {
  CATEGORIAS_EGRESO,
  CATEGORIAS_INGRESO,
  buildQuery,
  canDeleteCajaMovimiento,
  type CajaMovimiento,
  type CajaResumen,
} from '../caja.utils'

export interface CajaForm {
  tipo: 'ingreso' | 'egreso'
  categoria: string
  monto: number
  fecha: string
  clienteNombre: string
  clienteId: string
  descripcion: string
  referencia: string
}

export function emptyCajaForm(): CajaForm {
  return {
    tipo: 'ingreso',
    categoria: CATEGORIAS_INGRESO[0] || '',
    monto: 0,
    fecha: new Date().toISOString().slice(0, 10),
    clienteNombre: '',
    clienteId: '',
    descripcion: '',
    referencia: '',
  }
}

export function isIngresoCategoria(category: string) {
  return CATEGORIAS_INGRESO.includes(category)
}

export interface SavePayload {
  form: CajaForm
  clienteEmail?: string
  clientePhone?: string
  comprobante: File | null
  idempotencyKey: string
}

/** The cash ledger: filters, the listing, its summary and the row actions. */
export function useCaja() {
  const toastStore = useToastStore()

  const items = ref<CajaMovimiento[]>([])
  const summary = ref<CajaResumen | null>(null)
  const loading = ref(false)
  const saving = ref(false)

  const filtroTipo = ref('')
  const filtroCategoria = ref('')
  const filtroDesde = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10))
  const filtroHasta = ref(new Date().toISOString().slice(0, 10))

  const resumen = computed(() => {
    const base = summary.value as Partial<CajaResumen> | null
    return {
      ingresos: base?.ingresos ?? { total: 0, count: 0 },
      egresos: base?.egresos ?? { total: 0, count: 0 },
      saldo: typeof base?.saldo === 'number' ? base.saldo : 0,
      porTipo: (Array.isArray(base?.porTipo) ? base.porTipo : []) as CajaResumen['porTipo'],
      porCategoria: (Array.isArray(base?.porCategoria) ? base.porCategoria : []) as CajaResumen['porCategoria'],
    }
  })

  const movimientosFiltrados = computed(() =>
    items.value.filter((item) => {
      if (filtroTipo.value && item.tipo !== filtroTipo.value) return false
      if (filtroCategoria.value && item.categoria !== filtroCategoria.value) return false
      return true
    }),
  )

  function notify(message: string, variant: 'success' | 'error') {
    toastStore.showNotification(message, variant)
  }

  function fail(error: unknown, fallback: string) {
    notify((error as Error)?.message || fallback, 'error')
  }

  async function load() {
    loading.value = true
    try {
      const query = buildQuery({
        tipo: filtroTipo.value || undefined,
        categoria: filtroCategoria.value || undefined,
        desde: filtroDesde.value || undefined,
        hasta: filtroHasta.value || undefined,
        limit: 100,
      })
      const [list, sum] = await Promise.all([
        adminApi.getData(`v1/caja?${query}`),
        adminApi.getData(`v1/caja/resumen?${query}`),
      ])
      items.value = list.movimientos || []
      summary.value = sum || null
    } catch (error) {
      fail(error, 'Error al cargar caja')
    } finally {
      loading.value = false
    }
  }

  /** Returns true when the movement was stored (and its receipt uploaded). */
  async function save(payload: SavePayload): Promise<boolean> {
    const { form, comprobante, idempotencyKey } = payload
    if (!form.categoria || !form.monto || !form.descripcion) {
      notify('Completa tipo, categoría, monto y descripción', 'error')
      return false
    }

    saving.value = true
    try {
      const esIngreso = form.tipo === 'ingreso'
      const created = await adminApi.postData('v1/caja', {
        ...form,
        clienteNombre: esIngreso ? form.clienteNombre : '',
        clienteId: esIngreso ? form.clienteId || undefined : undefined,
        clienteEmail: esIngreso ? payload.clienteEmail || undefined : undefined,
        clientePhone: esIngreso ? payload.clientePhone || undefined : undefined,
        idempotencyKey,
      })

      if (comprobante && created.movimiento?._id) {
        const uploadForm = new FormData()
        uploadForm.append('file', comprobante)
        await adminApi.postData(`v1/caja/${created.movimiento._id}/upload`, uploadForm)
      }

      notify('Movimiento guardado correctamente', 'success')
      await load()
      return true
    } catch (error) {
      fail(error, 'Error al guardar')
      return false
    } finally {
      saving.value = false
    }
  }

  /** Returns the refusal message, or null when the movement may be deleted. */
  function deletionBlockedReason(movement: CajaMovimiento): string | null {
    return canDeleteCajaMovimiento(movement) ? null : 'No se puede eliminar después de 7 días'
  }

  async function remove(movement: CajaMovimiento): Promise<boolean> {
    try {
      await adminApi.deleteData(`v1/caja/${movement._id}`)
      notify('Movimiento eliminado', 'success')
      await load()
      return true
    } catch (error) {
      fail(error, 'No se pudo eliminar el movimiento')
      return false
    }
  }

  return {
    items,
    loading,
    saving,
    filtroTipo,
    filtroCategoria,
    filtroDesde,
    filtroHasta,
    resumen,
    movimientosFiltrados,
    load,
    save,
    remove,
    deletionBlockedReason,
    notify,
  }
}

export { CATEGORIAS_EGRESO, CATEGORIAS_INGRESO, canDeleteCajaMovimiento }
