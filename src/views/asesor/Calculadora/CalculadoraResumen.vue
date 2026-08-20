<script setup lang="ts">
/** Fee breakdown for the quoted purchase. */
import type { FeeCalculationResult } from '@/services/asesoria.api'

defineProps<{ result: FeeCalculationResult | null }>()
</script>

<template>
  <section class="card result-card" :class="{ 'has-result': result }">
    <h3 class="card-title">Resumen</h3>

    <div v-if="result" class="result-body">
      <div class="result-row">
        <span>Valor producto + envío</span>
        <strong>${{ result.baseAmount.toFixed(2) }}</strong>
      </div>
      <div class="result-row highlight">
        <span>Fee de gestión</span>
        <strong>${{ result.feeAmount.toFixed(2) }}</strong>
      </div>
      <div class="result-row breakdown"><span>{{ result.breakdown }}</span></div>
      <div class="result-divider" />
      <div class="result-row total">
        <span>Total a pagar</span>
        <strong>${{ result.totalAmount.toFixed(2) }}</strong>
      </div>
      <div class="result-config">
        Tarifa: <strong>{{ result.configName }}</strong> ({{ result.ruleType }})
      </div>
    </div>

    <div v-else class="result-placeholder">
      <i class="fa-solid fa-receipt" />
      <p>Ingresa los valores para ver el cálculo</p>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.card {
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.12);
  border-radius: 20px;
  padding: $space-6;
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 $space-5;
}

.result-card.has-result { border-color: rgba($brand-orange, 0.2); }

.result-body {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.result-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.95rem;
  color: $ink-300;

  strong { color: $fg-dark; font-weight: 600; }

  &.highlight {
    background: rgba($brand-orange, 0.08);
    padding: $space-3 $space-4;
    border-radius: 12px;
    color: $brand-orange;

    strong { color: $brand-orange; font-size: 1.1rem; }
  }

  &.breakdown {
    font-size: 0.8rem;
    color: $ink-400;
    font-style: italic;
  }

  &.total {
    font-size: 1.1rem;
    font-weight: 700;
    color: $fg-dark;

    strong { font-size: 1.4rem; color: $brand-orange; }
  }
}

.result-divider {
  height: 1px;
  background: rgba($ink-500, 0.15);
  margin: $space-2 0;
}

.result-config {
  font-size: 0.8rem;
  color: $ink-400;
  text-align: center;
  margin-top: $space-2;
}

.result-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $space-3;
  padding: $space-10 0;
  color: $ink-500;

  i { font-size: 2.5rem; opacity: 0.5; }
  p { margin: 0; font-size: 0.95rem; }
}
</style>
