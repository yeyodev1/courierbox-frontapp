<script setup lang="ts">
import DashboardPanelShell from './DashboardPanelShell.vue'

defineProps<{
  totalGastos: number
  recentPayments: number
  totalFacturas: number
}>()

function formatCurrency(value: number) {
  return '$' + Number(value || 0).toFixed(2)
}
</script>

<template>
  <DashboardPanelShell title="Finanzas" subtitle="Costo acumulado" ariaLabel="Finanzas" :side="true">
    <div class="finance-box">
      <span class="finance-label">Gastos totales</span>
      <strong>{{ formatCurrency(totalGastos) }}</strong>
      <p>Este valor alimenta la vista general y coincide con el módulo de costos.</p>
    </div>
    <div class="mini-stack">
      <div class="mini-row">
        <span>Pagos recientes</span>
        <strong>{{ recentPayments }}</strong>
      </div>
      <div class="mini-row">
        <span>Facturas en conciliación</span>
        <strong>{{ totalFacturas }}</strong>
      </div>
    </div>
  </DashboardPanelShell>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.finance-box {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  padding: $space-5;
  min-height: 220px;
  border-radius: 16px;
  border: 1px solid rgba($ink-500, 0.12);
  background: linear-gradient(135deg, rgba($brand-orange, 0.12), rgba($ink-800, 0.25));
  align-items: center;
  text-align: center;
  justify-content: center;

  .finance-label {
    display: block;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: $brand-orange;
    font-weight: 700;
  }

  strong {
    display: block;
    font-size: 2rem;
    line-height: 1;
  }

  p {
    margin: 0;
    color: $ink-300;
    font-size: 0.86rem;
  }
}

.mini-stack {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.mini-row {
  display: flex;
  padding: $space-3 0;
  border-bottom: 1px solid rgba($ink-500, 0.08);
  align-items: center;
  justify-content: space-between;
  gap: $space-3;

  &:last-child { border-bottom: 0; }

  span { color: $ink-400; font-size: 0.85rem; }
  strong { font-size: 0.95rem; }
}
</style>
