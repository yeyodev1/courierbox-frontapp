<script setup lang="ts">
/** Right-hand pane: the selected client's profile and full order history. */
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import type { ContactoDetail } from '@/services/contactos.api'
import ContactoOrderCard from './ContactoOrderCard.vue'
import { formatShortDate, orderRoute, type ContactoOrder } from './useContactos'

defineProps<{ detalle: ContactoDetail | null; loading: boolean }>()
const emit = defineEmits<{ close: []; 'open-order': [path: string] }>()

const open = (order: ContactoOrder) => emit('open-order', orderRoute(order))
</script>

<template>
  <div class="contacto-detail">
    <div v-if="loading" class="loading" aria-busy="true" aria-live="polite">
      <AppSkeleton variant="title" />
      <AppSkeleton variant="text" :count="3" />
      <AppSkeleton variant="card" height="90px" :count="3" gap="0.75rem" />
    </div>

    <div v-else-if="!detalle" class="detail-empty">
      <i class="fa-solid fa-address-card" />
      <p>Selecciona un contacto para ver sus órdenes</p>
    </div>

    <template v-else>
      <div class="detail-header">
        <button class="btn-back" aria-label="Cerrar detalle" @click="emit('close')">
          <i class="fa-solid fa-xmark" />
        </button>
        <div class="detail-title">
          <h2>{{ detalle.contacto.clientName }}</h2>
          <div class="detail-contact">
            <span v-if="detalle.contacto.clientEmail">
              <i class="fa-solid fa-envelope" /> {{ detalle.contacto.clientEmail }}
            </span>
            <span v-if="detalle.contacto.clientPhone">
              <i class="fa-solid fa-phone" /> {{ detalle.contacto.clientPhone }}
            </span>
          </div>
        </div>
        <div class="detail-stats">
          <div class="stat">
            <span class="stat-value">{{ detalle.contacto.totalOrders }}</span>
            <span class="stat-label">Órdenes</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ formatShortDate(detalle.contacto.firstOrderDate) }}</span>
            <span class="stat-label">Primera orden</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ formatShortDate(detalle.contacto.lastOrderDate) }}</span>
            <span class="stat-label">Última orden</span>
          </div>
        </div>
      </div>

      <div class="detail-orders">
        <h3>Órdenes ({{ detalle.orders.length }})</h3>
        <ContactoOrderCard v-for="o in detalle.orders" :key="o._id" :order="o" @open="open(o)" />
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.contacto-detail {
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.1);
  border-radius: 16px;
  padding: $space-6;
  overflow-y: auto;
  max-height: 80vh;
}

.loading {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  padding: $space-4 0;
}

.detail-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $space-12 0;
  color: $ink-500;

  i { font-size: 2.5rem; margin-bottom: $space-4; }
  p { margin: 0; font-size: 0.95rem; }
}

.detail-header {
  display: flex;
  flex-direction: column;
  gap: $space-4;
  padding-bottom: $space-4;
  border-bottom: 1px solid rgba($ink-500, 0.1);
  position: relative;
}

.btn-back {
  position: absolute;
  top: 0;
  right: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid rgba($ink-500, 0.2);
  border-radius: 8px;
  color: $ink-400;
  cursor: pointer;

  &:hover { background: rgba($signal-red, 0.1); color: #ff8a8f; }
}

.detail-title h2 { margin: 0 0 $space-1; font-size: 1.2rem; color: $fg-dark; }

.detail-contact {
  display: flex;
  gap: $space-4;
  font-size: 0.85rem;
  color: $ink-400;

  i { margin-right: $space-1; }
}

.detail-stats {
  display: flex;
  gap: $space-6;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-value { font-size: 0.9rem; font-weight: 600; color: $fg-dark; }

.stat-label {
  font-size: 0.7rem;
  color: $ink-400;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.detail-orders {
  padding-top: $space-4;

  h3 { font-size: 0.95rem; margin: 0 0 $space-3; color: $fg-dark; }
}
</style>
