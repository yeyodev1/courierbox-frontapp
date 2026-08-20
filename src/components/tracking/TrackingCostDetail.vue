<script setup lang="ts">
/** Indicative charge breakdown. The asesor confirms the final tariff. */
import type { TrackingResult } from '@/services/tracking'

defineProps<{ costo: NonNullable<TrackingResult['costo']> }>()
</script>

<template>
  <section class="cost">
    <div class="cost__head">
      <span class="cost__eyebrow">Cobro estimado</span>
      <span class="cost__disclaimer">Valor referencial</span>
    </div>

    <div class="cost__rows">
      <div class="cost__row">
        <span>Peso</span>
        <strong>{{ costo.pesoLb }} lb</strong>
      </div>
      <div class="cost__row">
        <span>Flete <em>($5.99 / lb)</em></span>
        <strong>${{ costo.flete.toFixed(2) }}</strong>
      </div>
      <div class="cost__row">
        <span>Arancel <em>($2.50 / lb)</em></span>
        <strong>${{ costo.arancel.toFixed(2) }}</strong>
      </div>
      <div class="cost__row cost__row--total">
        <span>Total</span>
        <strong>${{ costo.total.toFixed(2) }}</strong>
      </div>
      <p class="cost__legal">
        Precio sujeto a la tarifa proporcional proporcionada por tu asesor.
        <span>Cálculo referencial: la tarifa definitiva la confirma tu asesor.</span>
      </p>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;

.cost {
  margin-inline: clamp(1.25rem, 3vw, 1.5rem);
  margin-top: -1rem;
  background:
    linear-gradient(140deg, rgba($brand-orange, 0.14), transparent 70%),
    var(--surface);
  border: 1px solid rgba($brand-orange, 0.3);
  border-radius: 24px;
  padding: clamp(1.25rem, 3vw, 2rem);
  position: relative;
  z-index: 2;
  min-width: 0;

  &__head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px dashed rgba($brand-orange, 0.3);
  }

  &__eyebrow {
    font-size: 0.7rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: $brand-orange;
    font-weight: 600;
  }

  &__disclaimer {
    font-size: 0.75rem;
    color: var(--fg-faint);
    font-style: italic;
  }

  &__rows { display: grid; gap: 0.5rem; }

  &__row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 1rem;
    padding-block: 0.5rem;
    color: var(--fg-muted);
    flex-wrap: wrap;
    min-width: 0;

    span em {
      font-style: normal;
      color: var(--fg-faint);
      font-size: 0.85em;
      margin-left: 0.35rem;
    }

    strong {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 500;
      color: var(--fg);
    }

    &--total {
      margin-top: 0.5rem;
      padding-top: 1rem;
      border-top: 1px solid rgba($brand-orange, 0.3);

      span {
        color: var(--fg);
        font-weight: 600;
        font-size: 1rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      strong {
        font-family: 'Fraunces', serif;
        font-weight: 500;
        font-size: clamp(1.5rem, 3vw, 2rem);
        color: $brand-orange;
        letter-spacing: -0.02em;
      }
    }
  }

  &__legal {
    margin: 0.75rem 0 0;
    padding-top: 0.65rem;
    border-top: 1px dashed rgba($brand-orange, 0.25);
    color: var(--fg);
    font-size: 0.78rem;
    font-style: italic;
    line-height: 1.5;
    display: grid;
    gap: 0.25rem;

    span {
      color: var(--fg-faint);
      font-style: normal;
      font-size: 0.7rem;
    }
  }
}
</style>
