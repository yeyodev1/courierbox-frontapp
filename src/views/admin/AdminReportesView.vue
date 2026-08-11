<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { adminApi } from '@/services/admin.api'
import AppChart from '@/components/ui/AppChart.vue'

type FinancialSummary = {
  ingresos: number
  egresos: number
  utilidad: number
}

type FunnelStep = {
  cantidad: number
  valor: number
}

type ShipmentProfitability = {
  _id: string | null
  total: number
  cobrado: number
  costo: number
}

type ProviderSummary = {
  _id: string | null
  total: number
  cobrado: number
  costo: number
}

type ExecutiveReport = {
  finanzas: FinancialSummary
  gastos: { total: number; pagado: number }
  caja: FinancialSummary
  envios: ShipmentProfitability[]
  proveedores: ProviderSummary[]
  embudo: {
    creadas: FunnelStep
    pagadas: FunnelStep
    entregadas: FunnelStep
  }
}

const emptyReport: ExecutiveReport = {
  finanzas: { ingresos: 0, egresos: 0, utilidad: 0 },
  gastos: { total: 0, pagado: 0 },
  caja: { ingresos: 0, egresos: 0, utilidad: 0 },
  envios: [],
  proveedores: [],
  embudo: {
    creadas: { cantidad: 0, valor: 0 },
    pagadas: { cantidad: 0, valor: 0 },
    entregadas: { cantidad: 0, valor: 0 },
  },
}

type VentaDiaria = { _id: string; total: number; cantidad: number }
type ComisionAsesor = { asesorNombre?: string; ventas: number; comision: number; margenNeto: number }

const today = new Date()
const selectedMonth = ref(toMonthValue(today))
const desde = ref(toDateValue(new Date(today.getFullYear(), today.getMonth(), 1)))
const hasta = ref(toDateValue(today))
const loading = ref(false)
const exporting = ref(false)
const error = ref('')
const report = ref<ExecutiveReport>(emptyReport)
const ventasDiarias = ref<VentaDiaria[]>([])
const comisiones = ref<ComisionAsesor[]>([])

/**
 * The proposal promises periods beyond the old 30-day window: monthly,
 * quarterly and annual. The backend already accepts any desde/hasta, so these
 * are just shortcuts onto the same range.
 */
function aplicarPreset(preset: 'mes' | 'trimestre' | 'anio') {
  const now = new Date()
  let inicio: Date
  if (preset === 'mes') {
    inicio = new Date(now.getFullYear(), now.getMonth(), 1)
  } else if (preset === 'trimestre') {
    inicio = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
  } else {
    inicio = new Date(now.getFullYear(), 0, 1)
  }
  desde.value = toDateValue(inicio)
  hasta.value = toDateValue(now)
  void load()
}

const ventasChart = computed(() => ({
  labels: ventasDiarias.value.map((v) => v._id.slice(5)),
  series: [{ label: 'Ventas confirmadas', data: ventasDiarias.value.map((v) => Number(v.total) || 0) }],
}))

const enviosChart = computed(() => {
  const filas = report.value.envios.filter((e) => e._id)
  return {
    labels: filas.map((e) => e._id ?? '—'),
    series: [
      { label: 'Cobrado', data: filas.map((e) => Number(e.cobrado) || 0), color: '#2BBB92' },
      { label: 'Costo', data: filas.map((e) => Number(e.costo) || 0), color: '#E5484D' },
    ],
  }
})

const comisionesChart = computed(() => ({
  labels: comisiones.value.map((c) => c.asesorNombre ?? 'Sin asesor'),
  series: [
    { label: 'Ventas', data: comisiones.value.map((c) => Number(c.ventas) || 0), color: '#2094D2' },
    { label: 'Comisión', data: comisiones.value.map((c) => Number(c.comision) || 0), color: '#F08A1F' },
  ],
}))

const periodLabel = computed(() => {
  const start = parseDate(desde.value)
  const end = parseDate(hasta.value)
  if (!start || !end) return 'Periodo sin definir'
  return `${formatShortDate(start)} al ${formatShortDate(end)}`
})

const maxFunnelCount = computed(() => Math.max(
  report.value.embudo.creadas.cantidad,
  report.value.embudo.pagadas.cantidad,
  report.value.embudo.entregadas.cantidad,
  1,
))

const maxProviderShipments = computed(() => Math.max(
  ...report.value.proveedores.map((provider) => provider.total),
  1,
))

function toDateValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function toMonthValue(date: Date) {
  return toDateValue(date).slice(0, 7)
}

function parseDate(value: string) {
  if (!value) return null
  const date = new Date(`${value}T12:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat('es-EC', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

function formatMoney(value: number | undefined) {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(value || 0))
}

function formatMode(mode: string | null) {
  if (!mode) return 'Sin modalidad'
  return mode.replace(/[_-]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function margin(cobrado: number, costo: number) {
  return Number(cobrado || 0) - Number(costo || 0)
}

function marginPercent(cobrado: number, costo: number) {
  if (!cobrado) return 0
  return Math.round((margin(cobrado, costo) / cobrado) * 100)
}

function funnelWidth(value: number) {
  return `${Math.max((value / maxFunnelCount.value) * 100, value > 0 ? 8 : 0)}%`
}

function providerWidth(value: number) {
  return `${Math.max((value / maxProviderShipments.value) * 100, value > 0 ? 6 : 0)}%`
}

function useSelectedMonth() {
  const [year, month] = selectedMonth.value.split('-').map(Number)
  if (!year || !month) return
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  desde.value = toDateValue(firstDay)
  hasta.value = toDateValue(lastDay > today ? today : lastDay)
  void load()
}

async function load() {
  if (!desde.value || !hasta.value || desde.value > hasta.value) {
    error.value = 'Selecciona un rango de fechas válido.'
    return
  }

  loading.value = true
  error.value = ''
  try {
    const query = new URLSearchParams({ desde: desde.value, hasta: hasta.value })
    // The charts read from dedicated endpoints; a failure there must not blank
    // out the executive numbers, so they settle independently.
    const [response, ventasRes, comisionesRes] = await Promise.all([
      adminApi.getData(`v1/reportes/ejecutivo?${query.toString()}`),
      adminApi.getData(`v1/reportes/ventas-diarias?${query.toString()}`).catch(() => ({ ventas: [] })),
      adminApi.getData(`v1/reportes/comisiones?${query.toString()}`).catch(() => ({ comisiones: [] })),
    ])
    ventasDiarias.value = Array.isArray(ventasRes?.ventas) ? ventasRes.ventas : []
    comisiones.value = Array.isArray(comisionesRes?.comisiones) ? comisionesRes.comisiones : []
    report.value = {
      finanzas: { ...emptyReport.finanzas, ...(response.finanzas || {}) },
      gastos: { ...emptyReport.gastos, ...(response.gastos || {}) },
      caja: { ...emptyReport.caja, ...(response.caja || {}) },
      envios: Array.isArray(response.envios) ? response.envios : [],
      proveedores: Array.isArray(response.proveedores) ? response.proveedores : [],
      embudo: {
        creadas: { ...emptyReport.embudo.creadas, ...(response.embudo?.creadas || {}) },
        pagadas: { ...emptyReport.embudo.pagadas, ...(response.embudo?.pagadas || {}) },
        entregadas: { ...emptyReport.embudo.entregadas, ...(response.embudo?.entregadas || {}) },
      },
    }
  } catch (cause: unknown) {
    error.value = cause instanceof Error ? cause.message : 'No se pudo cargar el reporte ejecutivo.'
  } finally {
    loading.value = false
  }
}

async function exportReport(format: 'csv' | 'xlsx' | 'pdf') {
  exporting.value = true
  error.value = ''
  try {
    const query = new URLSearchParams({ desde: desde.value, hasta: hasta.value, formato: format })
    const blob = await adminApi.downloadData(`v1/reportes/ejecutivo?${query.toString()}`)
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `reporte_ejecutivo_${desde.value}_${hasta.value}.${format}`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(link.href)
  } catch (cause: unknown) {
    error.value = cause instanceof Error ? cause.message : 'No se pudo exportar el reporte.'
  } finally {
    exporting.value = false
  }
}

onMounted(load)
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
        <strong>{{ periodLabel }}</strong>
      </div>
    </header>

    <section class="period-panel" aria-label="Seleccionar periodo del reporte">
      <div class="presets">
        <span>Periodo</span>
        <button type="button" :disabled="loading" @click="aplicarPreset('mes')">Este mes</button>
        <button type="button" :disabled="loading" @click="aplicarPreset('trimestre')">Trimestre</button>
        <button type="button" :disabled="loading" @click="aplicarPreset('anio')">Año</button>
      </div>
      <div class="month-control">
        <label for="report-month">Ir a un mes</label>
        <div class="month-action">
          <input id="report-month" v-model="selectedMonth" type="month" :max="toMonthValue(today)" />
          <button type="button" :disabled="loading" @click="useSelectedMonth">Ver mes</button>
        </div>
      </div>
      <span class="period-divider">o define un rango</span>
      <div class="date-controls">
        <label class="date-field">
          <span>Desde</span>
          <input v-model="desde" type="date" :max="hasta || toDateValue(today)" />
        </label>
        <label class="date-field">
          <span>Hasta</span>
          <input v-model="hasta" type="date" :min="desde" :max="toDateValue(today)" />
        </label>
        <button type="button" class="apply-button" :disabled="loading" @click="load">
          {{ loading ? 'Actualizando...' : 'Aplicar periodo' }}
        </button>
      </div>
    </section>
    <div class="export-actions" aria-label="Exportar reporte">
      <button type="button" :disabled="exporting" @click="exportReport('xlsx')">Excel</button>
      <button type="button" :disabled="exporting" @click="exportReport('csv')">CSV</button>
      <button type="button" :disabled="exporting" @click="exportReport('pdf')">PDF</button>
    </div>

    <div v-if="error" class="error-banner" role="alert">
      <span>{{ error }}</span>
      <button type="button" @click="load">Reintentar</button>
    </div>

    <div v-if="loading" class="loading-cards" aria-live="polite" aria-label="Cargando reporte">
      <div v-for="item in 4" :key="item" class="skeleton-card" />
    </div>

    <template v-else>
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

      <section class="charts-grid" aria-label="Gráficas del periodo">
        <article class="report-panel chart-panel chart-panel--wide">
          <header class="chart-head">
            <h3>Ventas confirmadas por día</h3>
            <span>{{ periodLabel }}</span>
          </header>
          <AppChart
            tipo="line"
            moneda
            alto="240px"
            :labels="ventasChart.labels"
            :series="ventasChart.series"
          />
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

      <div class="report-columns">
        <section class="report-panel funnel-panel">
          <div class="panel-heading">
            <div>
              <span class="section-kicker">Conversión operativa</span>
              <h3>Embudo del periodo</h3>
            </div>
            <span class="panel-note">Cantidad / valor</span>
          </div>
          <div class="funnel-list">
            <article class="funnel-step funnel-step--created">
              <div class="funnel-copy">
                <span>Creadas</span>
                <strong>{{ report.embudo.creadas.cantidad }}</strong>
                <small>{{ formatMoney(report.embudo.creadas.valor) }}</small>
              </div>
              <div class="bar-track"><span :style="{ width: funnelWidth(report.embudo.creadas.cantidad) }" /></div>
            </article>
            <article class="funnel-step funnel-step--paid">
              <div class="funnel-copy">
                <span>Pagadas</span>
                <strong>{{ report.embudo.pagadas.cantidad }}</strong>
                <small>{{ formatMoney(report.embudo.pagadas.valor) }}</small>
              </div>
              <div class="bar-track"><span :style="{ width: funnelWidth(report.embudo.pagadas.cantidad) }" /></div>
            </article>
            <article class="funnel-step funnel-step--delivered">
              <div class="funnel-copy">
                <span>Entregadas</span>
                <strong>{{ report.embudo.entregadas.cantidad }}</strong>
                <small>{{ formatMoney(report.embudo.entregadas.valor) }}</small>
              </div>
              <div class="bar-track"><span :style="{ width: funnelWidth(report.embudo.entregadas.cantidad) }" /></div>
            </article>
          </div>
        </section>

        <section class="report-panel shipment-panel">
          <div class="panel-heading">
            <div>
              <span class="section-kicker">Margen logístico</span>
              <h3>Rentabilidad por envío</h3>
            </div>
          </div>
          <div v-if="report.envios.length" class="shipment-list">
            <article v-for="shipment in report.envios" :key="shipment._id || 'unknown'" class="shipment-row">
              <div class="shipment-title">
                <strong>{{ formatMode(shipment._id) }}</strong>
                <span>{{ shipment.total }} envíos</span>
              </div>
              <div class="shipment-values">
                <span>Cobrado <strong>{{ formatMoney(shipment.cobrado) }}</strong></span>
                <span>Costo <strong>{{ formatMoney(shipment.costo) }}</strong></span>
              </div>
              <div class="margin-pill" :class="{ 'is-negative': margin(shipment.cobrado, shipment.costo) < 0 }">
                {{ marginPercent(shipment.cobrado, shipment.costo) }}% · {{ formatMoney(margin(shipment.cobrado, shipment.costo)) }}
              </div>
            </article>
          </div>
          <p v-else class="empty-state">No hay envíos registrados en este periodo.</p>
        </section>
      </div>

      <section class="report-panel providers-panel">
        <div class="panel-heading">
          <div>
            <span class="section-kicker">Red operativa</span>
            <h3>Proveedores</h3>
          </div>
          <span class="panel-note">Ordenados por envíos realizados</span>
        </div>
        <div v-if="report.proveedores.length" class="provider-list">
          <article v-for="(provider, index) in report.proveedores" :key="provider._id || index" class="provider-row">
            <span class="provider-rank">{{ String(index + 1).padStart(2, '0') }}</span>
            <div class="provider-main">
              <div class="provider-copy">
                <strong>{{ provider._id || 'Proveedor sin nombre' }}</strong>
                <span>{{ provider.total }} envíos · {{ formatMoney(provider.cobrado) }} cobrado</span>
              </div>
              <div class="provider-bar"><span :style="{ width: providerWidth(provider.total) }" /></div>
            </div>
            <div class="provider-cost">
              <span>Costo</span>
              <strong>{{ formatMoney(provider.costo) }}</strong>
            </div>
          </article>
        </div>
        <p v-else class="empty-state">No hay actividad de proveedores en este periodo.</p>
      </section>
    </template>
  </main>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use '@/styles/mixins/responsive' as *;

$signal-purple: #956ee8;
$cream: $ink-100;

.report-page {
  display: flex;
  flex-direction: column;
  gap: $space-6;
  color: $cream;
}

.report-header,
.period-panel,
.metric-row,
.report-columns,
.panel-heading,
.date-controls,
.month-action,
.shipment-row,
.provider-row,
.provider-copy,
.shipment-values {
  display: flex;
}

.report-header {
  align-items: flex-end;
  justify-content: space-between;
  gap: $space-6;
}

.report-heading h2 {
  margin: $space-1 0 $space-2;
  font-size: clamp(2rem, 5vw, 3.6rem);
  line-height: 0.95;
  letter-spacing: -0.055em;
}

.report-heading p,
.empty-state {
  margin: 0;
  color: rgba($cream, 0.68);
}

.eyebrow,
.section-kicker {
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
}

.period-stamp span,
.period-stamp strong {
  display: block;
}

.period-stamp span,
.panel-note {
  color: rgba($cream, 0.62);
  font-size: 0.76rem;
}

.period-stamp strong {
  margin-top: $space-1;
}

.period-panel {
  align-items: flex-end;
  gap: $space-5;
  padding: $space-5;
  border: 1px solid rgba($brand-orange, 0.28);
  border-radius: $radius-lg;
  background: $ink-900;
}
.export-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: $space-2; }
.export-actions button { min-height: 40px; padding: 0 $space-4; border: 1px solid rgba($brand-orange, 0.45); border-radius: $radius-md; color: $cream; background: $ink-900; font-weight: 800; cursor: pointer; transition: transform 180ms ease, border-color 180ms ease; }
.export-actions button:hover:not(:disabled) { transform: translateY(-2px); border-color: $brand-orange; }
.export-actions button:disabled { opacity: 0.55; cursor: wait; }

.month-control,
.date-field {
  flex: 1 1 190px;
}

.month-control label,
.date-field > span {
  display: block;
  margin-bottom: $space-2;
  font-size: 0.78rem;
  font-weight: 700;
}

.month-action {
  gap: $space-2;
}

.month-action input,
.date-field input,
.month-action button,
.apply-button,
.error-banner button {
  min-height: 44px;
  border-radius: $radius-md;
  font: inherit;
}

.month-action input,
.date-field input {
  width: 100%;
  min-width: 0;
  flex: 1;
  padding: 0 $space-3;
  border: 1px solid rgba($cream, 0.24);
  color: $cream;
  color-scheme: dark;
  background: $ink-1000;
}

.month-action button,
.apply-button,
.error-banner button {
  border: 0;
  padding: 0 $space-4;
  color: $ink-1000;
  font-weight: 800;
  cursor: pointer;
  background: $brand-orange;
  transition: transform 180ms ease, background-color 180ms ease;
}

.month-action button:disabled,
.apply-button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.period-divider {
  align-self: center;
  color: rgba($cream, 0.46);
  font-size: 0.75rem;
  white-space: nowrap;
}

.date-controls {
  flex: 2 1 480px;
  align-items: flex-end;
  gap: $space-3;
}

.apply-button {
  flex: 0 0 auto;
  white-space: nowrap;
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
}

.error-banner button {
  min-height: 36px;
  color: $cream;
  background: $signal-red;
}

.metric-row,
.loading-cards {
  display: flex;
  flex-wrap: wrap;
  gap: $space-4;
}

.metric-card,
.skeleton-card {
  min-width: 210px;
  flex: 1 1 220px;
  min-height: 154px;
  padding: $space-5;
  border-radius: $radius-lg;
  background: $ink-900;
}

.metric-card {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba($cream, 0.12);
  transition: transform 180ms ease, border-color 180ms ease;
}

.metric-card::before {
  position: absolute;
  top: 0;
  right: 0;
  width: 56px;
  height: 4px;
  content: '';
  background: var(--metric-color);
}

.metric-card--income { --metric-color: #{$signal-green}; }
.metric-card--expense { --metric-color: #{$signal-red}; }
.metric-card--utility { --metric-color: #{$signal-blue}; }
.metric-card--cash { --metric-color: #{$signal-purple}; }

.metric-card > span,
.metric-card > small {
  color: rgba($cream, 0.64);
}

.metric-card > span {
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.metric-card > strong {
  display: block;
  margin: $space-4 0 $space-3;
  font-size: clamp(1.5rem, 3vw, 2.2rem);
  letter-spacing: -0.04em;
}

.metric-card > small {
  font-size: 0.73rem;
}

.skeleton-card {
  border: 1px solid rgba($brand-orange, 0.18);
  background: linear-gradient(105deg, $ink-900 30%, rgba($brand-orange, 0.16) 50%, $ink-900 70%);
  background-size: 220% 100%;
  animation: shimmer 1.4s linear infinite;
}

.report-columns {
  align-items: stretch;
  gap: $space-4;
}

.report-panel {
  padding: $space-6;
  border: 1px solid rgba($cream, 0.12);
  border-radius: $radius-lg;
  background: $ink-900;
}

.funnel-panel {
  flex: 0.9 1 420px;
}

.shipment-panel {
  flex: 1.1 1 520px;
}

.panel-heading {
  align-items: flex-start;
  justify-content: space-between;
  gap: $space-4;
  margin-bottom: $space-6;
}

.panel-heading h3 {
  margin: $space-1 0 0;
  font-size: 1.35rem;
}

.funnel-list,
.shipment-list,
.provider-list {
  display: flex;
  flex-direction: column;
}

.funnel-list,
.shipment-list {
  gap: $space-5;
}

.funnel-step {
  --step-color: #{$signal-blue};
}

.funnel-step--paid { --step-color: #{$signal-purple}; }
.funnel-step--delivered { --step-color: #{$signal-green}; }

.funnel-copy {
  display: flex;
  align-items: baseline;
  gap: $space-3;
  margin-bottom: $space-2;
}

.funnel-copy span {
  min-width: 78px;
  color: rgba($cream, 0.7);
}

.funnel-copy strong {
  font-size: 1.35rem;
}

.funnel-copy small {
  margin-left: auto;
  color: var(--step-color);
  font-weight: 700;
}

.bar-track,
.provider-bar {
  overflow: hidden;
  height: 6px;
  border-radius: $radius-pill;
  background: rgba($cream, 0.1);
}

.bar-track span,
.provider-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  transition: width 520ms cubic-bezier(0.22, 1, 0.36, 1);
}

.bar-track span {
  background: var(--step-color);
}

.shipment-row {
  align-items: center;
  gap: $space-4;
  padding-bottom: $space-4;
  border-bottom: 1px solid rgba($cream, 0.1);
}

.shipment-row:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.shipment-title {
  min-width: 128px;
  flex: 1 1 128px;
}

.shipment-title strong,
.shipment-title span,
.provider-cost span {
  display: block;
}

.shipment-title span,
.shipment-values span,
.provider-copy span,
.provider-cost span {
  color: rgba($cream, 0.62);
  font-size: 0.73rem;
}

.shipment-title span {
  margin-top: $space-1;
}

.shipment-values {
  flex: 2 1 220px;
  gap: $space-4;
}

.shipment-values span {
  flex: 1;
}

.shipment-values strong {
  display: block;
  margin-top: 2px;
  color: $cream;
}

.margin-pill {
  flex: 0 0 auto;
  padding: $space-2 $space-3;
  border-radius: $radius-pill;
  color: $signal-green;
  font-size: 0.72rem;
  font-weight: 800;
  background: rgba($signal-green, 0.12);
}

.margin-pill.is-negative {
  color: $signal-red;
  background: rgba($signal-red, 0.12);
}

.provider-list {
  gap: $space-2;
}

.provider-row {
  align-items: center;
  gap: $space-4;
  padding: $space-3 0;
}

.provider-rank {
  color: $brand-orange;
  font-size: 0.78rem;
  font-weight: 800;
}

.provider-main {
  min-width: 0;
  flex: 1;
}

.provider-copy {
  align-items: baseline;
  justify-content: space-between;
  gap: $space-3;
  margin-bottom: $space-2;
}

.provider-copy strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.provider-copy span {
  flex: 0 0 auto;
}

.provider-bar span {
  background: $brand-orange;
}

.provider-cost {
  min-width: 105px;
  text-align: right;
}

.provider-cost strong {
  display: block;
  margin-top: 2px;
}

@keyframes shimmer {
  to { background-position: -220% 0; }
}

@include hover-supported {
  .month-action button:hover,
  .apply-button:hover,
  .error-banner button:hover {
    transform: translateY(-2px);
    background: $brand-orange-soft;
  }

  .metric-card:hover {
    transform: translateY(-3px);
    border-color: var(--metric-color);
  }
}

@media (max-width: 960px) {
  .period-panel,
  .report-columns {
    flex-wrap: wrap;
  }

  .period-divider {
    display: none;
  }
}

@media (max-width: 680px) {
  .report-header,
  .date-controls,
  .shipment-row,
  .provider-copy {
    align-items: stretch;
    flex-direction: column;
  }

  .period-stamp {
    min-width: 0;
    width: 100%;
  }

  .period-panel,
  .report-panel {
    padding: $space-4;
  }

  .month-control,
  .date-controls,
  .date-field,
  .funnel-panel,
  .shipment-panel {
    flex-basis: 100%;
  }

  .apply-button {
    width: 100%;
  }

  .metric-card {
    min-width: min(100%, 210px);
  }

  .shipment-values {
    flex-basis: auto;
  }

  .margin-pill {
    align-self: flex-start;
  }

  .provider-row {
    align-items: flex-start;
  }

  .provider-copy span {
    flex: auto;
  }
}

@media (max-width: 420px) {
  .month-action,
  .error-banner {
    align-items: stretch;
    flex-direction: column;
  }

  .month-action button {
    width: 100%;
  }

  .provider-cost {
    min-width: 82px;
  }
}

@include reduced-motion {
  .skeleton-card {
    animation: none;
  }

  .metric-card,
  .month-action button,
  .apply-button,
  .export-actions button,
  .error-banner button,
  .bar-track span,
  .provider-bar span {
    transition: none;
  }
  .export-actions button:hover:not(:disabled) { transform: none; }
}

.presets {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;

  > span {
    font-size: 0.78rem;
    opacity: 0.7;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  button {
    min-height: 34px;
    padding: 0 0.9rem;
    border-radius: 999px;
    border: 1px solid rgba(245, 244, 241, 0.16);
    background: transparent;
    color: inherit;
    font: inherit;
    font-size: 0.82rem;
    cursor: pointer;
    transition: border-color 0.15s ease, background 0.15s ease;

    &:hover:not(:disabled) {
      border-color: rgba(240, 138, 31, 0.5);
      background: rgba(240, 138, 31, 0.1);
    }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  margin-bottom: 1.25rem;

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
