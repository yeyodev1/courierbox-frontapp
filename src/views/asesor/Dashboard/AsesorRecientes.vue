<script setup lang="ts">
/** The asesor's five latest sales, with their payment state. */
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import type { GestionCompra } from '@/services/gestiones_compra.api'
import { formatDate, formatMoney, paymentBadge } from './useAsesorDashboard'

defineProps<{ gestiones: GestionCompra[]; loading: boolean }>()
const emit = defineEmits<{ open: [id: string] }>()

const clienteDe = (g: GestionCompra) =>
  typeof g.contactoId === 'object' ? g.contactoId.nombre : 'Cliente'
</script>

<template>
  <section class="recent-section">
    <div class="section-header">
      <h3 class="section-title">Gestiones recientes</h3>
      <router-link to="/asesor/gestiones-compra" class="btn-link">Ver todas</router-link>
    </div>

    <div v-if="loading" class="loading" aria-busy="true" aria-live="polite">
      <AppSkeleton variant="card" height="72px" :count="4" gap="0.75rem" />
    </div>

    <div v-else-if="!gestiones.length" class="empty">
      <p>No tienes gestiones recientes</p>
    </div>

    <div v-else class="recent-list">
      <div v-for="g in gestiones" :key="g._id" class="recent-item" @click="emit('open', g._id)">
        <div class="recent-main">
          <span class="recent-client">{{ clienteDe(g) }}</span>
          <span class="recent-desc">{{ g.paginaCompra }}</span>
        </div>
        <div class="recent-side">
          <span class="badge" :class="paymentBadge(g.estadoPago).class">
            {{ paymentBadge(g.estadoPago).label }}
          </span>
          <span class="recent-total">{{ formatMoney(g.valorTotal) }}</span>
          <span class="recent-date">{{ formatDate(g.createdAt) }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.recent-section {
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.12);
  border-radius: 20px;
  padding: $space-6;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-4;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}

.btn-link {
  color: $brand-orange;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;

  &:hover { text-decoration: underline; }
}

.loading,
.empty {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: $space-8 0;
  color: $ink-500;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.recent-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $space-4;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover { background: rgba($ink-500, 0.08); }

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
    gap: $space-3;
  }
}

.recent-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.recent-client { font-weight: 600; }
.recent-desc { font-size: 0.85rem; color: $ink-400; }

.recent-side {
  display: flex;
  align-items: center;
  gap: $space-4;

  @media (max-width: 640px) { width: 100%; justify-content: space-between; }
}

.recent-total { font-weight: 700; color: $brand-orange; }
.recent-date { font-size: 0.8rem; color: $ink-500; }

.badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
  text-transform: uppercase;

  &.badge-amber { background: rgba($signal-amber, 0.12); color: $signal-amber; }
  &.badge-blue { background: rgba($signal-blue, 0.12); color: $signal-blue; }
  &.badge-green { background: rgba($signal-green, 0.12); color: $signal-green; }
  &.badge-red { background: rgba($signal-red, 0.12); color: #ff8a8f; }
}

@media (prefers-reduced-motion: reduce) {
  .recent-item { transition: none; }
}
</style>
