import { ref } from 'vue'
import { contactosApi, type Contacto, type ContactoDetail } from '@/services/contactos.api'
import { useToastStore } from '@/stores/toast.store'

export type ContactoOrder = ContactoDetail['orders'][number]

const STATUS_LABELS: Record<string, string> = {
  borrador: 'Borrador',
  pendiente: 'Pendiente',
  en_proceso: 'En proceso',
  comprado: 'Comprado',
  en_envio: 'En envío',
  entregado: 'Entregado',
}

const AUDIT_LABELS: Record<string, string> = {
  created: 'Creada',
  status_changed: 'Estado cambiado',
  payment_status_changed: 'Pago actualizado',
}

export const statusLabel = (status: string) => STATUS_LABELS[status] ?? status
export const auditLabel = (action: string) => AUDIT_LABELS[action] ?? action

export function formatDate(ts: string): string {
  return new Date(ts).toLocaleDateString('es-EC', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatShortDate(ts: string): string {
  return new Date(ts).toLocaleDateString('es-EC', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatMoney(value: number): string {
  return `$${value.toFixed(2)}`
}

/** An order is either a new "gestión" or a historic purchase order. */
export function orderRoute(order: ContactoOrder) {
  return order.source === 'gestion'
    ? `/admin/gestiones-compra/${order._id}`
    : `/admin/purchase-orders?order=${order._id}`
}

export function orderAdvisor(order: ContactoOrder) {
  return typeof order.asesorId === 'object' ? order.asesorId.name || order.asesorId.email : 'N/A'
}

/** Client directory with the order history of whoever is selected. */
export function useContactos() {
  const toastStore = useToastStore()

  const contactos = ref<Contacto[]>([])
  const total = ref(0)
  const loading = ref(false)
  const searchQuery = ref('')

  const selected = ref<ContactoDetail | null>(null)
  const loadingDetail = ref(false)

  function fail(error: unknown, fallback: string) {
    toastStore.showNotification((error as Error)?.message || fallback, 'error')
  }

  async function load() {
    loading.value = true
    try {
      const data = await contactosApi.list({ q: searchQuery.value.trim() || undefined, limit: 200 })
      contactos.value = data.contactos
      total.value = data.total
    } catch (error) {
      fail(error, 'Error al cargar contactos')
    } finally {
      loading.value = false
    }
  }

  async function open(contacto: Contacto) {
    loadingDetail.value = true
    selected.value = null
    try {
      selected.value = await contactosApi.getDetail(
        contacto.clientName,
        contacto.clientEmail,
        contacto.clientPhone,
      )
    } catch (error) {
      fail(error, 'Error al cargar detalle')
    } finally {
      loadingDetail.value = false
    }
  }

  return { contactos, total, loading, searchQuery, selected, loadingDetail, load, open }
}
