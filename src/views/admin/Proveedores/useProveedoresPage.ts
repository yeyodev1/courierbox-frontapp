import { computed, ref } from 'vue'
import { costosApi } from '@/services/costos.api'
import { proveedoresApi, type Proveedor } from '@/services/proveedores.api'
import { useToastStore } from '@/stores/toast.store'
import { normalizeType } from './components/useProveedorForm'

export interface PendingRemoval {
  kind: 'type' | 'provider'
  value: string
  title: string
  message: string
  confirmLabel: string
}

export function formatCurrency(value: number) {
  return `$${Number(value || 0).toFixed(2)}`
}

const normalizeKey = (value: string) => String(value || '').trim().toLowerCase()

function firstDayOfMonth() {
  const date = new Date()
  date.setDate(1)
  date.setHours(0, 0, 0, 0)
  return date.toISOString().slice(0, 10)
}

type ResumenRow = { _id: string; total?: number }

function buildProviderCostMap(historic: ResumenRow[] = [], month: ResumenRow[] = []) {
  const map: Record<string, { mes: number; historic: number }> = {}
  for (const item of historic) {
    const key = normalizeKey(item._id)
    map[key] = map[key] || { mes: 0, historic: 0 }
    map[key].historic = Number(item.total || 0)
  }
  for (const item of month) {
    const key = normalizeKey(item._id)
    map[key] = map[key] || { mes: 0, historic: 0 }
    map[key].mes = Number(item.total || 0)
  }
  return map
}

/** Provider directory with its spend summary, filters and CRUD. */
export function useProveedoresPage() {
  const toastStore = useToastStore()

  const proveedores = ref<Proveedor[]>([])
  const providerTypes = ref<string[]>([])
  const defaultProviderTypes = ref<string[]>([])
  const gastoResumen = ref({ thisMonth: 0, historic: 0, providers: 0 })
  const gastoByProvider = ref<Record<string, { mes: number; historic: number }>>({})

  const pageLoading = ref(true)
  const loading = ref(false)

  const search = ref('')
  const selectedType = ref('all')
  const selectedStatus = ref('all')
  const selectedCountry = ref('all')

  function fail(error: unknown, fallback: string) {
    toastStore.showNotification((error as Error)?.message || fallback, 'error')
  }

  const typeOptions = computed(() => {
    const source = providerTypes.value.length
      ? providerTypes.value
      : proveedores.value.map((p) => p.tipo || 'General')
    return Array.from(new Set(source.map((type) => type || 'General'))).sort((a, b) => a.localeCompare(b))
  })

  const countryOptions = computed(() =>
    Array.from(new Set(proveedores.value.map((p) => p.pais).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
  )

  const filtered = computed(() => {
    const q = search.value.trim().toLowerCase()
    return proveedores.value.filter((p) => {
      const matchesQuery =
        !q ||
        [p.nombre, p.tipo, p.pais, p.ciudad, p.contacto, p.email]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(q))
      const matchesType = selectedType.value === 'all' || (p.tipo || 'General') === selectedType.value
      const matchesStatus =
        selectedStatus.value === 'all' ||
        (selectedStatus.value === 'active' && p.activo) ||
        (selectedStatus.value === 'inactive' && !p.activo)
      const matchesCountry = selectedCountry.value === 'all' || (p.pais || '') === selectedCountry.value
      return matchesQuery && matchesType && matchesStatus && matchesCountry
    })
  })

  const activeCount = computed(() => proveedores.value.filter((p) => p.activo).length)
  const typeCount = computed(() => new Set(proveedores.value.map((p) => p.tipo || 'General')).size)

  const typeUsage = computed(() => {
    const counts: Record<string, number> = {}
    for (const p of proveedores.value) {
      const key = normalizeType(p.tipo || 'Sin tipo')
      counts[key] = (counts[key] || 0) + 1
    }
    return counts
  })

  const providerCards = computed(() =>
    filtered.value.map((p) => ({
      proveedor: p,
      gasto: gastoByProvider.value[normalizeKey(p.nombre)] || { mes: 0, historic: 0 },
    })),
  )

  const hasFilters = computed(
    () =>
      !!search.value ||
      selectedType.value !== 'all' ||
      selectedStatus.value !== 'all' ||
      selectedCountry.value !== 'all',
  )

  function resetFilters() {
    search.value = ''
    selectedType.value = 'all'
    selectedStatus.value = 'all'
    selectedCountry.value = 'all'
  }

  async function loadProviderTypes() {
    const data = await proveedoresApi.listTypes()
    defaultProviderTypes.value = data.defaultTypes
    providerTypes.value = data.providerTypes
  }

  async function loadExpenseSummary() {
    const [historic, month] = await Promise.all([
      costosApi.resumen({ desde: '1970-01-01' }),
      costosApi.resumen({ desde: firstDayOfMonth() }),
    ])
    gastoResumen.value = {
      thisMonth: Number(month.resumen.total?.total || 0),
      historic: Number(historic.resumen.total?.total || 0),
      providers: Number(historic.resumen.porProveedor?.length || 0),
    }
    gastoByProvider.value = buildProviderCostMap(
      historic.resumen.porProveedor || [],
      month.resumen.porProveedor || [],
    )
  }

  async function loadProviders() {
    loading.value = true
    try {
      const data = await proveedoresApi.list({ limit: 200 })
      proveedores.value = data.proveedores
    } catch (error) {
      fail(error, 'Error al cargar proveedores')
    } finally {
      loading.value = false
    }
  }

  async function loadAll() {
    try {
      await Promise.all([loadProviderTypes(), loadProviders(), loadExpenseSummary()])
    } catch (error) {
      fail(error, 'Error al cargar datos')
    } finally {
      pageLoading.value = false
    }
  }

  async function save(existing: Proveedor | null, payload: Partial<Proveedor>): Promise<boolean> {
    if (!payload.nombre?.trim()) {
      toastStore.showNotification('El nombre es obligatorio', 'error')
      return false
    }
    try {
      if (existing) await proveedoresApi.update(existing._id, payload)
      else await proveedoresApi.create(payload as Proveedor)
      await loadProviders()
      return true
    } catch (error) {
      fail(error, 'No se pudo guardar')
      return false
    }
  }

  async function addType(type: string) {
    await proveedoresApi.addType(type)
    await loadProviderTypes()
  }

  async function toggleActivo(p: Proveedor) {
    try {
      await proveedoresApi.update(p._id, { activo: !p.activo })
      await loadProviders()
    } catch (error) {
      fail(error, 'No se pudo actualizar')
    }
  }

  /** A type still assigned to providers must not be deletable. */
  function typeRemovalRequest(type: string): PendingRemoval | null {
    const count = typeUsage.value[normalizeType(type)] || 0
    if (count > 0) {
      toastStore.showNotification(
        `No puedes eliminar "${type}" porque ya está asignado a ${count} proveedor${count > 1 ? 'es' : ''}.`,
        'error',
      )
      return null
    }
    return {
      kind: 'type',
      value: type,
      title: 'Eliminar tipo de proveedor',
      message: `¿Eliminar el tipo "${type}"?`,
      confirmLabel: 'Eliminar tipo',
    }
  }

  function providerRemovalRequest(p: Proveedor): PendingRemoval {
    return {
      kind: 'provider',
      value: p._id,
      title: 'Eliminar proveedor',
      message: `¿Eliminar a ${p.nombre}?`,
      confirmLabel: 'Eliminar proveedor',
    }
  }

  async function confirmRemoval(action: PendingRemoval) {
    try {
      if (action.kind === 'type') {
        await proveedoresApi.removeType(action.value)
        await loadProviderTypes()
        return
      }
      await proveedoresApi.remove(action.value)
      await loadProviders()
    } catch (error) {
      fail(error, 'No se pudo eliminar')
    }
  }

  return {
    proveedores,
    providerTypes,
    defaultProviderTypes,
    gastoResumen,
    pageLoading,
    loading,
    search,
    selectedType,
    selectedStatus,
    selectedCountry,
    typeOptions,
    countryOptions,
    filtered,
    activeCount,
    typeCount,
    typeUsage,
    providerCards,
    hasFilters,
    resetFilters,
    loadAll,
    save,
    addType,
    toggleActivo,
    typeRemovalRequest,
    providerRemovalRequest,
    confirmRemoval,
  }
}
