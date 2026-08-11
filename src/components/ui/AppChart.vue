<script setup lang="ts">
/**
 * One chart component for the whole admin.
 *
 * It replaces the two GHL-shaped charts that shipped with hardcoded
 * "Conversaciones" labels and were never imported anywhere. Chart.js pieces are
 * registered once here rather than per component.
 */
import { computed } from 'vue'
import { Bar, Line } from 'vue-chartjs'
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  type ChartOptions,
} from 'chart.js'

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  Filler,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
)

export interface SerieChart {
  label: string
  data: number[]
  color?: string
}

const props = withDefaults(
  defineProps<{
    tipo?: 'bar' | 'line'
    labels: string[]
    series: SerieChart[]
    /** Formats axis ticks and tooltips as currency. */
    moneda?: boolean
    alto?: string
    /** Hidden when there is a single series and the title already says it. */
    mostrarLeyenda?: boolean
  }>(),
  { tipo: 'bar', moneda: false, alto: '260px', mostrarLeyenda: true }
)

const PALETA = ['#F08A1F', '#2BBB92', '#2094D2', '#FFB347', '#E5484D']

const GRID = 'rgba(245, 244, 241, 0.08)'
const TICK = '#B7B6B0'

function fmt(value: number): string {
  return props.moneda
    ? `$${Number(value || 0).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : String(value ?? 0)
}

const vacio = computed(
  () => props.labels.length === 0 || props.series.every((s) => s.data.every((v) => !v)),
)

const chartData = computed(() => ({
  labels: props.labels,
  datasets: props.series.map((s, i) => {
    const color = s.color ?? PALETA[i % PALETA.length]!
    return {
      label: s.label,
      data: s.data,
      backgroundColor: props.tipo === 'line' ? `${color}22` : color,
      borderColor: color,
      borderWidth: props.tipo === 'line' ? 2 : 0,
      borderRadius: props.tipo === 'bar' ? 6 : 0,
      barPercentage: 0.6,
      maxBarThickness: 46,
      fill: props.tipo === 'line',
      tension: 0.32,
      pointRadius: 2,
      pointHoverRadius: 5,
    }
  }),
}))

const chartOptions = computed<ChartOptions<'bar' | 'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: {
      display: props.mostrarLeyenda && props.series.length > 1,
      labels: { color: TICK, boxWidth: 12, boxHeight: 12, usePointStyle: true },
    },
    tooltip: {
      backgroundColor: '#14141A',
      borderColor: 'rgba(245,244,241,0.12)',
      borderWidth: 1,
      titleColor: '#F5F4F1',
      bodyColor: '#B7B6B0',
      padding: 10,
      callbacks: {
        label: (ctx: any) => ` ${ctx.dataset.label}: ${fmt(ctx.parsed.y)}`,
      },
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: TICK, maxRotation: 0, autoSkipPadding: 16 } },
    y: {
      beginAtZero: true,
      grid: { color: GRID },
      ticks: { color: TICK, callback: (v: any) => fmt(Number(v)) },
    },
  },
}))
</script>

<template>
  <div class="chart" :style="{ height: alto }">
    <p v-if="vacio" class="chart__empty">
      <i class="fa-solid fa-chart-simple" aria-hidden="true" />
      Sin datos en este período
    </p>
    <component
      :is="tipo === 'line' ? Line : Bar"
      v-else
      :data="chartData"
      :options="chartOptions"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.chart { position: relative; width: 100%; }

.chart__empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  margin: 0;
  color: $ink-500;
  font-size: 0.85rem;

  i { font-size: 1.5rem; opacity: 0.6; }
}
</style>
