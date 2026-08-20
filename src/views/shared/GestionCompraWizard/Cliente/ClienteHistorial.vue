<script setup lang="ts">
/** Past sales of the selected client, so the asesor sees who they are dealing with. */
import { computed } from 'vue'
import { formatDate, statusLabel } from './step-cliente'

export interface HistorialOrder {
  _id: string
  description: string
  storeName: string
  createdAt: string
  status: string
  totalAmount: number
}

export interface HistorialDetail {
  contacto: { totalOrders: number; firstOrderDate: string; lastOrderDate: string }
  orders: HistorialOrder[]
}

const props = defineProps<{ nombre: string; detalle: HistorialDetail | null; loading: boolean }>()

const recentOrders = computed(() => props.detalle?.orders?.slice(0, 3) ?? [])
const totalSpent = computed(
  () => props.detalle?.orders?.reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0) ?? 0,
)
</script>

<template>
  <div class="history-card">
    <div class="history-header">
      <div>
        <span class="history-label">Historial del cliente</span>
        <h4>{{ nombre }}</h4>
      </div>
      <div v-if="detalle" class="history-stats">
        <span>{{ detalle.contacto.totalOrders }} ventas</span>
        <span>${{ totalSpent.toFixed(2) }}</span>
      </div>
    </div>

    <div v-if="loading" class="history-loading">
      <span class="history-skeleton" />
      <span class="history-skeleton short" />
      <span class="history-skeleton short" />
    </div>

    <template v-else-if="detalle">
      <div class="history-meta">
        <span>Primera venta: <strong>{{ formatDate(detalle.contacto.firstOrderDate) }}</strong></span>
        <span>Última venta: <strong>{{ formatDate(detalle.contacto.lastOrderDate) }}</strong></span>
      </div>

      <div v-if="recentOrders.length" class="history-list">
        <div v-for="order in recentOrders" :key="order._id" class="history-item">
          <div class="history-item-main">
            <strong>{{ order.description }}</strong>
            <span>{{ order.storeName }} · {{ formatDate(order.createdAt) }}</span>
          </div>
          <div class="history-item-side">
            <span class="badge-pill" :class="`state-${order.status}`">{{ statusLabel(order.status) }}</span>
            <strong>${{ order.totalAmount.toFixed(2) }}</strong>
          </div>
        </div>
      </div>

      <p v-else class="history-empty">No hay ventas previas para este cliente.</p>
    </template>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.history-card {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  border: 1px solid rgba($brand-orange, 0.18);
  background: rgba($brand-orange, 0.05);
  border-radius: 14px;
  padding: $space-4;
}

.history-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: $space-3;

  h4 { margin: 0; color: $fg-dark; font-size: 1rem; }
}

.history-label {
  display: inline-flex;
  margin-bottom: 2px;
  color: $brand-orange;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.history-stats {
  display: flex;
  align-items: center;
  gap: $space-3;
  color: $ink-300;
  font-size: 0.82rem;
  white-space: nowrap;
}

.history-loading {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.history-skeleton {
  display: block;
  height: 14px;
  border-radius: 999px;
  background: $ink-700;
  animation: pulse 1.4s infinite;

  &.short { width: 65%; }
}

.history-meta {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;
  color: $ink-300;
  font-size: 0.82rem;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-3;
  padding: $space-3 $space-4;
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.18);
  border-radius: 10px;
}

.history-item-main {
  display: flex;
  flex-direction: column;
  gap: 2px;

  strong { font-size: 0.9rem; }
  span { font-size: 0.78rem; color: $ink-400; }
}

.history-item-side {
  display: flex;
  align-items: center;
  gap: $space-2;
}

.badge-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 3px 10px;
  font-size: 0.72rem;
  font-weight: 700;

  &.state-comprado,
  &.state-entregado { background: rgba($signal-green, 0.15); color: $signal-green; }
  &.state-en_proceso { background: rgba($signal-blue, 0.14); color: #7fa3ff; }
  &.state-pendiente { background: rgba($brand-orange, 0.16); color: $brand-orange; }
  &.state-borrador,
  &.state-cancelado { background: rgba($ink-500, 0.18); color: $ink-300; }
}

.history-empty { margin: 0; color: $ink-400; font-size: 0.85rem; }

@keyframes pulse {
  0%,
  100% { opacity: 1; }
  50% { opacity: 0.55; }
}

@media (prefers-reduced-motion: reduce) {
  .history-skeleton { animation: none; }
}
</style>
