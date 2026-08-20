<script setup lang="ts">
/** Public shipping-cost calculator for the USA and Spain lanes. */
import { computed } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import CtaFinal from '@/components/sections/CtaFinal.vue'
import { useGsapReveal } from '@/composables/useGsapReveal'
import { whatsappUrl } from '@/config/contact'
import QuoteRouteTabs from './Quote/QuoteRouteTabs.vue'
import QuoteBreakdown from './Quote/QuoteBreakdown.vue'
import { fmt, useQuote } from './Quote/quote-rates'

useGsapReveal()

const { origin, lb, rate, calc, totalLabel } = useQuote()

const waLink = computed(() =>
  whatsappUrl(
    `Hola Courier Box, quiero cotizar un envío.\nRuta: ${rate.value.title}\nPeso: ${calc.value.weight} lb\n` +
      `Importe: ${fmt(calc.value.importe)}\nArancel: ${fmt(calc.value.arancel)}\n` +
      `Total estimado: ${fmt(calc.value.total)}`,
  ),
)
</script>

<template>
  <main class="quote">
    <section class="quote__hero container">
      <span class="eyebrow" data-reveal>Cotizador</span>
      <h1 class="quote__title" data-reveal data-reveal-group>
        Calcula tu envío. <em>USA y España</em> hacia Ecuador.
      </h1>
      <p class="quote__lead" data-reveal>
        Traemos tus compras desde Estados Unidos y España. Selecciona la ruta,
        indica el peso y obtén una estimación en segundos. Sin trámites, sin
        casilleros extraños.
      </p>
    </section>

    <section class="quote__panel container" data-reveal-group>
      <QuoteRouteTabs v-model="origin" />

      <div class="card" data-reveal>
        <header class="card__head">
          <div>
            <span class="card__eyebrow">Ruta seleccionada</span>
            <h2>{{ rate.title }}</h2>
            <p>{{ rate.timeframe }}</p>
          </div>
          <span class="card__ref" aria-label="Cálculo referencial">
            <span class="card__ref-dot" aria-hidden="true" />
            Cálculo referencial
          </span>
        </header>

        <div class="card__body">
          <div class="input-row">
            <AppInput v-model="lb" label="Peso en libras (lb)" type="number" inputmode="numeric" placeholder="Ej. 2" />
            <div class="hint">
              <span>Importación</span>
              <strong>
                ${{ rate.importPerLb.toFixed(2) }} / lb
                <em v-if="rate.importApplyIva">+ IVA ({{ (rate.ivaRate * 100).toFixed(0) }}%)</em>
              </strong>
              <template v-if="rate.arancelPerLb > 0">
                <span>Arancel</span>
                <strong>${{ rate.arancelPerLb.toFixed(2) }} / lb</strong>
              </template>
              <template v-else>
                <span>Tarifa</span>
                <strong>Neta · sin cargos adicionales</strong>
              </template>
            </div>
          </div>

          <QuoteBreakdown :rate="rate" :calc="calc" :total-label="totalLabel" />

          <div class="card__actions">
            <AppButton as="a" :href="waLink" target="_blank" rel="noopener" variant="primary" size="lg">
              Confirmar por WhatsApp
            </AppButton>
            <AppButton as="router-link" to="/contacto" variant="outline" size="lg">
              Ver direcciones de bodega
            </AppButton>
          </div>
        </div>

        <footer class="card__foot">
          <h3>Ejemplo · 2 libras</h3>
          <p v-if="rate.arancelPerLb > 0">
            Peso 2 lb → Importación {{ fmt(rate.example.importe) }}
            + Arancel {{ fmt(rate.example.arancel) }}
            = <strong>{{ fmt(rate.example.total) }}</strong>
          </p>
          <p v-else>
            Peso 2 lb · tarifa final <strong>{{ fmt(rate.example.total) }}</strong>
            (sin aranceles ni cargos adicionales).
          </p>
          <ul>
            <li v-for="n in rate.notes" :key="n">{{ n }}</li>
          </ul>
        </footer>
      </div>
    </section>

    <CtaFinal />
  </main>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/mixins/typography' as *;
@use '@/styles/mixins/responsive' as *;

.quote {
  &__hero {
    padding-top: clamp(7rem, 12vw, 10rem);
    padding-bottom: clamp(1.5rem, 4vw, 3rem);
    display: grid;
    gap: 1rem;
    max-width: 1200px;
  }

  &__title {
    @include display-lg;

    em { font-style: italic; color: $brand-orange; font-weight: 400; }
  }

  &__lead {
    color: var(--fg-muted);
    max-width: 60ch;
    font-size: clamp(1rem, 1.3vw, 1.125rem);
    line-height: 1.6;
  }

  &__panel {
    padding-block: clamp(2rem, 5vw, 4rem);
    display: grid;
    gap: clamp(1.5rem, 3vw, 2rem);
  }
}

.card {
  border: 1px solid var(--border);
  border-radius: 24px;
  background:
    radial-gradient(120% 80% at 100% 0%, rgba($brand-orange, 0.1), transparent 55%),
    var(--surface-2);
  overflow: hidden;
  min-width: 0;

  &__head {
    padding: clamp(1.5rem, 3vw, 2rem);
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    flex-wrap: wrap;

    > div { display: grid; gap: 0.35rem; min-width: 0; }

    h2 {
      font-family: 'Fraunces', serif;
      font-weight: 500;
      font-size: clamp(1.5rem, 3vw, 2rem);
      letter-spacing: -0.02em;
      color: var(--fg);
    }

    p { color: var(--fg-muted); font-size: 0.9rem; }
  }

  &__ref {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.4rem 0.75rem;
    border-radius: 999px;
    background: rgba($brand-orange, 0.1);
    border: 1px solid rgba($brand-orange, 0.4);
    color: $brand-orange;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    flex-shrink: 0;
  }

  &__ref-dot {
    width: 7px;
    height: 7px;
    border-radius: 999px;
    background: $brand-orange;
    box-shadow: 0 0 0 4px rgba($brand-orange, 0.18);
    animation: refPulse 2.4s ease-in-out infinite;
  }

  &__eyebrow {
    font-size: 0.7rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--fg-faint);
  }

  &__body {
    padding: clamp(1.5rem, 3vw, 2rem);
    display: grid;
    gap: 1.5rem;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  &__foot {
    padding: clamp(1.25rem, 3vw, 1.75rem);
    border-top: 1px solid var(--border);
    background: var(--surface);
    display: grid;
    gap: 0.65rem;

    h3 {
      font-size: 0.78rem;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--fg-faint);
    }

    p {
      color: var(--fg-muted);
      strong { color: $brand-orange; }
    }

    ul {
      display: grid;
      gap: 0.35rem;
      padding-left: 0;
      list-style: none;

      li {
        position: relative;
        padding-left: 1.25rem;
        color: var(--fg-muted);
        font-size: 0.9rem;

        &::before { content: '→'; position: absolute; left: 0; color: $brand-orange; }
      }
    }
  }
}

.input-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  align-items: end;

  @include md { grid-template-columns: 1fr 1fr; }
}

.hint {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.4rem 1rem;
  align-items: baseline;
  padding: 0.85rem 1rem;
  border: 1px dashed var(--border);
  border-radius: 12px;
  background: var(--surface);
  color: var(--fg-muted);
  font-size: 0.85rem;

  strong {
    color: var(--fg);
    font-family: 'JetBrains Mono', monospace;
    font-weight: 500;

    em {
      font-style: normal;
      color: $brand-orange;
      margin-left: 0.35rem;
      font-size: 0.85em;
    }
  }
}

@keyframes refPulse {
  0%,
  100% { box-shadow: 0 0 0 4px rgba($brand-orange, 0.18); }
  50% { box-shadow: 0 0 0 7px rgba($brand-orange, 0.08); }
}

@media (prefers-reduced-motion: reduce) {
  .card__ref-dot { animation: none; }
}
</style>
