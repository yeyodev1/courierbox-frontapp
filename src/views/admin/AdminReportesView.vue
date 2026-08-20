<script setup lang="ts">
/** Executive report: one read of income, operation and profitability for a period. */
import { onMounted } from 'vue'
import ReportePeriodoPanel from './Reportes/ReportePeriodoPanel.vue'
import ReporteMetricas from './Reportes/ReporteMetricas.vue'
import ReporteGraficas from './Reportes/ReporteGraficas.vue'
import ReporteEmbudo from './Reportes/ReporteEmbudo.vue'
import ReporteEnvios from './Reportes/ReporteEnvios.vue'
import ReporteProveedores from './Reportes/ReporteProveedores.vue'
import { useReporteEjecutivo } from './Reportes/useReporteEjecutivo'

const r = useReporteEjecutivo()

onMounted(r.load)
</script>

<template>
  <main class="report-page" aria-labelledby="report-title">
    <header class="report-header">
      <div class="report-heading">
        <span class="eyebrow">Control ejecutivo</span>
        <h2 id="report-title">Pulso del negocio</h2>
        <p>Ingresos, operación y rentabilidad en una sola lectura.</p>
      </div>
      <div class="period-stamp">
        <span>Periodo analizado</span>
        <strong>{{ r.periodLabel.value }}</strong>
      </div>
    </header>

    <ReportePeriodoPanel
      v-model:selected-month="r.selectedMonth.value"
      v-model:desde="r.desde.value"
      v-model:hasta="r.hasta.value"
      :loading="r.loading.value"
      :exporting="r.exporting.value"
      :today="r.today"
      @preset="r.aplicarPreset"
      @use-month="r.useSelectedMonth"
      @apply="r.load"
      @export-report="r.exportReport"
      @export-envios="r.exportEnvios"
    />

    <div v-if="r.error.value" class="error-banner" role="alert">
      <span>{{ r.error.value }}</span>
      <button type="button" @click="r.load">Reintentar</button>
    </div>

    <div v-if="r.loading.value" class="loading-cards" aria-live="polite" aria-label="Cargando reporte">
      <div v-for="item in 4" :key="item" class="skeleton-card" />
    </div>

    <template v-else>
      <ReporteMetricas :report="r.report.value" />

      <ReporteGraficas
        :report="r.report.value"
        :ventas-diarias="r.ventasDiarias.value"
        :comisiones="r.comisiones.value"
        :period-label="r.periodLabel.value"
      />

      <div class="report-columns">
        <ReporteEmbudo :embudo="r.report.value.embudo" />
        <ReporteEnvios :envios="r.report.value.envios" />
      </div>

      <ReporteProveedores :proveedores="r.report.value.proveedores" />
    </template>
  </main>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use '@/styles/mixins/responsive' as *;

$cream: $ink-100;

.report-page {
  display: flex;
  flex-direction: column;
  gap: $space-6;
  color: $cream;
}

.report-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: $space-6;
}

.report-heading {
  h2 {
    margin: $space-1 0 $space-2;
    font-size: clamp(2rem, 5vw, 3.6rem);
    line-height: 0.95;
    letter-spacing: -0.055em;
  }

  p { margin: 0; color: rgba($cream, 0.68); }
}

.eyebrow {
  color: $brand-orange;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.period-stamp {
  min-width: 240px;
  padding: $space-4 $space-5;
  border-left: 3px solid $brand-orange;
  background: $ink-900;

  span,
  strong { display: block; }

  span { color: rgba($cream, 0.62); font-size: 0.76rem; }
  strong { margin-top: $space-1; }
}

.error-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-4;
  padding: $space-4 $space-5;
  border: 1px solid rgba($signal-red, 0.72);
  border-radius: $radius-md;
  color: $cream;
  background: rgba($signal-red, 0.14);

  button {
    min-height: 36px;
    border: 0;
    border-radius: $radius-md;
    padding: 0 $space-4;
    color: $cream;
    background: $signal-red;
    font: inherit;
    font-weight: 800;
    cursor: pointer;
    transition: transform 180ms ease, background-color 180ms ease;
  }
}

.loading-cards {
  display: flex;
  flex-wrap: wrap;
  gap: $space-4;
}

.skeleton-card {
  min-width: 210px;
  flex: 1 1 220px;
  min-height: 154px;
  padding: $space-5;
  border: 1px solid rgba($brand-orange, 0.18);
  border-radius: $radius-lg;
  background: linear-gradient(105deg, $ink-900 30%, rgba($brand-orange, 0.16) 50%, $ink-900 70%);
  background-size: 220% 100%;
  animation: shimmer 1.4s linear infinite;
}

.report-columns {
  display: flex;
  align-items: stretch;
  gap: $space-4;
}

@keyframes shimmer {
  to { background-position: -220% 0; }
}

@include hover-supported {
  .error-banner button:hover {
    transform: translateY(-2px);
    background: $brand-orange-soft;
  }
}

@media (max-width: 960px) {
  .report-columns { flex-wrap: wrap; }
}

@media (max-width: 680px) {
  .report-header { align-items: stretch; flex-direction: column; }
  .period-stamp { min-width: 0; width: 100%; }
}

@media (max-width: 420px) {
  .error-banner { align-items: stretch; flex-direction: column; }
}

@include reduced-motion {
  .skeleton-card { animation: none; }
  .error-banner button { transition: none; }
}
</style>
