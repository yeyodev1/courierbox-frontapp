<script setup lang="ts">
import { computed } from "vue";
import AppBadge from "@/components/ui/AppBadge.vue";
import AppButton from "@/components/ui/AppButton.vue";
import TrackingTimeline from "./TrackingTimeline.vue";
import TrackingPipeline from "./TrackingPipeline.vue";
import TrackingGallery from "./TrackingGallery.vue";
import type { TrackingResult } from "@/services/tracking";
import { sanitizeText } from "@/utils/sanitizeTracking";
import { whatsappUrl } from "@/config/contact";

const props = defineProps<{ data: TrackingResult }>();

const safeDescripcion = computed(() => sanitizeText(props.data.descripcion, null));
const safeNotes = computed(() => sanitizeText(props.data.notes, null));
const safeConsignee = computed(() => {
  const raw = sanitizeText(props.data.consignee, null);
  if (!raw) return props.data.codigo;
  return /consignatario/i.test(raw) ? props.data.codigo : raw;
});

const waLink = computed(() =>
  whatsappUrl(`Hola, consulta sobre tracking ${props.data.codigo}`),
);

const tone = computed(() => {
  switch (props.data.estado) {
    case "entregado": return "success" as const;
    case "incidencia": return "danger" as const;
    case "en_transito":
    case "en_aduana":
    case "en_distribucion":
    case "en_bodega_miami":
      return "warning" as const;
    default: return "neutral" as const;
  }
});

const isDelivered = computed(() => props.data.estado === "entregado");

function fmtDateLong(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("es-EC", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  } catch { return iso; }
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("es-EC", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

function copyCodigo() {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    navigator.clipboard.writeText(props.data.codigo).catch(() => {});
  }
}
</script>

<template>
  <article class="card">
    <!-- HERO ─────────────────────────────────────────────── -->
    <header class="hero">
      <div class="hero__left">
        <div class="hero__meta">
          <span class="hero__wr">{{ data.wr ?? "—" }}</span>
          <AppBadge :tone="tone" pulse>{{ data.estadoLabel }}</AppBadge>
        </div>

        <h2 class="hero__headline">
          <span v-if="isDelivered" class="hero__check" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="44" height="44">
              <circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="1.5"/>
              <path d="M7 12.5 L10.5 16 L17 9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          {{ data.estadoLabel }}
        </h2>

        <button class="hero__codigo" type="button" @click="copyCodigo" :title="`Copiar ${data.codigo}`">
          <span class="hero__codigo-label">Tracking</span>
          <span class="hero__codigo-value">{{ data.codigo }}</span>
          <span class="hero__codigo-icon" aria-hidden="true">⧉</span>
        </button>
      </div>

      <div class="hero__right">
        <div class="hero__stat">
          <span class="hero__stat-label">Peso</span>
          <span class="hero__stat-value">{{ data.pesoLb != null ? `${data.pesoLb}` : "—" }}<em v-if="data.pesoLb != null">lb</em></span>
        </div>
        <div class="hero__stat hero__stat--accent">
          <span class="hero__stat-label">Total estimado</span>
          <span class="hero__stat-value">{{ data.costo ? `$${data.costo.total.toFixed(2)}` : "—" }}</span>
        </div>
      </div>
    </header>

    <!-- PIPELINE ─────────────────────────────────────────── -->
    <section class="card__section card__section--pipeline">
      <TrackingPipeline :estado="data.estado" />
    </section>

    <!-- INFO GRID ────────────────────────────────────────── -->
    <section class="card__section info-grid">
      <div class="info-cell">
        <span class="info-cell__label">Para</span>
        <strong>{{ safeNotes ?? data.wr ?? "—" }}</strong>
      </div>
      <div class="info-cell info-cell--wide">
        <span class="info-cell__label">Tracking</span>
        <strong>{{ safeConsignee ?? "—" }}</strong>
      </div>
      <div class="info-cell">
        <span class="info-cell__label">Descripción</span>
        <strong>{{ safeDescripcion ?? "—" }}</strong>
      </div>
    </section>

    <!-- COST DETAIL ──────────────────────────────────────── -->
    <section v-if="data.costo" class="cost">
      <div class="cost__head">
        <span class="cost__eyebrow">Cobro estimado</span>
        <span class="cost__disclaimer">Valor referencial</span>
      </div>
      <div class="cost__rows">
        <div class="cost__row">
          <span>Peso</span>
          <strong>{{ data.costo.pesoLb }} lb</strong>
        </div>
        <div class="cost__row">
          <span>Flete <em>($5.99 / lb)</em></span>
          <strong>${{ data.costo.flete.toFixed(2) }}</strong>
        </div>
        <div class="cost__row">
          <span>Arancel <em>($2.50 / lb)</em></span>
          <strong>${{ data.costo.arancel.toFixed(2) }}</strong>
        </div>
        <div class="cost__row cost__row--total">
          <span>Total</span>
          <strong>${{ data.costo.total.toFixed(2) }}</strong>
        </div>
      </div>
    </section>

    <!-- GALLERY ──────────────────────────────────────────── -->
    <section v-if="data.imagenes.length" class="card__section">
      <div class="section-head">
        <span class="section-head__eyebrow">Comprobantes · {{ data.imagenes.length }} fotos</span>
      </div>
      <TrackingGallery :images="data.imagenes" />
    </section>

    <!-- TIMELINE ─────────────────────────────────────────── -->
    <section class="card__section">
      <div class="section-head">
        <span class="section-head__eyebrow">Historial · {{ data.eventos.length }} eventos</span>
        <span class="section-head__sub">Más reciente arriba</span>
      </div>
      <TrackingTimeline :eventos="data.eventos" />
    </section>

    <!-- FOOTER META ──────────────────────────────────────── -->
    <footer class="card__foot">
      <div>
        <span class="card__foot-label">Recibido en bodega</span>
        <strong>{{ fmtDateLong(data.fechaRecepcion) }}</strong>
      </div>
      <div>
        <span class="card__foot-label">Última consulta</span>
        <strong>{{ fmtDateTime(data.actualizadoEn) }}</strong>
      </div>
      <AppButton
        as="a"
        :href="waLink"
        target="_blank"
        rel="noopener"
        variant="primary"
        size="md"
      >
        Consultar por WhatsApp
      </AppButton>
    </footer>
  </article>
</template>

<style scoped lang="scss">
@use "@/styles/tokens/colors" as *;
@use "@/styles/tokens/space" as *;
@use "@/styles/tokens/motion" as *;
@use "@/styles/mixins/responsive" as *;
@use "@/styles/mixins/typography" as *;

.card {
  position: relative;
  border: 1px solid var(--border);
  border-radius: clamp(20px, 4vw, 32px);
  background:
    radial-gradient(120% 80% at 100% 0%, rgba($brand-orange, 0.10), transparent 55%),
    var(--surface-2);
  overflow: hidden;
  isolation: isolate;
  min-width: 0;
  max-width: 100%;
  animation: cardIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;

  > * { animation: stagger 0.7s cubic-bezier(0.16, 1, 0.3, 1) both; }
  > *:nth-child(1) { animation-delay: 0.05s; }
  > *:nth-child(2) { animation-delay: 0.15s; }
  > *:nth-child(3) { animation-delay: 0.25s; }
  > *:nth-child(4) { animation-delay: 0.35s; }
  > *:nth-child(5) { animation-delay: 0.45s; }
  > *:nth-child(6) { animation-delay: 0.55s; }
  > *:nth-child(7) { animation-delay: 0.65s; }

  &__section {
    padding: clamp(1.25rem, 3vw, 2.5rem);
    border-top: 1px solid var(--border);

    &--pipeline { padding-block: clamp(1.5rem, 3vw, 2rem); }
  }

  &__foot {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.25rem;
    padding: clamp(1.5rem, 3vw, 2rem);
    border-top: 1px solid var(--border);
    background: var(--surface);

    @include md {
      grid-template-columns: 1fr 1fr auto;
      align-items: center;
    }

    &-label {
      font-size: 0.7rem;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--fg-faint);
      display: block;
      margin-bottom: 0.35rem;
    }

    strong { color: var(--fg); font-weight: 500; font-size: 0.95rem; }
  }
}

/* HERO ───────────────────────────────────────────── */
.hero {
  position: relative;
  padding: clamp(1.25rem, 4vw, 3rem);
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  min-width: 0;

  @include lg {
    grid-template-columns: 1.4fr 1fr;
    align-items: end;
  }

  &__left { display: grid; gap: 1rem; min-width: 0; }

  &__meta {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  &__wr {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.85rem;
    color: $brand-orange;
    border: 1px solid rgba($brand-orange, 0.5);
    background: rgba($brand-orange, 0.08);
    padding: 0.35rem 0.75rem;
    border-radius: 999px;
    letter-spacing: 0.08em;
  }

  &__headline {
    @include display-md;
    color: var(--fg);
    line-height: 1.02;
    letter-spacing: -0.02em;
    display: flex;
    align-items: center;
    gap: 0.65rem;
    flex-wrap: wrap;
    font-style: italic;
    background: linear-gradient(120deg, $ink-100 30%, $brand-orange-soft);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  &__check {
    color: $brand-orange;
    display: inline-grid;
    place-items: center;
    flex-shrink: 0;
    animation: pop 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }

  &__codigo {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    background: rgba($ink-100, 0.04);
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 0.5rem 0.5rem 0.5rem 1.1rem;
    color: var(--fg);
    cursor: pointer;
    transition: all 0.3s ease;
    width: max-content;
    max-width: 100%;
    font-family: inherit;

    &:hover {
      border-color: $brand-orange;
      .hero__codigo-icon { color: $brand-orange; transform: scale(1.1); }
    }

    &-label {
      font-size: 0.7rem;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--fg-faint);
    }

    &-value {
      font-family: "JetBrains Mono", monospace;
      font-size: 0.95rem;
      letter-spacing: 0.02em;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &-icon {
      width: 32px;
      height: 32px;
      display: inline-grid;
      place-items: center;
      border-radius: 999px;
      background: rgba($ink-100, 0.08);
      color: var(--fg-muted);
      transition: all 0.3s ease;
      flex-shrink: 0;
      font-size: 0.95rem;
    }
  }

  &__right {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    min-width: 0;
    @include lg { grid-template-columns: 1fr; gap: 0.75rem; }
  }

  &__stat {
    padding: 1rem 1.25rem;
    border: 1px solid var(--border);
    border-radius: 18px;
    background: var(--surface);
    display: grid;
    gap: 0.35rem;
    min-width: 0;

    &-label {
      font-size: 0.7rem;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--fg-faint);
    }

    &-value {
      font-family: "Fraunces", serif;
      font-weight: 500;
      font-size: clamp(1.25rem, 5vw, 2rem);
      line-height: 1;
      color: var(--fg);
      letter-spacing: -0.02em;
      overflow-wrap: anywhere;
      em {
        font-style: normal;
        font-size: 0.55em;
        color: var(--fg-muted);
        margin-left: 0.25rem;
        font-family: "Inter Tight", sans-serif;
        font-weight: 400;
      }
    }

    &--accent {
      background: linear-gradient(140deg, rgba($brand-orange, 0.18), rgba($brand-orange, 0.04));
      border-color: rgba($brand-orange, 0.4);
      .hero__stat-value { color: $brand-orange; }
    }
  }
}

/* INFO GRID ──────────────────────────────────────── */
.info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1px;
  padding: 0;
  background: var(--border);
  border-radius: 0;

  @include md { grid-template-columns: 1fr 2fr 1fr; }
}

.info-cell {
  padding: clamp(1.25rem, 2.5vw, 1.75rem);
  background: var(--surface-2);
  display: grid;
  gap: 0.5rem;
  align-content: start;

  &__label {
    font-size: 0.7rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--fg-faint);
  }

  strong {
    color: var(--fg);
    font-weight: 500;
    font-size: 1rem;
    line-height: 1.4;
    word-break: break-word;
  }
}

/* COST ───────────────────────────────────────────── */
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

  &__rows {
    display: grid;
    gap: 0.5rem;
  }

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
      font-family: "JetBrains Mono", monospace;
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
        font-family: "Fraunces", serif;
        font-weight: 500;
        font-size: clamp(1.5rem, 3vw, 2rem);
        color: $brand-orange;
        letter-spacing: -0.02em;
      }
    }
  }
}

/* SECTION HEAD ──────────────────────────────────── */
.section-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
  gap: 0.5rem;

  &__eyebrow {
    font-size: 0.72rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--fg);
    font-weight: 500;
  }

  &__sub {
    font-size: 0.7rem;
    color: var(--fg-faint);
    font-family: "JetBrains Mono", monospace;
  }
}

@keyframes pop {
  0% { opacity: 0; transform: scale(0.5) rotate(-30deg); }
  70% { transform: scale(1.1) rotate(0deg); }
  100% { opacity: 1; transform: scale(1) rotate(0deg); }
}

@keyframes cardIn {
  from { opacity: 0; transform: translateY(28px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes stagger {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .hero__check, .card, .card > * { animation: none; }
}
</style>
