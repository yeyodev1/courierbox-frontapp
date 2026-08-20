import { ref } from 'vue'
import { gestionesCompraAPI, type GestionCompra } from '@/services/gestiones_compra.api'

export const QUICK_ACTIONS = [
  { label: 'Nueva gestión', sub: 'Registrar una compra', icon: 'fa-solid fa-plus', route: '/asesor/ventas' },
  { label: 'Calculadora', sub: 'Cotizar fee de gestión', icon: 'fa-solid fa-calculator', route: '/asesor/calculadora' },
  { label: 'Mis gestiones', sub: 'Ver historial operativo', icon: 'fa-solid fa-bag-shopping', route: '/asesor/gestiones-compra' },
  { label: 'Contactos', sub: 'Ver historial y clientes', icon: 'fa-solid fa-address-book', route: '/asesor/contactos' },
]

const PAYMENT_BADGES: Record<string, { label: string; class: string }> = {
  pendiente: { label: 'Pendiente', class: 'badge-amber' },
  verificando: { label: 'Verificando', class: 'badge-blue' },
  confirmado: { label: 'Confirmado', class: 'badge-green' },
  rechazado: { label: 'Rechazado', class: 'badge-red' },
}

export function paymentBadge(estadoPago?: string) {
  return PAYMENT_BADGES[estadoPago || 'pendiente'] ?? { label: estadoPago ?? 'Pendiente', class: 'badge-amber' }
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })
}

export function formatMoney(amount: number) {
  return `$${Number(amount).toFixed(2)}`
}

/** This month's numbers for the signed-in asesor, plus their latest sales. */
export function useAsesorDashboard() {
  const stats = ref({
    totalGestiones: 0,
    pendingPayment: 0,
    totalSold: 0,
    sumaComision: 0,
    recentGestiones: [] as GestionCompra[],
  })
  const loading = ref(false)

  async function load() {
    loading.value = true
    try {
      const now = new Date()
      const [summary, recent] = await Promise.all([
        gestionesCompraAPI.getStatsMensuales({ año: now.getFullYear(), mes: now.getMonth() + 1 }),
        gestionesCompraAPI.list({ page: 1, limit: 5 }),
      ])
      stats.value = {
        totalGestiones: summary.totalGestiones,
        // "Pending" covers both awaiting payment and awaiting our verification.
        pendingPayment: (summary.porEstadoPago?.pendiente || 0) + (summary.porEstadoPago?.verificando || 0),
        totalSold: summary.ventasConfirmadas || 0,
        sumaComision: summary.comisionGanada || 0,
        recentGestiones: recent.gestiones,
      }
    } catch (error) {
      console.error('[asesor dashboard] stats error:', error)
    } finally {
      loading.value = false
    }
  }

  return { stats, loading, load }
}
