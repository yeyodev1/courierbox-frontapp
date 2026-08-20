<script setup lang="ts">
/** Line-by-line estimate for the selected lane and weight. */
import { fmt, type RateConfig } from './quote-rates'

defineProps<{
  rate: RateConfig
  calc: { weight: number; importeBase: number; iva: number; importe: number; arancel: number; total: number }
  totalLabel: string
}>()
</script>

<template>
  <div class="breakdown">
    <div class="breakdown__row">
      <span>Peso</span>
      <strong>{{ calc.weight }} lb</strong>
    </div>

    <div class="breakdown__row">
      <span>Importación <em>(${{ rate.importPerLb.toFixed(2) }} × {{ calc.weight }})</em></span>
      <strong>{{ fmt(calc.importeBase) }}</strong>
    </div>

    <template v-if="rate.importApplyIva">
      <div class="breakdown__row">
        <span>IVA ({{ (rate.ivaRate * 100).toFixed(0) }}%)</span>
        <strong>{{ fmt(calc.iva) }}</strong>
      </div>
      <div class="breakdown__row">
        <span>Importación total</span>
        <strong>{{ fmt(calc.importe) }}</strong>
      </div>
    </template>

    <div v-if="rate.arancelPerLb > 0" class="breakdown__row">
      <span>Arancel <em>(${{ rate.arancelPerLb.toFixed(2) }} × {{ calc.weight }})</em></span>
      <strong>{{ fmt(calc.arancel) }}</strong>
    </div>

    <div class="breakdown__row breakdown__row--total">
      <span>{{ totalLabel }}</span>
      <strong>{{ fmt(calc.total) }}</strong>
    </div>

    <p class="breakdown__legal">
      Precio sujeto a la tarifa proporcional proporcionada por tu asesor.
      <span>Cálculo referencial: la tarifa definitiva depende de la interacción directa con tu asesor.</span>
    </p>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;

.breakdown {
  display: grid;
  gap: 0.5rem;
  padding: 1.25rem;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--surface);
  min-width: 0;

  &__legal {
    margin: 0.5rem 0 0;
    padding-top: 0.65rem;
    border-top: 1px dashed var(--border);
    color: var(--fg);
    font-size: 0.78rem;
    font-style: italic;
    line-height: 1.5;
    letter-spacing: 0.01em;
    display: grid;
    gap: 0.25rem;

    span {
      color: var(--fg-faint);
      font-style: normal;
      font-size: 0.7rem;
      letter-spacing: 0.02em;
    }
  }

  &__row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 1rem;
    flex-wrap: wrap;
    color: var(--fg-muted);
    padding-block: 0.4rem;

    span em {
      font-style: normal;
      color: var(--fg-faint);
      font-size: 0.85em;
      margin-left: 0.35rem;
    }

    strong {
      font-family: 'JetBrains Mono', monospace;
      color: var(--fg);
      font-weight: 500;
    }

    &--total {
      margin-top: 0.5rem;
      padding-top: 0.85rem;
      border-top: 1px solid rgba($brand-orange, 0.35);

      span {
        color: var(--fg);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      strong {
        font-family: 'Fraunces', serif;
        font-weight: 500;
        font-size: clamp(1.5rem, 3vw, 2rem);
        color: $brand-orange;
      }
    }
  }
}
</style>
