<script setup lang="ts">
import { computed, ref } from "vue";
import AppButton from "@/components/ui/AppButton.vue";
import AppInput from "@/components/ui/AppInput.vue";
import CtaFinal from "@/components/sections/CtaFinal.vue";
import { useGsapReveal } from "@/composables/useGsapReveal";
import { whatsappUrl } from "@/config/contact";

useGsapReveal();

type Origin = "esp" | "usa-std" | "usa-exp";

interface RateConfig {
  id: Origin;
  flag: string;
  title: string;
  badge: string;
  timeframe: string;
  importPerLb: number;
  importApplyIva: boolean;
  arancelPerLb: number;
  ivaRate: number;
  example: { lb: number; importe: number; arancel: number; total: number };
  notes: string[];
}

const RATES: Record<Origin, RateConfig> = {
  esp: {
    id: "esp",
    flag: "ESP",
    title: "España → Ecuador",
    badge: "Recibimos en Madrid · UE completa",
    timeframe: "Tiempo de tránsito según consolidación",
    importPerLb: 8,
    importApplyIva: true,
    arancelPerLb: 2.5,
    ivaRate: 0.15,
    example: { lb: 2, importe: 18.4, arancel: 5.0, total: 23.4 },
    notes: [
      "Importación: $8 + IVA por libra",
      "Arancel: $2.50 por libra",
      "Recibimos envíos de toda la Unión Europea",
    ],
  },
  "usa-std": {
    id: "usa-std",
    flag: "USA",
    title: "USA Estándar → Ecuador",
    badge: "Florida · Medley",
    timeframe: "5 a 9 días hábiles desde recepción en Florida",
    importPerLb: 5.99,
    importApplyIva: false,
    arancelPerLb: 2.5,
    ivaRate: 0,
    example: { lb: 2, importe: 11.98, arancel: 5.0, total: 16.98 },
    notes: [
      "Importación: $5.99 por libra",
      "Arancel: $2.50 por libra",
      "Bodega Medley, FL · 8988 NW 105th Way",
    ],
  },
  "usa-exp": {
    id: "usa-exp",
    flag: "USA",
    title: "USA Express → Ecuador",
    badge: "Florida · Pembroke Pines",
    timeframe: "Una semana tras recepción en Florida",
    importPerLb: 8.99,
    importApplyIva: false,
    arancelPerLb: 0,
    ivaRate: 0,
    example: { lb: 2, importe: 17.98, arancel: 0, total: 17.98 },
    notes: [
      "Tarifa final: $8.99 por libra",
      "Valor neto · sin cargos adicionales",
      "Bodega Pembroke Pines, FL · 13176 NW 19th Street",
    ],
  },
};

const origin = ref<Origin>("esp");
const lb = ref<string>("2");

const currentRate = computed(() => RATES[origin.value]);

const calc = computed(() => {
  const r = currentRate.value;
  const weight = Math.max(0, Number.parseFloat(lb.value || "0") || 0);
  const importeBase = weight * r.importPerLb;
  const iva = r.importApplyIva ? importeBase * r.ivaRate : 0;
  const importe = importeBase + iva;
  const arancel = weight * r.arancelPerLb;
  const total = importe + arancel;
  return {
    weight,
    importeBase,
    iva,
    importe,
    arancel,
    total,
  };
});

const fmt = (n: number) =>
  n.toLocaleString("es-EC", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

const waLink = computed(() => {
  const r = currentRate.value;
  const c = calc.value;
  return whatsappUrl(
    `Hola Courier Box, quiero cotizar un envío.\nRuta: ${r.title}\nPeso: ${c.weight} lb\nImporte: ${fmt(c.importe)}\nArancel: ${fmt(c.arancel)}\nTotal estimado: ${fmt(c.total)}`,
  );
});
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
      <div class="tabs" role="tablist" aria-label="Selecciona la ruta">
        <button
          v-for="r in RATES"
          :key="r.id"
          type="button"
          role="tab"
          :aria-selected="origin === r.id"
          :class="['tab', { 'is-active': origin === r.id }]"
          @click="origin = r.id"
        >
          <span class="tab__flag">{{ r.flag }}</span>
          <span class="tab__copy">
            <strong>{{ r.title }}</strong>
            <em>{{ r.badge }}</em>
          </span>
        </button>
      </div>

      <div class="card" data-reveal>
        <header class="card__head">
          <div>
            <span class="card__eyebrow">Ruta seleccionada</span>
            <h2>{{ currentRate.title }}</h2>
            <p>{{ currentRate.timeframe }}</p>
          </div>
        </header>

        <div class="card__body">
          <div class="input-row">
            <AppInput
              v-model="lb"
              label="Peso en libras (lb)"
              type="number"
              inputmode="numeric"
              placeholder="Ej. 2"
            />
            <div class="hint">
              <span>Importación</span>
              <strong>
                ${{ currentRate.importPerLb.toFixed(2) }} / lb
                <em v-if="currentRate.importApplyIva">+ IVA ({{ (currentRate.ivaRate * 100).toFixed(0) }}%)</em>
              </strong>
              <template v-if="currentRate.arancelPerLb > 0">
                <span>Arancel</span>
                <strong>${{ currentRate.arancelPerLb.toFixed(2) }} / lb</strong>
              </template>
              <template v-else>
                <span>Tarifa</span>
                <strong>Neta · sin cargos adicionales</strong>
              </template>
            </div>
          </div>

          <div class="breakdown">
            <div class="breakdown__row">
              <span>Peso</span>
              <strong>{{ calc.weight }} lb</strong>
            </div>
            <div class="breakdown__row">
              <span>
                Importación
                <em>(${{ currentRate.importPerLb.toFixed(2) }} × {{ calc.weight }})</em>
              </span>
              <strong>{{ fmt(calc.importeBase) }}</strong>
            </div>
            <div v-if="currentRate.importApplyIva" class="breakdown__row">
              <span>IVA ({{ (currentRate.ivaRate * 100).toFixed(0) }}%)</span>
              <strong>{{ fmt(calc.iva) }}</strong>
            </div>
            <div v-if="currentRate.importApplyIva" class="breakdown__row">
              <span>Importación total</span>
              <strong>{{ fmt(calc.importe) }}</strong>
            </div>
            <div v-if="currentRate.arancelPerLb > 0" class="breakdown__row">
              <span>
                Arancel
                <em>(${{ currentRate.arancelPerLb.toFixed(2) }} × {{ calc.weight }})</em>
              </span>
              <strong>{{ fmt(calc.arancel) }}</strong>
            </div>
            <div class="breakdown__row breakdown__row--total">
              <span>{{ currentRate.arancelPerLb === 0 && !currentRate.importApplyIva ? "Total final" : "Total estimado" }}</span>
              <strong>{{ fmt(calc.total) }}</strong>
            </div>
          </div>

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
          <p v-if="currentRate.arancelPerLb > 0">
            Peso 2 lb → Importación {{ fmt(currentRate.example.importe) }}
            + Arancel {{ fmt(currentRate.example.arancel) }}
            = <strong>{{ fmt(currentRate.example.total) }}</strong>
          </p>
          <p v-else>
            Peso 2 lb · tarifa final <strong>{{ fmt(currentRate.example.total) }}</strong>
            (sin aranceles ni cargos adicionales).
          </p>
          <ul>
            <li v-for="n in currentRate.notes" :key="n">{{ n }}</li>
          </ul>
        </footer>
      </div>
    </section>

    <CtaFinal />
  </main>
</template>

<style scoped lang="scss">
@use "@/styles/tokens/colors" as *;
@use "@/styles/mixins/typography" as *;
@use "@/styles/mixins/responsive" as *;

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

.tabs {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
  @include md { grid-template-columns: repeat(3, 1fr); }
}

.tab {
  display: flex;
  gap: 0.85rem;
  align-items: center;
  padding: 1rem 1.25rem;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 16px;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.25s ease, transform 0.25s ease, background 0.25s ease;
  color: var(--fg);
  font-family: inherit;
  min-width: 0;

  &__flag {
    display: inline-grid;
    place-items: center;
    width: 42px;
    height: 42px;
    border-radius: 999px;
    background: rgba($brand-orange, 0.12);
    color: $brand-orange;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.72rem;
    font-weight: 600;
    flex-shrink: 0;
  }

  &__copy {
    display: grid;
    gap: 0.15rem;
    min-width: 0;
    strong {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--fg);
      line-height: 1.2;
    }
    em {
      font-style: normal;
      font-size: 0.78rem;
      color: var(--fg-faint);
      letter-spacing: 0.02em;
    }
  }

  &:hover { border-color: rgba($brand-orange, 0.5); }
  &.is-active {
    border-color: $brand-orange;
    background: linear-gradient(140deg, rgba($brand-orange, 0.16), transparent 70%), var(--surface);
  }
}

.card {
  border: 1px solid var(--border);
  border-radius: 24px;
  background:
    radial-gradient(120% 80% at 100% 0%, rgba($brand-orange, 0.10), transparent 55%),
    var(--surface-2);
  overflow: hidden;
  min-width: 0;

  &__head {
    padding: clamp(1.5rem, 3vw, 2rem);
    border-bottom: 1px solid var(--border);
    display: grid;
    gap: 0.35rem;
    h2 {
      font-family: "Fraunces", serif;
      font-weight: 500;
      font-size: clamp(1.5rem, 3vw, 2rem);
      letter-spacing: -0.02em;
      color: var(--fg);
    }
    p { color: var(--fg-muted); font-size: 0.9rem; }
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
    p { color: var(--fg-muted); strong { color: $brand-orange; } }
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
        &::before {
          content: "→";
          position: absolute;
          left: 0;
          color: $brand-orange;
        }
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
    font-family: "JetBrains Mono", monospace;
    font-weight: 500;
    em {
      font-style: normal;
      color: $brand-orange;
      margin-left: 0.35rem;
      font-size: 0.85em;
    }
  }
}

.breakdown {
  display: grid;
  gap: 0.5rem;
  padding: 1.25rem;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--surface);
  min-width: 0;

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
      font-family: "JetBrains Mono", monospace;
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
        font-family: "Fraunces", serif;
        font-weight: 500;
        font-size: clamp(1.5rem, 3vw, 2rem);
        color: $brand-orange;
      }
    }
  }
}
</style>
