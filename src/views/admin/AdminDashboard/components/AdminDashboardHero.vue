<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  totalPayments: number
  pendingPayments: number
  totalGastos: number
}>()

function formatCurrency(value: number) {
  return '$' + Number(value || 0).toFixed(2)
}

const chips = computed(() => ([
  { value: props.totalPayments, label: 'links' },
  { value: props.pendingPayments, label: 'pendientes' },
  { value: formatCurrency(props.totalGastos), label: 'gastos' },
]))
</script>

<template>
  <section class="hero-panel">
    <div class="hero-copy">
      <span class="eyebrow">Panel administrativo</span>
      <h1>Operación, pagos y gastos en un solo lugar</h1>
      <p>Revisión rápida de actividad, costos y accesos directos con datos reales.</p>
    </div>
    <div class="hero-meta">
      <div v-for="chip in chips" :key="chip.label" class="hero-chip">
        <strong>{{ chip.value }}</strong>
        <span>{{ chip.label }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.hero-panel {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  padding: $space-5;
  border-radius: 20px;
  border: 1px solid rgba($ink-500, 0.12);
  background: linear-gradient(135deg, rgba($ink-900, 0.98), rgba($ink-800, 0.82));
  align-items: center;
  text-align: center;
}

.hero-copy {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  align-items: center;

  .eyebrow {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: $brand-orange;
    font-weight: 700;
  }

  h1 {
    margin: 0;
    font-size: clamp(1.6rem, 3vw, 2.35rem);
    line-height: 1.05;
  }

  p {
    margin: 0;
    max-width: 58ch;
    color: $ink-300;
  }
}

.hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;
  justify-content: center;
}

.hero-chip {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 120px;
  padding: $space-3 $space-4;
  border-radius: 14px;
  background: rgba($ink-700, 0.45);
  border: 1px solid rgba($ink-500, 0.12);

  strong {
    font-size: 1.1rem;
  }

  span {
    font-size: 0.75rem;
    color: $ink-400;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
}
</style>
