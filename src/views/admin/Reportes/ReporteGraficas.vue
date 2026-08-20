<script setup lang="ts">
/** Daily sales, delivery profitability and advisor commissions as charts. */
import { computed } from 'vue'
import AppChart from '@/components/ui/AppChart.vue'
import type { ComisionAsesor, ExecutiveReport, VentaDiaria } from './useReporteEjecutivo'

const props = defineProps<{
  report: ExecutiveReport
  ventasDiarias: VentaDiaria[]
  comisiones: ComisionAsesor[]
  periodLabel: string
}>()

const ventasChart = computed(() => ({
  labels: props.ventasDiarias.map((v) => v._id.slice(5)),
  series: [{ label: 'Ventas confirmadas', data: props.ventasDiarias.map((v) => Number(v.total) || 0) }],
}))

const enviosChart = computed(() => {
  const filas = props.report.envios.filter((e) => e._id)
  return {
    labels: filas.map((e) => e._id ?? '—'),
    series: [
      { label: 'Cobrado', data: filas.map((e) => Number(e.cobrado) || 0), color: '#2BBB92' },
      { label: 'Costo', data: filas.map((e) => Number(e.costo) || 0), color: '#E5484D' },
    ],
  }
})

const comisionesChart = computed(() => ({
  labels: props.comisiones.map((c) => c.asesorNombre ?? 'Sin asesor'),
  series: [
    { label: 'Ventas', data: props.comisiones.map((c) => Number(c.ventas) || 0), color: '#2094D2' },
    { label: 'Comisión', data: props.comisiones.map((c) => Number(c.comision) || 0), color: '#F08A1F' },
  ],
}))
</script>

<template>
  <section class="charts-grid" aria-label="Gráficas del periodo">
    <article class="report-panel chart-panel chart-panel--wide">
      <header class="chart-head">
        <h3>Ventas confirmadas por día</h3>
        <span>{{ periodLabel }}</span>
      </header>
      <AppChart tipo="line" moneda alto="240px" :labels="ventasChart.labels" :series="ventasChart.series" />
    </article>

    <article class="report-panel chart-panel">
      <header class="chart-head">
        <h3>Rentabilidad de envíos</h3>
        <span>Cobrado vs costo por estado</span>
      </header>
      <AppChart moneda alto="240px" :labels="enviosChart.labels" :series="enviosChart.series" />
    </article>

    <article class="report-panel chart-panel">
      <header class="chart-head">
        <h3>Ventas y comisiones por asesor</h3>
        <span>Solo gestiones con pago confirmado</span>
      </header>
      <AppChart moneda alto="240px" :labels="comisionesChart.labels" :series="comisionesChart.series" />
    </article>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use './reportes-ui' as ui;

@include ui.panel;

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  margin-bottom: 1.25rem;
  color: $ink-100;

  @media (max-width: 900px) { grid-template-columns: 1fr; }
}

.chart-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  &--wide { grid-column: 1 / -1; }
}

.chart-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;

  h3 { margin: 0; font-size: 1rem; }
  span { font-size: 0.78rem; opacity: 0.65; }
}
</style>
