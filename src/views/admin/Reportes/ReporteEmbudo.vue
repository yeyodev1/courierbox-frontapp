<script setup lang="ts">
/** Operational funnel: created → paid → delivered, sized against the largest step. */
import { computed } from 'vue'
import type { ExecutiveReport } from './useReporteEjecutivo'
import { formatMoney } from './useReporteEjecutivo'

const props = defineProps<{ embudo: ExecutiveReport['embudo'] }>()

const STEPS = [
  { key: 'creadas', label: 'Creadas', modifier: 'created' },
  { key: 'pagadas', label: 'Pagadas', modifier: 'paid' },
  { key: 'entregadas', label: 'Entregadas', modifier: 'delivered' },
] as const

const maxCount = computed(() =>
  Math.max(props.embudo.creadas.cantidad, props.embudo.pagadas.cantidad, props.embudo.entregadas.cantidad, 1),
)

function width(value: number) {
  return `${Math.max((value / maxCount.value) * 100, value > 0 ? 8 : 0)}%`
}
</script>

<template>
  <section class="report-panel funnel-panel">
    <div class="panel-heading">
      <div>
        <span class="section-kicker">Conversión operativa</span>
        <h3>Embudo del periodo</h3>
      </div>
      <span class="panel-note">Cantidad / valor</span>
    </div>

    <div class="funnel-list">
      <article v-for="step in STEPS" :key="step.key" class="funnel-step" :class="`funnel-step--${step.modifier}`">
        <div class="funnel-copy">
          <span>{{ step.label }}</span>
          <strong>{{ embudo[step.key].cantidad }}</strong>
          <small>{{ formatMoney(embudo[step.key].valor) }}</small>
        </div>
        <div class="bar-track"><span :style="{ width: width(embudo[step.key].cantidad) }" /></div>
      </article>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use './reportes-ui' as ui;

@include ui.panel;
@include ui.bar;

$cream: $ink-100;

.funnel-panel { flex: 0.9 1 420px; color: $cream; }

.funnel-list { display: flex; flex-direction: column; gap: $space-5; }

.funnel-step { --step-color: #{$signal-blue}; }
.funnel-step--paid { --step-color: #{ui.$signal-purple}; }
.funnel-step--delivered { --step-color: #{$signal-green}; }

.funnel-copy {
  display: flex;
  align-items: baseline;
  gap: $space-3;
  margin-bottom: $space-2;

  span { min-width: 78px; color: rgba($cream, 0.7); }
  strong { font-size: 1.35rem; }
  small { margin-left: auto; color: var(--step-color); font-weight: 700; }
}

.bar-track span { background: var(--step-color); }

@media (max-width: 680px) {
  .funnel-panel { flex-basis: 100%; }
}
</style>
