<script setup lang="ts">
/** Headline of the tracking card: status, copyable code, weight and estimate. */
import { computed } from 'vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import type { TrackingResult } from '@/services/tracking'
import { toneFor } from './tracking-format'

const props = defineProps<{ data: TrackingResult }>()

const tone = computed(() => toneFor(props.data.estado))
const isDelivered = computed(() => props.data.estado === 'entregado')

function copyCodigo() {
  navigator?.clipboard?.writeText(props.data.codigo).catch(() => {})
}
</script>

<template>
  <header class="hero">
    <div class="hero__left">
      <div class="hero__meta">
        <span class="hero__wr">{{ data.wr ?? '—' }}</span>
        <AppBadge :tone="tone" pulse>{{ data.estadoLabel }}</AppBadge>
      </div>

      <h2 class="hero__headline">
        <span v-if="isDelivered" class="hero__check" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="44" height="44">
            <circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="1.5" />
            <path
              d="M7 12.5 L10.5 16 L17 9"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
        {{ data.estadoLabel }}
      </h2>

      <button class="hero__codigo" type="button" :title="`Copiar ${data.codigo}`" @click="copyCodigo">
        <span class="hero__codigo-label">Tracking</span>
        <span class="hero__codigo-value">{{ data.codigo }}</span>
        <span class="hero__codigo-icon" aria-hidden="true">⧉</span>
      </button>
    </div>

    <div class="hero__right">
      <div class="hero__stat">
        <span class="hero__stat-label">Peso</span>
        <span class="hero__stat-value">
          {{ data.pesoLb != null ? `${data.pesoLb}` : '—' }}<em v-if="data.pesoLb != null">lb</em>
        </span>
      </div>
      <div class="hero__stat hero__stat--accent">
        <span class="hero__stat-label">Total estimado</span>
        <span class="hero__stat-value">{{ data.costo ? `$${data.costo.total.toFixed(2)}` : '—' }}</span>
        <span v-if="data.costo" class="hero__stat-legal">
          Precio sujeto a la tarifa proporcional proporcionada por tu asesor.
        </span>
      </div>
    </div>
  </header>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/mixins/responsive' as *;
@use '@/styles/mixins/typography' as *;

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
    font-family: 'JetBrains Mono', monospace;
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
      font-family: 'JetBrains Mono', monospace;
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

    @include lg { grid-template-columns: 1fr; }
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
      font-family: 'Fraunces', serif;
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
        font-family: 'Inter Tight', sans-serif;
        font-weight: 400;
      }
    }

    &--accent {
      background: linear-gradient(140deg, rgba($brand-orange, 0.18), rgba($brand-orange, 0.04));
      border-color: rgba($brand-orange, 0.4);

      .hero__stat-value { color: $brand-orange; }
    }
  }

  &__stat-legal {
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px dashed rgba($brand-orange, 0.35);
    color: var(--fg-muted);
    font-size: 0.7rem;
    font-style: italic;
    line-height: 1.4;
    display: block;
  }
}

@keyframes pop {
  0% { opacity: 0; transform: scale(0.5) rotate(-30deg); }
  70% { transform: scale(1.1) rotate(0deg); }
  100% { opacity: 1; transform: scale(1) rotate(0deg); }
}

@media (prefers-reduced-motion: reduce) {
  .hero__check { animation: none; }
}
</style>
