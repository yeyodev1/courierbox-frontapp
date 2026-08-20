<script setup lang="ts">
/** Public tracking result: status hero, pipeline, logistics, cost and history. */
import { computed } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import TrackingTimeline from './TrackingTimeline.vue'
import TrackingPipeline from './TrackingPipeline.vue'
import TrackingGallery from './TrackingGallery.vue'
import TrackingHero from './TrackingHero.vue'
import TrackingInfoGrid from './TrackingInfoGrid.vue'
import TrackingCostDetail from './TrackingCostDetail.vue'
import type { TrackingResult } from '@/services/tracking'
import { whatsappUrl } from '@/config/contact'
import { fmtDateTime } from './tracking-format'

const props = defineProps<{ data: TrackingResult }>()

const waLink = computed(() => whatsappUrl(`Hola, consulta sobre tracking ${props.data.codigo}`))
</script>

<template>
  <article class="card">
    <TrackingHero :data="data" />

    <section class="card__section card__section--pipeline">
      <TrackingPipeline :estado="data.estado" />
    </section>

    <TrackingInfoGrid :data="data" />

    <TrackingCostDetail v-if="data.costo" :costo="data.costo" />

    <!-- Optional chaining on purpose: the payload comes from a scraper, and a
         partial result used to white-screen the public tracking page. -->
    <section v-if="data.imagenes?.length" class="card__section">
      <div class="section-head">
        <span class="section-head__eyebrow">Comprobantes · {{ data.imagenes.length }} fotos</span>
      </div>
      <TrackingGallery :images="data.imagenes" />
    </section>

    <section class="card__section">
      <div class="section-head">
        <span class="section-head__eyebrow">Historial · {{ data.eventos?.length ?? 0 }} eventos</span>
        <span class="section-head__sub">Más reciente arriba</span>
      </div>
      <TrackingTimeline :eventos="data.eventos ?? []" />
    </section>

    <footer class="card__foot">
      <div>
        <span class="card__foot-label">Última consulta</span>
        <strong>{{ fmtDateTime(data.actualizadoEn) }}</strong>
      </div>
      <AppButton as="a" :href="waLink" target="_blank" rel="noopener" variant="primary" size="md">
        Consultar por WhatsApp
      </AppButton>
    </footer>
  </article>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/mixins/responsive' as *;

.card {
  position: relative;
  border: 1px solid var(--border);
  border-radius: clamp(20px, 4vw, 32px);
  background:
    radial-gradient(120% 80% at 100% 0%, rgba($brand-orange, 0.1), transparent 55%),
    var(--surface-2);
  overflow: hidden;
  isolation: isolate;
  min-width: 0;
  max-width: 100%;
  animation: cardIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;

  > * { animation: stagger 0.7s cubic-bezier(0.16, 1, 0.3, 1) both; }

  @for $i from 1 through 7 {
    > *:nth-child(#{$i}) { animation-delay: #{0.05 + ($i - 1) * 0.1}s; }
  }

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
      grid-template-columns: 1fr auto;
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
    font-family: 'JetBrains Mono', monospace;
  }
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
  .card,
  .card > * { animation: none; }
}
</style>
