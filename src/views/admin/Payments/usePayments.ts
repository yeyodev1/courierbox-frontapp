import { ref } from 'vue'
import { adminApi } from '@/services/admin.api'
import { useToastStore } from '@/stores/toast.store'

export interface PaymentLink {
  _id: string
  reference: string
  customerName?: string
  amount: number
  status: string
  paymentLink: string
  createdAt: string
  createdBy?: { name?: string }
}

export interface PaymentForm {
  reference: string
  customerName: string
  customerEmail: string
}

export function emptyPaymentForm(): PaymentForm {
  return { reference: '', customerName: '', customerEmail: '' }
}

const PAID_STATUSES = ['paid', 'approved']

export const isPaid = (status: string) => PAID_STATUSES.includes(status)

export function statusLabel(status: string) {
  if (isPaid(status)) return 'Pagado'
  if (status === 'pending') return 'Pendiente'
  if (status === 'canceled') return 'Cancelado'
  return status
}

export function statusClass(status: string) {
  if (isPaid(status)) return 'badge-success'
  if (status === 'pending') return 'badge-warning'
  if (status === 'canceled') return 'badge-danger'
  return 'badge-info'
}

/** Payment links the admin hands to clients, and their status. */
export function usePayments() {
  const toastStore = useToastStore()

  const payments = ref<PaymentLink[]>([])
  const loading = ref(false)
  const creating = ref(false)

  function fail(error: unknown, fallback: string) {
    toastStore.showNotification((error as Error)?.message || fallback, 'error')
  }

  async function load() {
    loading.value = true
    try {
      const data = await adminApi.getPayments()
      payments.value = data.payments || []
    } catch (error) {
      fail(error, 'Error al cargar pagos')
    } finally {
      loading.value = false
    }
  }

  /** The gateway takes cents, and Courier Box quotes tax-inclusive prices. */
  function toGatewayAmounts(total: number) {
    const cents = Math.round((total || 0) * 100)
    return { amount: cents, amountWithoutTax: cents, amountWithTax: 0, tax: 0 }
  }

  async function generate(form: PaymentForm, total: number): Promise<boolean> {
    creating.value = true
    try {
      await adminApi.generateLink({ ...toGatewayAmounts(total), ...form })
      toastStore.showNotification('Link de pago generado exitosamente', 'success')
      await load()
      return true
    } catch (error) {
      fail(error, 'Error al generar el link')
      return false
    } finally {
      creating.value = false
    }
  }

  /** Returns the refusal message, or null when the link may be deleted. */
  function deletionBlockedReason(payment: PaymentLink): string | null {
    return isPaid(payment.status) ? 'No se puede eliminar un link pagado.' : null
  }

  async function remove(payment: PaymentLink): Promise<boolean> {
    try {
      await adminApi.deletePayment(payment._id)
      toastStore.showNotification('Link de pago eliminado', 'success')
      await load()
      return true
    } catch (error) {
      fail(error, 'Error al eliminar')
      return false
    }
  }

  function copyLink(link: string) {
    navigator.clipboard?.writeText(link)
    toastStore.showNotification('Link copiado', 'success')
  }

  function warn(message: string) {
    toastStore.showNotification(message, 'warning')
  }

  return { payments, loading, creating, load, generate, remove, deletionBlockedReason, copyLink, warn }
}
