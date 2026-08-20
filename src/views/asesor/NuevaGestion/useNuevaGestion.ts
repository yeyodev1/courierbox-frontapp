import { computed, nextTick, ref } from 'vue'
import { onBeforeRouteLeave, useRouter, type RouteLocationRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useGestionCompraFormStore } from '@/stores/gestion_compra_form.store'
import { gestionesCompraAPI, type GestionCompra, type GestionesStats } from '@/services/gestiones_compra.api'

export type ServiceType = 'logistica' | 'compra_total' | ''

export const SERVICE_LABELS: Record<string, string> = {
  logistica: 'Solo courier',
  compra_total: 'Compra total',
}

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

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })
}

/** The asesor's sales desk: month KPIs, recent sales and the wizard's lifecycle. */
export function useNuevaGestion(wizardRef: { value: HTMLElement | null }) {
  const auth = useAuthStore()
  const router = useRouter()
  const store = useGestionCompraFormStore()

  const stats = ref<GestionesStats>(emptyStats())
  const recentGestiones = ref<GestionCompra[]>([])
  const loadingSummary = ref(true)
  const loadingRecent = ref(true)

  const serviceType = ref<ServiceType>('')
  const showTypeModal = ref(false)
  const showResumeModal = ref(false)
  const showLeaveModal = ref(false)

  const confirmedLeave = ref(false)
  let pendingTo: RouteLocationRaw | null = null

  const asesorId = computed(
    () => auth.currentUser?.id || auth.currentUser?.userId || auth.currentUser?._id || '',
  )

  const serviceLabel = computed(() => SERVICE_LABELS[serviceType.value] ?? 'Pendiente')

  const pendingCount = computed(
    () => (stats.value.porEstado?.activa || 0) + (stats.value.porEstado?.borrador || 0),
  )

  const hasAmount = computed(
    () => store.formData.valorTotal != null && String(store.formData.valorTotal) !== '',
  )

  const liveChecklist = computed(() => [
    {
      label: 'Tipo de gestión',
      value: serviceLabel.value,
      state: serviceType.value ? 'done' : 'pending',
    },
    {
      label: 'Cliente',
      value: store.formData.contacto?.nombre || 'Pendiente',
      state: store.formData.contactoId ? 'done' : 'pending',
    },
    {
      label: 'Monto total',
      value: hasAmount.value ? `$${(Number(store.formData.valorTotal) || 0).toFixed(2)}` : 'Pendiente',
      state: hasAmount.value ? 'done' : 'pending',
    },
    {
      label: 'Reserva y cuenta',
      value: store.formData.cuentaBancaria
        ? `${store.formData.cuentaBancaria.banco} · ${store.formData.cuentaBancaria.numeroCuenta}`
        : 'Pendiente',
      state: store.formData.cuentaBancariaId ? 'done' : 'pending',
    },
    {
      label: 'Soporte / foto',
      value: store.formData.imagenCompraUrl
        ? 'Imagen cargada'
        : store.formData.comprobanteEstado === 'verificado'
          ? 'Verificado sin archivo'
          : 'Pendiente',
      state:
        store.formData.imagenCompraUrl || store.formData.comprobanteEstado === 'verificado'
          ? 'done'
          : 'pending',
    },
  ])

  function initStore(defaultServiceType: ServiceType) {
    store.init({
      adminMode: false,
      defaultAsesorId: asesorId.value,
      defaultAsesorNombre: auth.currentUser?.name ?? '',
      defaultServiceType,
    })
  }

  function selectServiceType(type: 'logistica' | 'compra_total') {
    serviceType.value = type
    initStore(type)
    showTypeModal.value = false
    nextTick(() => wizardRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  function freshStart() {
    initStore('')
    serviceType.value = ''
  }

  // Our own modal instead of the browser's alert, so the copy matches the app.
  onBeforeRouteLeave((to) => {
    if (confirmedLeave.value || !store.hasProgress) return true
    pendingTo = to.fullPath
    showLeaveModal.value = true
    return false
  })

  function cancelLeave() {
    showLeaveModal.value = false
    pendingTo = null
  }

  function confirmLeave() {
    confirmedLeave.value = true
    store.reset()
    showLeaveModal.value = false
    if (pendingTo) router.push(pendingTo)
  }

  function resumeDiscard() {
    showResumeModal.value = false
    freshStart()
  }

  async function load() {
    // Restore an in-progress draft if there is one; otherwise start fresh.
    // Ignore admin-mode drafts here (this is the asesor flow).
    const restored = store.loadDraft()
    if (restored && !store.isAdminMode && store.formData.serviceType) {
      serviceType.value = store.formData.serviceType as ServiceType
      showResumeModal.value = true
    } else {
      freshStart()
    }

    const now = new Date()
    try {
      const [statsResult, listResult] = await Promise.all([
        gestionesCompraAPI.getStatsMensuales({
          año: now.getFullYear(),
          mes: now.getMonth() + 1,
          asesorId: asesorId.value || undefined,
        }),
        gestionesCompraAPI.list({ limit: 5, asesorId: asesorId.value || undefined }),
      ])
      stats.value = statsResult
      recentGestiones.value = listResult.gestiones
    } catch {
      // KPIs are informational; the wizard still works without them.
    } finally {
      loadingSummary.value = false
      loadingRecent.value = false
    }
  }

  return {
    store,
    stats,
    recentGestiones,
    loadingSummary,
    loadingRecent,
    serviceType,
    serviceLabel,
    showTypeModal,
    showResumeModal,
    showLeaveModal,
    pendingCount,
    liveChecklist,
    selectServiceType,
    cancelLeave,
    confirmLeave,
    resumeDiscard,
    load,
  }
}
