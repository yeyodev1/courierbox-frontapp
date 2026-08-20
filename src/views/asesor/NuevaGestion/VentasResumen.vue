<script setup lang="ts">
/** Month KPIs above the sales desk. */
import { computed } from 'vue'
import type { GestionesStats } from '@/services/gestiones_compra.api'

const props = defineProps<{ stats: GestionesStats; pendientes: number; loading: boolean }>()

const money = (value: number) => `$${(Number(value) || 0).toFixed(2)}`

const cards = computed(() => [
  { key: 'ventas', icon: 'fa-solid fa-receipt', label: 'Ventas del mes', value: String(props.stats.totalGestiones), accent: true },
  { key: 'total', icon: 'fa-solid fa-sack-dollar', label: 'Total gestionado', value: money(props.stats.sumaValorTotal), accent: false },
  { key: 'comisiones', icon: 'fa-solid fa-hand-holding-dollar', label: 'Comisiones', value: money(props.stats.sumaComision), accent: false },
  { key: 'pendientes', icon: 'fa-solid fa-hourglass-half', label: 'Pendientes', value: String(props.pendientes), accent: false },
])
</script>

<template>
  <section class="summary-strip">
    <article
      v-for="card in cards"
      :key="card.key"
      class="summary-card"
      :class="{ accent: card.accent, 'is-loading': loading }"
    >
      <span class="summary-label"><i :class="card.icon" aria-hidden="true" /> {{ card.label }}</span>
      <strong>{{ loading ? '—' : card.value }}</strong>
    </article>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.summary-strip {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;

  @media (max-width: 980px) { flex-direction: column; }
}

.summary-card {
  flex: 1 1 180px;
  padding: $space-4;
  border-radius: 18px;
  border: 1px solid rgba($ink-500, 0.18);
  background: $ink-900;

  strong { font-size: 1.35rem; color: $fg-dark; }

  &.accent {
    border-color: rgba($brand-orange, 0.25);
    strong { color: $brand-orange; }
  }

  &.is-loading {
    animation: pulse 1.4s infinite;

    strong { color: $ink-500; }
  }
}

.summary-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.72rem;
  color: $ink-400;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

@keyframes pulse {
  0%,
  100% { opacity: 1; }
  50% { opacity: 0.55; }
}

@media (prefers-reduced-motion: reduce) {
  .summary-card.is-loading { animation: none; }
}
</style>
