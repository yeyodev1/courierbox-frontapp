<script setup lang="ts">
import DashboardPanelShell from './DashboardPanelShell.vue'

interface KpiCard {
  label: string
  value: string
  detail: string
  icon: string
  tone: 'purple' | 'orange' | 'green' | 'blue' | 'teal' | 'red'
}

defineProps<{ cards: KpiCard[] }>()
</script>

<template>
  <DashboardPanelShell title="Resumen visual" subtitle="Comparativa operativa" ariaLabel="Resumen visual" :main="true">
    <div class="kpi-strip">
      <article v-for="card in cards" :key="card.label" class="stat-card" :aria-label="card.label">
        <div class="stat-icon" :class="card.tone"><i class="fa-solid" :class="card.icon" aria-hidden="true" /></div>
        <div class="stat-info">
          <span class="stat-value">{{ card.value }}</span>
          <span class="stat-label">{{ card.label }}</span>
          <small class="stat-note">{{ card.detail }}</small>
        </div>
      </article>
    </div>
  </DashboardPanelShell>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.kpi-strip {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;
  justify-content: center;
}

.stat-card {
  display: flex;
  flex: 1 1 200px;
  min-width: 0;
  border-radius: 14px;
  padding: $space-3;
  border: 1px solid rgba($ink-500, 0.12);
  background: rgba($ink-800, 0.45);
  flex-direction: column;
  gap: $space-3;
  align-items: center;
  justify-content: center;
  text-align: center;

  .stat-icon {
    display: flex;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    font-size: 1rem;

    &.purple { background: rgba($signal-blue, 0.12); color: #6db6ff; }
    &.orange { background: rgba($brand-orange, 0.12); color: $brand-orange; }
    &.green { background: rgba($signal-green, 0.12); color: $signal-green; }
    &.blue { background: rgba($signal-blue, 0.12); color: #60a5fa; }
    &.teal { background: rgba(#14b8a6, 0.12); color: #5eead4; }
    &.red { background: rgba($signal-red, 0.12); color: #ff8a8f; }
  }

  .stat-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    align-items: center;
    justify-content: center;

    .stat-value { font-size: 1.45rem; font-weight: 800; line-height: 1.05; }
    .stat-label { font-size: 0.82rem; color: $ink-300; }
    .stat-note { font-size: 0.72rem; color: $ink-500; }
  }
}
</style>
