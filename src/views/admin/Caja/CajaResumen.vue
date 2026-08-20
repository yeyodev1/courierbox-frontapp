<script setup lang="ts">
/** Income / expense / balance headline plus the per-category breakdown. */
import { computed } from 'vue'
import type { CajaResumen } from '../caja.utils'
import { formatMoney } from '../caja.utils'
import { isIngresoCategoria } from './useCaja'

const props = defineProps<{
  resumen: {
    ingresos: { total: number; count: number }
    egresos: { total: number; count: number }
    saldo: number
    porCategoria: CajaResumen['porCategoria']
  }
}>()

const maxCategoria = computed(() =>
  Math.max(...props.resumen.porCategoria.map((item) => Number(item.total || 0)), 0),
)

function barWidth(total: unknown) {
  if (!maxCategoria.value) return '0%'
  return `${(Number(total || 0) / maxCategoria.value) * 100}%`
}
</script>

<template>
  <div class="stats-grid">
    <article class="stat-card accent">
      <span>Ingresos</span>
      <strong>{{ formatMoney(resumen.ingresos.total) }}</strong>
      <small>{{ resumen.ingresos.count }} movimientos</small>
    </article>
    <article class="stat-card danger">
      <span>Egresos</span>
      <strong>{{ formatMoney(resumen.egresos.total) }}</strong>
      <small>{{ resumen.egresos.count }} movimientos</small>
    </article>
    <article class="stat-card balance">
      <span>Saldo</span>
      <strong>{{ formatMoney(resumen.saldo) }}</strong>
      <small>Ingresos - egresos</small>
    </article>
  </div>

  <section class="panel">
    <div class="section-head">
      <h3>Desglose por categoría</h3>
      <p>Visualiza dónde se concentra el dinero dentro del periodo seleccionado.</p>
    </div>

    <div v-if="resumen.porCategoria.length" class="breakdown-list">
      <article v-for="row in resumen.porCategoria" :key="row._id" class="breakdown-row">
        <div class="breakdown-meta">
          <strong>{{ row._id }}</strong>
          <span>{{ row.count }} movimientos</span>
        </div>
        <div class="breakdown-bar-wrap">
          <div
            class="breakdown-bar"
            :class="isIngresoCategoria(row._id) ? 'is-income' : 'is-expense'"
            :style="{ width: barWidth(row.total) }"
          />
        </div>
        <div class="breakdown-value"><strong>{{ formatMoney(row.total) }}</strong></div>
      </article>
    </div>

    <div v-else class="empty-state compact">
      <i class="fa-solid fa-chart-column" />
      <div>
        <strong>Sin movimientos en este periodo</strong>
        <p>Cuando registres movimientos aparecerá el desglose aquí.</p>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use './caja-ui' as ui;

@include ui.panel;
@include ui.empty-state;

.stats-grid {
  display: grid;
  gap: $space-4;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  margin-bottom: $space-6;
}

.stat-card {
  background: rgba($ink-900, 0.72);
  border: 1px solid rgba($ink-500, 0.12);
  border-radius: 20px;
  padding: $space-5;

  span { color: $ink-400; }
  strong { display: block; font-size: 1.8rem; margin: $space-2 0; }

  &.accent strong { color: $brand-orange; }
  &.danger strong { color: #ff8a8f; }
  &.balance strong { color: #9ae6b4; }
}

.breakdown-list { display: grid; gap: $space-4; }

.breakdown-row {
  display: grid;
  grid-template-columns: 180px 1fr 120px;
  gap: $space-4;
  align-items: center;

  @media (max-width: 640px) { grid-template-columns: 1fr; }
}

.breakdown-meta {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;

  span { color: $ink-400; font-size: 0.8rem; }
}

.breakdown-bar-wrap {
  height: 12px;
  border-radius: 999px;
  background: rgba($ink-700, 0.65);
  overflow: hidden;
}

.breakdown-bar {
  height: 100%;
  border-radius: 999px;

  &.is-income { background: linear-gradient(90deg, rgba(#2bbb92, 0.75), #2bbb92); }
  &.is-expense { background: linear-gradient(90deg, rgba(#e5484d, 0.75), #e5484d); }
}

.breakdown-value {
  text-align: right;

  @media (max-width: 640px) { text-align: left; }
}
</style>
