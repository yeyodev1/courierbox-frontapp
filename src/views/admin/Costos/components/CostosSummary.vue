<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  resumenSeguro: { type: Object, required: true }
})

const maxMes = computed(() => Math.max(1, ...(props.resumenSeguro?.porMes || []).map((m: any) => Number(m.total || 0))))
const maxCategoria = computed(() => Math.max(1, ...(props.resumenSeguro?.porCategoria || []).map((m: any) => Number(m.total || 0))))
const maxProveedor = computed(() => Math.max(1, ...(props.resumenSeguro?.porProveedor || []).map((m: any) => Number(m.total || 0))))

function formatMoney(n: number) {
  return '$' + Number(n || 0).toFixed(2)
}

function formatMonth(key: string) {
  const [yearRaw, monthRaw] = String(key || '').split('-')
  const year = Number(yearRaw)
  const month = Number(monthRaw)
  if (!year || !month) return key
  return new Date(year, month - 1, 1).toLocaleDateString('es-EC', { month: 'short', year: 'numeric' })
}
</script>

<template>
  <div class="summary-container">
    <section class="summary-grid">
      <article class="summary-card accent">
        <span>Total gastado</span>
        <strong>{{ formatMoney(resumenSeguro.total.total) }}</strong>
        <small>{{ resumenSeguro.total.facturas }} facturas · {{ Number(resumenSeguro.total.libras || 0).toFixed(2) }} lbs</small>
      </article>
      <article class="summary-card">
        <span>Top categoría</span>
        <strong>{{ resumenSeguro.porCategoria[0]?._id || 'N/A' }}</strong>
        <small>{{ formatMoney(resumenSeguro.porCategoria[0]?.total || 0) }}</small>
      </article>
      <article class="summary-card">
        <span>Top proveedor</span>
        <strong>{{ resumenSeguro.porProveedor[0]?._id || 'N/A' }}</strong>
        <small>{{ formatMoney(resumenSeguro.porProveedor[0]?.total || 0) }}</small>
      </article>
    </section>

    <section class="insights-grid">
      <article class="insight-card">
        <h3>Gasto mes a mes</h3>
        <div class="bar-list">
          <div v-for="m in resumenSeguro.porMes" :key="m._id" class="bar-row">
            <span>{{ formatMonth(m._id) }}</span>
            <div class="bar-track"><div class="bar-fill" :style="{ width: `${(Number(m.total || 0) / maxMes) * 100}%` }"></div></div>
            <strong>{{ formatMoney(m.total) }}</strong>
          </div>
        </div>
      </article>
      <article class="insight-card">
        <h3>Por categoría</h3>
        <div class="bar-list compact">
          <div v-for="c in resumenSeguro.porCategoria.slice(0, 6)" :key="c._id" class="bar-row">
            <span>{{ c._id }}</span>
            <div class="bar-track"><div class="bar-fill category" :style="{ width: `${(Number(c.total || 0) / maxCategoria) * 100}%` }"></div></div>
            <strong>{{ formatMoney(c.total) }}</strong>
          </div>
        </div>
      </article>
      <article class="insight-card">
        <h3>Por proveedor</h3>
        <div class="bar-list compact">
          <div v-for="p in resumenSeguro.porProveedor.slice(0, 6)" :key="p._id" class="bar-row">
            <span>{{ p._id }}</span>
            <div class="bar-track"><div class="bar-fill provider" :style="{ width: `${(Number(p.total || 0) / maxProveedor) * 100}%` }"></div></div>
            <strong>{{ formatMoney(p.total) }}</strong>
          </div>
        </div>
      </article>
    </section>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.summary-container {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: $space-4;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: 640px) {
    grid-auto-flow: column;
    grid-auto-columns: minmax(220px, 82%);
    grid-template-columns: unset;
    overflow-x: auto;
    padding-bottom: $space-1;
    scroll-snap-type: x proximity;
  }
}

.summary-card,
.insight-card {
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.12);
  border-radius: 18px;
  padding: $space-5;

  @media (max-width: 640px) {
    scroll-snap-align: start;
    padding: $space-4;
  }
}

.summary-card {
  span {
    color: $ink-400;
    font-size: 0.8rem;
  }

  strong {
    display: block;
    margin-top: $space-2;
    font-size: 1.6rem;
    color: $fg-dark;
  }

  small {
    color: $ink-400;
  }

  &.accent {
    background: linear-gradient(180deg, rgba($brand-orange, 0.15), rgba($ink-900, 0.95));
    border-color: rgba($brand-orange, 0.2);

    strong {
      color: $brand-orange;
    }
  }
}

.insights-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: $space-4;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: 640px) {
    grid-auto-flow: column;
    grid-auto-columns: minmax(240px, 86%);
    grid-template-columns: unset;
    overflow-x: auto;
    padding-bottom: $space-1;
    scroll-snap-type: x proximity;
  }
}

.insight-card h3 {
  margin: 0 0 $space-4;
  font-size: 1rem;
}

.bar-list {
  display: flex;
  flex-direction: column;
  gap: $space-3;

  &.compact .bar-row span {
    max-width: 140px;
  }
}

.bar-row {
  display: grid;
  grid-template-columns: 120px 1fr auto;
  align-items: center;
  gap: $space-3;

  span {
    color: $ink-300;
    font-size: 0.8rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    font-size: 0.82rem;
    color: $fg-dark;
  }
}

.bar-track {
  height: 10px;
  border-radius: 999px;
  background: rgba($ink-700, 0.75);
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, $brand-orange, lighten($brand-orange, 12%));

  &.category {
    background: linear-gradient(90deg, #7c9cff, #9cb3ff);
  }

  &.provider {
    background: linear-gradient(90deg, #7fd8c7, #9ae6b4);
  }
}
</style>
