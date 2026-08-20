<script setup lang="ts">
/** One order of the selected client, with its last few audit entries. */
import {
  auditLabel,
  formatDate,
  formatMoney,
  orderAdvisor,
  statusLabel,
  type ContactoOrder,
} from './useContactos'

defineProps<{ order: ContactoOrder }>()
const emit = defineEmits<{ open: [] }>()

const truncate = (value = '', max = 60) => (value.length > max ? `${value.slice(0, max)}...` : value)
</script>

<template>
  <div class="order-card">
    <div class="order-header">
      <span class="order-id">#{{ order._id.slice(-6).toUpperCase() }}</span>
      <span class="order-status" :class="`status-${order.status}`">
        {{ order.source === 'gestion' ? 'Nueva' : 'Histórica' }} · {{ statusLabel(order.status) }}
      </span>
      <span class="order-amount">{{ formatMoney(order.totalAmount) }}</span>
    </div>

    <button class="order-open" type="button" @click="emit('open')">
      Ver {{ order.source === 'gestion' ? 'gestión' : 'histórico' }}
    </button>

    <div class="order-body">
      <div class="order-detail-item"><span class="label">Tienda</span><span>{{ order.storeName }}</span></div>
      <div class="order-detail-item"><span class="label">Producto</span><span>{{ truncate(order.description) }}</span></div>
      <div class="order-detail-item">
        <span class="label">Servicio</span>
        <span>{{ order.serviceType === 'compra_total' ? 'Compra Total' : 'Logística' }}</span>
      </div>
      <div class="order-detail-item"><span class="label">Creada por</span><span>{{ orderAdvisor(order) }}</span></div>
      <div class="order-detail-item"><span class="label">Fecha</span><span>{{ formatDate(order.createdAt) }}</span></div>
    </div>

    <div v-if="order.auditLog?.length" class="order-audit">
      <div class="audit-toggle"><i class="fa-solid fa-clock-rotate-left" /> Historial</div>
      <div class="audit-entries">
        <div v-for="entry in order.auditLog.slice(-5).reverse()" :key="entry.timestamp" class="audit-entry">
          <div class="audit-dot" />
          <div class="audit-entry-body">
            <div class="audit-action">{{ auditLabel(entry.action) }}</div>
            <div class="audit-meta">{{ entry.userName }} · {{ formatDate(entry.timestamp) }}</div>
            <div v-if="entry.notes" class="audit-notes">{{ entry.notes }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.order-card {
  background: rgba($ink-1000, 0.4);
  border: 1px solid rgba($ink-500, 0.1);
  border-radius: 12px;
  padding: $space-4;
  margin-bottom: $space-3;
}

.order-open {
  margin-top: $space-3;
  border: 1px solid rgba($brand-orange, 0.3);
  border-radius: 10px;
  padding: $space-2 $space-3;
  color: $brand-orange;
  background: transparent;
  font-family: inherit;
  cursor: pointer;
}

.order-header {
  display: flex;
  align-items: center;
  gap: $space-3;
  margin-bottom: $space-3;
  padding-bottom: $space-3;
  border-bottom: 1px solid rgba($ink-500, 0.06);
}

.order-id {
  font-family: monospace;
  font-size: 0.8rem;
  color: $ink-400;
}

.order-status {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba($ink-500, 0.1);
  color: $ink-300;

  &.status-pendiente,
  &.status-en_envio { background: rgba(#64b5f6, 0.12); color: #64b5f6; }
  &.status-en_proceso { background: rgba($brand-orange, 0.12); color: $brand-orange; }
  &.status-comprado,
  &.status-entregado { background: rgba(#81c784, 0.12); color: #81c784; }
}

.order-amount {
  margin-left: auto;
  font-weight: 700;
  color: $brand-orange;
  font-size: 0.9rem;
}

.order-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-2;
}

.order-detail-item {
  display: flex;
  flex-direction: column;
  gap: 2px;

  .label { font-size: 0.7rem; color: $ink-400; text-transform: uppercase; letter-spacing: 0.04em; }
  span:last-child { font-size: 0.85rem; color: $fg-dark; }
}

.order-audit {
  margin-top: $space-3;
  padding-top: $space-3;
  border-top: 1px solid rgba($ink-500, 0.06);
}

.audit-toggle {
  font-size: 0.8rem;
  color: $ink-400;
  margin-bottom: $space-2;

  i { margin-right: $space-1; }
}

.audit-entries {
  display: flex;
  flex-direction: column;
  gap: $space-1;
}

.audit-entry {
  display: flex;
  gap: $space-2;
  padding: $space-1 0;
}

.audit-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: $brand-orange;
  flex-shrink: 0;
  margin-top: 5px;
}

.audit-entry-body { flex: 1; }
.audit-action { font-size: 0.8rem; font-weight: 600; color: $fg-dark; }
.audit-meta { font-size: 0.7rem; color: $ink-400; }
.audit-notes { font-size: 0.75rem; color: $ink-300; margin-top: 2px; }
</style>
