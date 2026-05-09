<script setup lang="ts">
import { computed } from "vue";
import AppBadge from "@/components/ui/AppBadge.vue";
import TrackingTimeline from "./TrackingTimeline.vue";
import type { TrackingResult } from "@/services/tracking";

const props = defineProps<{ data: TrackingResult }>();

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

const fmtFecha = computed(() => {
  if (!props.data.fechaEntrega) return null;
  try {
    return new Date(props.data.fechaEntrega).toLocaleDateString("es-EC", {
      weekday: "long", day: "numeric", month: "long",
    });
  } catch { return props.data.fechaEntrega; }
});

const progreso = computed(() => {
  const order: Record<string, number> = {
    creado: 0.1,
    en_bodega_miami: 0.3,
    en_transito: 0.55,
    en_aduana: 0.7,
    en_distribucion: 0.85,
    entregado: 1,
    incidencia: 0.5,
    desconocido: 0.05,
  };
  return Math.round((order[props.data.estado] ?? 0.05) * 100);
});
</script>

<template>
  <div class="result">
    <header class="result__head">
      <div class="result__id">
        <span class="result__label">Guía</span>
        <h2 class="result__codigo">{{ data.codigo }}</h2>
      </div>
      <AppBadge :tone="tone" pulse>{{ data.estadoLabel }}</AppBadge>
    </header>

    <div class="result__progress" :style="{ '--progress': `${progreso}%` }">
      <span />
    </div>

    <div class="result__grid">
      <div class="result__cell">
        <span class="result__label">Peso</span>
        <strong>{{ data.pesoLb != null ? `${data.pesoLb} lb` : "—" }}</strong>
      </div>
      <div class="result__cell">
        <span class="result__label">Costo estimado</span>
        <strong>{{ data.costo != null ? `$${data.costo.toFixed(2)}` : "—" }}</strong>
      </div>
      <div class="result__cell">
        <span class="result__label">Entrega</span>
        <strong>{{ fmtFecha ?? "Por confirmar" }}</strong>
      </div>
      <div class="result__cell">
        <span class="result__label">Actualizado</span>
        <strong>{{ new Date(data.actualizadoEn).toLocaleString("es-EC") }}</strong>
      </div>
    </div>

    <section class="result__events">
      <h3>Historial</h3>
      <TrackingTimeline :eventos="data.eventos" />
    </section>

    <section v-if="data.imagenes.length" class="result__images">
      <h3>Adjuntos</h3>
      <div class="result__images-grid">
        <a
          v-for="src in data.imagenes"
          :key="src"
          :href="src"
          target="_blank"
          rel="noopener"
        >
          <img :src="src" alt="Comprobante de envío" loading="lazy" />
        </a>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
@use "@/styles/tokens/colors" as *;
@use "@/styles/mixins/responsive" as *;
@use "@/styles/mixins/typography" as *;

.result {
  display: grid;
  gap: 1.5rem;
  padding: clamp(1.5rem, 3vw, 2.5rem);
  border: 1px solid var(--border);
  border-radius: 24px;
  background: var(--surface-2);

  &__head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  &__label {
    font-size: 0.75rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--fg-faint);
  }

  &__codigo {
    @include sans-h2;
    font-family: "JetBrains Mono", monospace;
    font-weight: 500;
    margin-top: 0.35rem;
  }

  &__progress {
    height: 6px;
    border-radius: 999px;
    background: rgba($ink-100, 0.06);
    overflow: hidden;
    span {
      display: block;
      height: 100%;
      width: var(--progress, 0%);
      background: linear-gradient(90deg, $brand-orange, $brand-orange-soft);
      transition: width 1.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    @include md { grid-template-columns: repeat(4, 1fr); }
  }

  &__cell {
    padding: 1rem;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: var(--surface);
    display: grid;
    gap: 0.35rem;
    strong { font-weight: 500; color: var(--fg); }
  }

  &__events h3, &__images h3 {
    font-size: 0.75rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--fg-faint);
    margin-bottom: 1rem;
  }

  &__images-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 0.5rem;
    img { aspect-ratio: 4 / 3; object-fit: cover; border-radius: 12px; border: 1px solid var(--border); }
  }
}
</style>
