<script setup lang="ts">
/** Landing state of the sales desk, before a sale type has been chosen. */
import type { GestionCompra } from '@/services/gestiones_compra.api'
import { formatDate } from './useNuevaGestion'

defineProps<{ recientes: GestionCompra[]; loading: boolean }>()
const emit = defineEmits<{ nueva: [] }>()

const clienteDe = (g: GestionCompra) =>
  typeof g.contactoId === 'object' ? g.contactoId.nombre : 'Cliente'
</script>

<template>
  <section class="dashboard anim-fade">
    <div class="cta-card">
      <div class="cta-icon"><i class="fa-solid fa-cart-plus" aria-hidden="true" /></div>
      <div class="cta-copy">
        <h2>Empieza una nueva venta</h2>
        <p>Elige el tipo de gestión y te guiamos paso a paso hasta la orden confirmada.</p>
      </div>
      <button class="primary-action lg" @click="emit('nueva')">
        <i class="fa-solid fa-plus" aria-hidden="true" /> Nueva venta
      </button>
    </div>

    <div class="panel-card recent-panel">
      <div class="panel-head">
        <h3><i class="fa-solid fa-clock-rotate-left" aria-hidden="true" /> Ventas recientes</h3>
        <span>{{ recientes.length }}</span>
      </div>

      <div v-if="loading" class="recent-list">
        <div v-for="i in 3" :key="i" class="recent-skeleton" />
      </div>

      <div v-else-if="recientes.length" class="recent-list">
        <article v-for="g in recientes" :key="g._id" class="recent-item">
          <div class="recent-main">
            <strong>{{ clienteDe(g) }}</strong>
            <span>{{ g.paginaCompra }}</span>
          </div>
          <div class="recent-meta">
            <span>{{ formatDate(g.createdAt) }}</span>
            <span class="badge-pill" :class="`state-${g.estado}`">{{ g.estado }}</span>
          </div>
        </article>
      </div>

      <p v-else class="muted">Todavía no hay ventas recientes.</p>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.dashboard {
  display: flex;
  flex-wrap: wrap;
  gap: $space-5;
  align-items: stretch;

  @media (max-width: 980px) { flex-direction: column; }
}

.cta-card {
  flex: 2 1 420px;
  display: flex;
  flex-direction: column;
  gap: $space-4;
  padding: $space-6;
  border-radius: 22px;
  border: 1px solid rgba($brand-orange, 0.2);
  background: linear-gradient(160deg, rgba($brand-orange, 0.08), $ink-900);
}

.cta-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: rgba($brand-orange, 0.14);
  color: $brand-orange;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
}

.cta-copy {
  h2 { margin: 0 0 $space-2; font-size: 1.5rem; color: $fg-dark; }
  p { margin: 0; color: $ink-300; line-height: 1.6; max-width: 520px; }
}

.primary-action {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  border: none;
  border-radius: 14px;
  padding: $space-4 $space-6;
  background: $brand-orange;
  color: $ink-1000;
  font-family: inherit;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
}

.panel-card {
  padding: $space-5;
  border-radius: 20px;
  border: 1px solid rgba($ink-500, 0.18);
  background: $ink-900;
}

.recent-panel { flex: 1 1 320px; }

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-3;

  h3 { display: flex; align-items: center; gap: $space-2; margin: 0; font-size: 1rem; }
  span { color: $ink-400; font-size: 0.82rem; }
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.recent-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-3;
  padding: $space-3;
  border-radius: 12px;
  background: rgba($ink-1000, 0.4);

  strong { font-size: 0.9rem; }
  span { color: $ink-400; font-size: 0.78rem; }
}

.recent-main { display: flex; flex-direction: column; gap: 2px; }
.recent-meta { display: flex; align-items: center; gap: $space-2; }

.recent-skeleton {
  height: 56px;
  border-radius: 12px;
  background: $ink-700;
  animation: pulse 1.4s infinite;
}

.muted { color: $ink-400; }

.badge-pill {
  border-radius: 999px;
  padding: 2px 10px;
  font-size: 0.72rem;

  &.state-activa,
  &.state-completado { background: rgba($signal-green, 0.15); color: $signal-green; }
  &.state-borrador { background: rgba($ink-500, 0.18); color: $ink-300; }
  &.state-cancelado { background: rgba($signal-red, 0.15); color: $signal-red; }
}

.anim-fade { animation: fadeInUp 0.24s ease; }

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
  0%,
  100% { opacity: 1; }
  50% { opacity: 0.55; }
}

@media (prefers-reduced-motion: reduce) {
  .anim-fade { animation: none; }
  .recent-skeleton { animation: none; }
}
</style>
