<script setup lang="ts">
/** The four headline numbers: accrued income, expenses, profit and cash balance. */
import type { ExecutiveReport } from './useReporteEjecutivo'
import { formatMoney } from './useReporteEjecutivo'

defineProps<{ report: ExecutiveReport }>()
</script>

<template>
  <section class="metric-row" aria-label="Resumen financiero">
    <article class="metric-card metric-card--income">
      <span>Ingresos devengados</span>
      <strong>{{ formatMoney(report.finanzas.ingresos) }}</strong>
      <small>Ventas reconocidas en el periodo</small>
    </article>
    <article class="metric-card metric-card--expense">
      <span>Egresos devengados</span>
      <strong>{{ formatMoney(report.finanzas.egresos) }}</strong>
      <small>{{ formatMoney(report.gastos.total) }} en gastos registrados</small>
    </article>
    <article class="metric-card metric-card--utility">
      <span>Utilidad</span>
      <strong>{{ formatMoney(report.finanzas.utilidad) }}</strong>
      <small>Ingresos menos egresos devengados</small>
    </article>
    <article class="metric-card metric-card--cash">
      <span>Saldo de caja</span>
      <strong>{{ formatMoney(report.caja.utilidad) }}</strong>
      <small>{{ formatMoney(report.caja.ingresos) }} cobrado · {{ formatMoney(report.caja.egresos) }} pagado</small>
    </article>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use '@/styles/mixins/responsive' as *;
@use './reportes-ui' as ui;

$cream: $ink-100;

.metric-row {
  display: flex;
  flex-wrap: wrap;
  gap: $space-4;
  color: $cream;
}

.metric-card {
  position: relative;
  overflow: hidden;
  min-width: 210px;
  flex: 1 1 220px;
  min-height: 154px;
  padding: $space-5;
  border: 1px solid rgba($cream, 0.12);
  border-radius: $radius-lg;
  background: $ink-900;
  transition: transform 180ms ease, border-color 180ms ease;

  &::before {
    position: absolute;
    top: 0;
    right: 0;
    width: 56px;
    height: 4px;
    content: '';
    background: var(--metric-color);
  }

  > span,
  > small { color: rgba($cream, 0.64); }

  > span {
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  > strong {
    display: block;
    margin: $space-4 0 $space-3;
    font-size: clamp(1.5rem, 3vw, 2.2rem);
    letter-spacing: -0.04em;
  }

  > small { font-size: 0.73rem; }
}

.metric-card--income { --metric-color: #{$signal-green}; }
.metric-card--expense { --metric-color: #{$signal-red}; }
.metric-card--utility { --metric-color: #{$signal-blue}; }
.metric-card--cash { --metric-color: #{ui.$signal-purple}; }

@include hover-supported {
  .metric-card:hover {
    transform: translateY(-3px);
    border-color: var(--metric-color);
  }
}

@media (max-width: 680px) {
  .metric-card { min-width: min(100%, 210px); }
}

@include reduced-motion {
  .metric-card { transition: none; }
}
</style>
