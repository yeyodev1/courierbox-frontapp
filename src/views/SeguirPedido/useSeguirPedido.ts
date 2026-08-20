import { computed, ref } from 'vue'
import axios from 'axios'
import { useToastStore } from '@/stores/toast.store'

export interface AuditEntry {
  timestamp: string
  action: string
  userName: string
  notes: string
}

export interface OrderData {
  _id: string
  clientName: string
  clientPhone?: string
  clientEmail?: string
  storeName: string
  description: string
  productValue: number
  shippingValue: number
  weightLb?: number
  trackingUsa?: string
  totalAmount: number
  serviceType: string
  status: string
  paymentStatus: string
  statusHistory?: { status: string; timestamp: string }[]
  auditLog?: AuditEntry[]
  createdAt: string
  wasAlreadyUsed?: boolean
}

export const STATUS_STEPS = [
  { key: 'borrador', label: 'Borrador' },
  { key: 'pendiente', label: 'Pendiente' },
  { key: 'en_proceso', label: 'En proceso' },
  { key: 'comprado', label: 'Comprado' },
  { key: 'en_envio', label: 'En envío' },
  { key: 'entregado', label: 'Entregado' },
]

const AUDIT_LABELS: Record<string, string> = {
  created: 'Orden creada',
  status_changed: 'Estado actualizado',
  payment_status_changed: 'Estado de pago actualizado',
  viewed_by_client: 'Consulta de estado',
}

const PAYMENT_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  pagado: 'Pagado',
  verificando: 'En verificación',
}

export const auditLabel = (action: string) => AUDIT_LABELS[action] ?? action
export const paymentLabel = (status: string) => PAYMENT_LABELS[status] ?? status

export function paymentClass(status: string) {
  if (status === 'pagado') return 'badge-green'
  if (status === 'rechazado') return 'badge-red'
  return 'badge-blue'
}

export function formatDate(ts: string): string {
  return new Date(ts).toLocaleDateString('es-EC', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** The testing frontend talks to its own backend host; everything else uses the env var. */
function apiBaseUrl() {
  const origin = window.location.origin
  if (origin.includes('testing-storybrand-frontend.bakano.ec')) {
    return 'https://testing-storybrand-backapp.bakano.ec/api'
  }
  return (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8101/api'
}

/** Public, tokenised order status — no login, the link itself is the credential. */
export function useSeguirPedido() {
  const toastStore = useToastStore()

  const order = ref<OrderData | null>(null)
  const loading = ref(true)

  const currentStepIndex = computed(() =>
    order.value ? STATUS_STEPS.findIndex((s) => s.key === order.value?.status) : -1,
  )

  async function load(token: string) {
    if (!token) {
      toastStore.showNotification('Enlace inválido', 'error')
      loading.value = false
      return
    }
    try {
      const res = await axios.get<{ order: OrderData }>(`${apiBaseUrl()}/v1/asesoria/orders/view/${token}`)
      order.value = res.data.order
    } catch (e: unknown) {
      const err = e as { response?: { status?: number; data?: { error?: string } } }
      // 410 means the single-use link was already spent.
      toastStore.showNotification(
        err.response?.status === 410
          ? 'Este enlace ya fue utilizado. Solicita un nuevo enlace a tu asesor.'
          : err.response?.data?.error || 'No se pudo cargar la información de la orden.',
        'error',
      )
    } finally {
      loading.value = false
    }
  }

  return { order, loading, currentStepIndex, load }
}
