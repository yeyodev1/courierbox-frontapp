<script setup lang="ts">
import DashboardPanelShell from './DashboardPanelShell.vue'
import { formatCount, formatCurrency as fmtCurrency } from '@/utils/format'

// Nullable on purpose — see AdminDashboardFinancePanel.
interface Props {
  totalGestiones: number | null
  valorTotal: number | null
  comision: number | null
  costoVenta: number | null
  margenNeto: number | null
}

defineProps<Props>()
const emit = defineEmits<{ navigate: [] }>()
</script>

<template>
  <DashboardPanelShell title="Gestiones de Compra" subtitle="Resumen mensual del módulo" ariaLabel="Gestiones de compra">
    <div class="gc-panel">
      <div class="gc-metric primary">
        <span class="gc-label">Gestiones del mes</span>
        <span class="gc-value">{{ formatCount(totalGestiones) }}</span>
        <span class="gc-note">operaciones registradas</span>
      </div>

      <div class="gc-breakdown">
        <div class="gc-row">
          <span class="gc-row-label">Valor total (lo que paga el cliente)</span>
          <span class="gc-row-value">{{ fmtCurrency(valorTotal) }}</span>
        </div>
        <div class="gc-row">
          <span class="gc-row-label">Comisión incluida</span>
          <span class="gc-row-value negative">− {{ fmtCurrency(comision) }}</span>
        </div>
        <div class="gc-row">
          <span class="gc-row-label">Costo de venta</span>
          <span class="gc-row-value negative">− {{ fmtCurrency(costoVenta) }}</span>
        </div>
        <div class="gc-divider" />
        <div class="gc-row highlight">
          <span class="gc-row-label">Margen neto de la operación</span>
          <span class="gc-row-value positive">{{ fmtCurrency(margenNeto) }}</span>
        </div>
      </div>

      <button class="gc-action" @click="emit('navigate')">
        <span>Ver gestiones de compra</span>
        <i class="fa-solid fa-arrow-right" aria-hidden="true" />
      </button>
    </div>
  </DashboardPanelShell>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.gc-panel {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.gc-metric.primary {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: $space-4;
  border-radius: 12px;
  background: rgba($brand-orange, 0.08);
  border: 1px solid rgba($brand-orange, 0.2);
}

.gc-label {
  font-size: 0.72rem;
  color: $ink-300;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 700;
}

.gc-value {
  font-size: 2rem;
  font-weight: 800;
  color: $brand-orange;
  line-height: 1.1;
  margin-top: $space-1;
}

.gc-note {
  font-size: 0.78rem;
  color: $ink-500;
  margin-top: 2px;
}

.gc-breakdown {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  background: rgba($ink-900, 0.4);
  border: 1px solid rgba($ink-500, 0.12);
  border-radius: 12px;
  padding: $space-4;
}

.gc-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: $space-3;

  &.highlight {
    margin-top: $space-1;
    .gc-row-label { font-weight: 700; color: $fg-dark; }
    .gc-row-value { font-weight: 800; color: $signal-green; }
  }
}

.gc-row-label {
  font-size: 0.82rem;
  color: $ink-300;
  line-height: 1.3;
}

.gc-row-value {
  font-size: 0.95rem;
  font-weight: 700;
  color: $fg-dark;
  white-space: nowrap;

  &.negative { color: $brand-orange; }
  &.positive { color: $signal-green; }
}

.gc-divider {
  height: 1px;
  background: rgba($ink-500, 0.2);
  margin: $space-1 0;
}

.gc-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: $space-3 $space-4;
  background: rgba($ink-800, 0.5);
  border: 1px solid rgba($ink-500, 0.2);
  border-radius: 10px;
  color: $fg-dark;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;

  &:hover {
    background: rgba($ink-700, 0.6);
    border-color: rgba($brand-orange, 0.35);
  }

  i {
    font-size: 0.8rem;
    color: $brand-orange;
  }
}
</style>
