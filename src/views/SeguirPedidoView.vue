<script setup lang="ts">
/** Public order status reached through a single-use link from the asesor. */
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import PedidoTimeline from './SeguirPedido/PedidoTimeline.vue'
import { paymentClass, paymentLabel, useSeguirPedido } from './SeguirPedido/useSeguirPedido'

const route = useRoute()
const p = useSeguirPedido()

onMounted(() => p.load(String(route.params.token)))
</script>

<template>
  <main class="seguir-page">
    <div class="seguir-container">
      <div v-if="p.loading.value" class="loading" aria-busy="true" aria-live="polite">
        <AppSkeleton variant="title" />
        <AppSkeleton variant="card" height="200px" />
        <AppSkeleton variant="text" :count="3" />
      </div>

      <div v-else-if="p.order.value" class="seguir-card">
        <div class="seguir-header">
          <div class="seguir-brand">Courier Box</div>
          <div class="seguir-order-id">Orden #{{ p.order.value._id.slice(-6).toUpperCase() }}</div>
        </div>

        <div v-if="p.order.value.wasAlreadyUsed" class="seguir-warning">
          <i class="fa-solid fa-triangle-exclamation" />
          Este enlace ya fue usado anteriormente. Si necesitas consultar de nuevo, pide a tu asesor
          que genere un nuevo enlace.
        </div>

        <h2 class="seguir-cliente">{{ p.order.value.clientName }}</h2>
        <p class="seguir-desc">{{ p.order.value.description }}</p>

        <div class="seguir-details">
          <div class="seguir-detail">
            <span class="seguir-label">Tienda</span>
            <span class="seguir-value">{{ p.order.value.storeName }}</span>
          </div>
          <div class="seguir-detail">
            <span class="seguir-label">Servicio</span>
            <span class="seguir-value">
              {{ p.order.value.serviceType === 'compra_total' ? 'Compra Total' : 'Logística' }}
            </span>
          </div>
          <div class="seguir-detail">
            <span class="seguir-label">Valor</span>
            <span class="seguir-value seguir-total">${{ p.order.value.totalAmount.toFixed(2) }}</span>
          </div>
          <div v-if="p.order.value.trackingUsa" class="seguir-detail">
            <span class="seguir-label">Tracking USA</span>
            <span class="seguir-value">{{ p.order.value.trackingUsa }}</span>
          </div>
          <div class="seguir-detail">
            <span class="seguir-label">Estado de pago</span>
            <span class="seguir-value">
              <span class="badge" :class="paymentClass(p.order.value.paymentStatus)">
                {{ paymentLabel(p.order.value.paymentStatus) }}
              </span>
            </span>
          </div>
        </div>

        <PedidoTimeline
          :current-step-index="p.currentStepIndex.value"
          :audit-log="p.order.value.auditLog"
        />
      </div>

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
  color: $fg-dark;
  padding: $space-8 $space-4;
}

.seguir-container {
  max-width: 640px;
  margin: 0 auto;
}

.loading {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.seguir-card {
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.12);
  border-radius: 20px;
  padding: $space-8;
}

.seguir-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-3;
  text-align: center;
  color: $ink-400;

  i { font-size: 2rem; color: $brand-orange; }
  h2 { margin: 0; color: $fg-dark; font-size: 1.2rem; }
  p { margin: 0; }
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

.seguir-brand { font-weight: 800; font-size: 1.1rem; color: $brand-orange; }
.seguir-order-id { font-size: 0.8rem; color: $ink-400; font-family: monospace; }

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

.seguir-cliente { font-size: 1.25rem; margin: 0 0 $space-1; color: $fg-dark; }
.seguir-desc { font-size: 0.9rem; color: $ink-400; margin: 0 0 $space-6; }

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

.seguir-value { font-size: 0.9rem; color: $fg-dark; font-weight: 500; }
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

@media (prefers-reduced-motion: reduce) {
  .btn-home { transition: none; }
}
</style>
