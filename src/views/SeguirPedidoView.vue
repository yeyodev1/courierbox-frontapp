<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { useToastStore } from '@/stores/toast.store'

const route = useRoute()

interface AuditEntry {
  timestamp: string
  action: string
  userName: string
  notes: string
}

interface OrderData {
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

const order = ref<OrderData | null>(null)
const loading = ref(true)
const toastStore = useToastStore()

const apiBaseUrl = (() => {
  const origin = window.location.origin
  if (origin.includes('testing-storybrand-frontend.bakano.ec')) {
    return 'https://testing-storybrand-backapp.bakano.ec/api'
  }
  return (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8101/api'
})()

const statusSteps = [
  { key: 'borrador', label: 'Borrador' },
  { key: 'pendiente', label: 'Pendiente' },
  { key: 'en_proceso', label: 'En proceso' },
  { key: 'comprado', label: 'Comprado' },
  { key: 'en_envio', label: 'En envío' },
  { key: 'entregado', label: 'Entregado' },
]

const currentStepIndex = computed(() => {
  if (!order.value) return -1
  return statusSteps.findIndex((s) => s.key === order.value?.status)
})

function formatDate(ts: string): string {
  const d = new Date(ts)
  return d.toLocaleDateString('es-EC', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatAuditAction(action: string): string {
  const labels: Record<string, string> = {
    created: 'Orden creada',
    status_changed: 'Estado actualizado',
    payment_status_changed: 'Estado de pago actualizado',
    viewed_by_client: 'Consulta de estado',
  }
  return labels[action] || action
}

onMounted(async () => {
  const token = String(route.params.token)
  if (!token) {
    toastStore.showNotification('Enlace inválido', 'error')
    loading.value = false
    return
  }
  try {
    const res = await axios.get<{ order: OrderData }>(`${apiBaseUrl}/v1/asesoria/orders/view/${token}`)
    order.value = res.data.order
  } catch (e: any) {
    if (e.response?.status === 410) {
      toastStore.showNotification('Este enlace ya fue utilizado. Solicita un nuevo enlace a tu asesor.', 'error')
    } else {
      toastStore.showNotification(e.response?.data?.error || 'No se pudo cargar la información de la orden.', 'error')
    }
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <main class="seguir-page">
    <div class="seguir-container">
      <div v-if="loading" class="loading">
        <i class="fa-solid fa-circle-notch fa-spin" /> Cargando...
      </div>

      <template v-else-if="order">
        <div class="seguir-card">
          <div class="seguir-header">
            <div class="seguir-brand">Courier Box</div>
            <div class="seguir-order-id">Orden #{{ order._id.slice(-6).toUpperCase() }}</div>
          </div>

          <div v-if="order.wasAlreadyUsed" class="seguir-warning">
            <i class="fa-solid fa-triangle-exclamation" />
            Este enlace ya fue usado anteriormente. Si necesitas consultar de nuevo, pide a tu asesor que genere un nuevo enlace.
          </div>

          <h2 class="seguir-cliente">{{ order.clientName }}</h2>
          <p class="seguir-desc">{{ order.description }}</p>

          <div class="seguir-details">
            <div class="seguir-detail">
              <span class="seguir-label">Tienda</span>
              <span class="seguir-value">{{ order.storeName }}</span>
            </div>
            <div class="seguir-detail">
              <span class="seguir-label">Servicio</span>
              <span class="seguir-value">{{ order.serviceType === 'compra_total' ? 'Compra Total' : 'Logística' }}</span>
            </div>
            <div class="seguir-detail">
              <span class="seguir-label">Valor</span>
              <span class="seguir-value seguir-total">${{ order.totalAmount.toFixed(2) }}</span>
            </div>
            <div v-if="order.trackingUsa" class="seguir-detail">
              <span class="seguir-label">Tracking USA</span>
              <span class="seguir-value">{{ order.trackingUsa }}</span>
            </div>
            <div class="seguir-detail">
              <span class="seguir-label">Estado de pago</span>
              <span class="seguir-value">
                <span class="badge" :class="order.paymentStatus === 'pagado' ? 'badge-green' : order.paymentStatus === 'rechazado' ? 'badge-red' : 'badge-blue'">
                  {{ order.paymentStatus === 'pendiente' ? 'Pendiente' : order.paymentStatus === 'pagado' ? 'Pagado' : order.paymentStatus === 'verificando' ? 'En verificación' : order.paymentStatus }}
                </span>
              </span>
            </div>
          </div>

          <div class="seguir-steps">
            <div
              v-for="(step, idx) in statusSteps"
              :key="step.key"
              class="step"
              :class="{ active: idx <= currentStepIndex, current: idx === currentStepIndex }"
            >
              <div class="step-dot" />
              <span>{{ step.label }}</span>
            </div>
          </div>

          <div v-if="order.auditLog && order.auditLog.length" class="seguir-timeline">
            <h3>Historial</h3>
            <div v-for="entry in order.auditLog" :key="entry.timestamp" class="timeline-entry">
              <div class="timeline-dot" />
              <div class="timeline-body">
                <div class="timeline-action">{{ formatAuditAction(entry.action) }}</div>
                <div class="timeline-date">{{ formatDate(entry.timestamp) }}</div>
                <div v-if="entry.notes" class="timeline-notes">{{ entry.notes }}</div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <div v-else class="seguir-card">
        <div class="seguir-error">
          <i class="fa-solid fa-circle-exclamation" />
          <h2>No pudimos cargar la orden</h2>
          <p>Revisa el enlace o solicita uno nuevo a tu asesor.</p>
          <router-link to="/" class="btn-home">Volver al inicio</router-link>
        </div>
      </div>
    </div>
  </main>
</template>

<style lang="scss" scoped>
@use 'sass:color';
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.seguir-page {
  min-height: 100vh;
  background: $ink-1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-6;
}

.seguir-container {
  width: 100%;
  max-width: 560px;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-3;
  padding: $space-12 0;
  color: $ink-400;
  font-size: 1rem;
}

.seguir-card {
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.12);
  border-radius: 24px;
  padding: $space-8;
}

.seguir-error {
  text-align: center;
  padding: $space-8 0;
  i { font-size: 2.5rem; color: $signal-red; margin-bottom: $space-4; }
  h2 { margin: 0 0 $space-2; color: $fg-dark; font-size: 1.5rem; }
  p { color: $ink-400; margin: 0 0 $space-6; font-size: 0.95rem; line-height: 1.5; }
}

.btn-home {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  padding: $space-2 $space-5;
  background: $brand-orange;
  border: none;
  border-radius: 10px;
  color: #fff;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s;
  &:hover { background: color.adjust($brand-orange, $lightness: -8%); }
}

.seguir-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $space-6;
}

.seguir-brand {
  font-weight: 800;
  font-size: 1.1rem;
  color: $brand-orange;
}

.seguir-order-id {
  font-size: 0.8rem;
  color: $ink-400;
  font-family: monospace;
}

.seguir-warning {
  display: flex;
  align-items: flex-start;
  gap: $space-2;
  padding: $space-3;
  background: rgba($brand-orange, 0.08);
  border: 1px solid rgba($brand-orange, 0.15);
  border-radius: 12px;
  font-size: 0.8rem;
  color: $ink-300;
  line-height: 1.4;
  margin-bottom: $space-6;
  i { color: $brand-orange; margin-top: 2px; flex-shrink: 0; }
}

.seguir-cliente {
  font-size: 1.25rem;
  margin: 0 0 $space-1;
  color: $fg-dark;
}

.seguir-desc {
  font-size: 0.9rem;
  color: $ink-400;
  margin: 0 0 $space-6;
}

.seguir-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-3;
  margin-bottom: $space-6;
}

.seguir-detail {
  padding: $space-3;
  background: rgba($ink-1000, 0.4);
  border-radius: 12px;
}

.seguir-label {
  display: block;
  font-size: 0.7rem;
  color: $ink-400;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: $space-1;
}

.seguir-value {
  font-size: 0.9rem;
  color: $fg-dark;
  font-weight: 500;
}

.seguir-total { color: $brand-orange; font-weight: 700; font-size: 1rem; }

.badge {
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 600;
  &.badge-blue { background: rgba(#64b5f6, 0.12); color: #64b5f6; }
  &.badge-green { background: rgba(#81c784, 0.12); color: #81c784; }
  &.badge-red { background: rgba(#ff8a8f, 0.12); color: #ff8a8f; }
}

.seguir-steps {
  display: flex;
  justify-content: space-between;
  gap: 0;
  padding: $space-4 0;
  margin-bottom: $space-6;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 20px;
    left: 24px;
    right: 24px;
    height: 2px;
    background: rgba($ink-500, 0.2);
    z-index: 0;
  }
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-2;
  position: relative;
  z-index: 1;
  font-size: 0.7rem;
  color: $ink-500;
  text-align: center;
  &.active { color: $fg-dark; }
  &.current { color: $brand-orange; font-weight: 600; }
}

.step-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: $ink-600;
  border: 2px solid rgba($ink-500, 0.2);
  .active & { background: $brand-orange; border-color: $brand-orange; }
  .current & { box-shadow: 0 0 0 4px rgba($brand-orange, 0.15); }
}

.seguir-timeline {
  border-top: 1px solid rgba($ink-500, 0.1);
  padding-top: $space-6;

  h3 {
    font-size: 0.9rem;
    margin: 0 0 $space-4;
    color: $ink-300;
  }
}

.timeline-entry {
  display: flex;
  gap: $space-3;
  padding: $space-2 0;
  border-left: 2px solid rgba($brand-orange, 0.15);
  margin-left: 4px;
  &:last-child { border-left-color: transparent; }
}

.timeline-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: $brand-orange;
  flex-shrink: 0;
  margin-left: -6px;
  margin-top: 5px;
}

.timeline-body { flex: 1; }

.timeline-action {
  font-size: 0.85rem;
  font-weight: 600;
  color: $fg-dark;
}

.timeline-date {
  font-size: 0.75rem;
  color: $ink-400;
  margin-top: 2px;
}

.timeline-notes {
  font-size: 0.8rem;
  color: $ink-300;
  margin-top: $space-1;
  background: rgba($ink-700, 0.3);
  padding: $space-1 $space-2;
  border-radius: 6px;
}
</style>
