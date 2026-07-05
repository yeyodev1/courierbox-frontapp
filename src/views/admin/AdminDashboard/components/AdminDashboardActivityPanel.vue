<script setup lang="ts">
import DashboardPanelShell from './DashboardPanelShell.vue'

interface OperationalBar {
  label: string
  value: number
  tone: 'purple' | 'orange' | 'green' | 'blue' | 'teal'
  width: number
}

defineProps<{ bars: OperationalBar[] }>()
</script>

<template>
  <DashboardPanelShell title="Actividad operativa" subtitle="Barras comparativas" ariaLabel="Actividad operativa" :main="true">
    <div class="chart-list">
      <div v-for="item in bars" :key="item.label" class="chart-row" :class="{ 'is-zero': item.value <= 0 }">
        <div class="chart-row-head">
          <span>{{ item.label }}</span>
          <strong>{{ item.value.toLocaleString('es-EC') }}</strong>
        </div>
        <div v-if="item.value > 0" class="chart-track">
          <div class="chart-bar" :class="item.tone" :style="{ width: `${item.width}%` }" />
        </div>
        <div v-else class="chart-zero">Sin actividad</div>
      </div>
    </div>
  </DashboardPanelShell>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.chart-list {
  display: flex;
  flex-direction: column;
  gap: $space-4;
  width: 100%;
}

.chart-row {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  width: 100%;

  &.is-zero .chart-row-head strong {
    color: $ink-500;
  }
}

.chart-row-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: $space-3;

  strong {
    min-width: 3rem;
    text-align: right;
  }
}

.chart-track {
  align-items: center;
  width: 100%;
  height: 12px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba($ink-700, 0.75);
}

.chart-zero {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 12px;
  border-radius: 999px;
  color: $ink-500;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  border: 1px dashed rgba($ink-500, 0.16);
  background: rgba($ink-800, 0.22);
}

.chart-bar {
  height: 100%;
  border-radius: 999px;

  &.purple { background: linear-gradient(90deg, rgba(#6db6ff, 0.65), #6db6ff); }
  &.orange { background: linear-gradient(90deg, rgba($brand-orange, 0.55), $brand-orange); }
  &.green { background: linear-gradient(90deg, rgba($signal-green, 0.55), $signal-green); }
  &.blue { background: linear-gradient(90deg, rgba(#60a5fa, 0.55), #60a5fa); }
  &.teal { background: linear-gradient(90deg, rgba(#5eead4, 0.55), #5eead4); }
}
</style>
