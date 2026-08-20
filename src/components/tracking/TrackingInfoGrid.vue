<script setup lang="ts">
/** Logistics facts only — this grid is public, so it carries no personal data. */
import { computed } from 'vue'
import type { TrackingResult } from '@/services/tracking'
import { sanitizeText } from '@/utils/sanitizeTracking'
import { fmtDateShort } from './tracking-format'

const props = defineProps<{ data: TrackingResult }>()

const descripcion = computed(() => sanitizeText(props.data.descripcion, null))
const shipper = computed(() => sanitizeText(props.data.shipper, null))
const carrier = computed(() => sanitizeText(props.data.carrier, null))

/**
 * Older records left the carrier's own code in `notes` instead of its own
 * field, so fall back to it when it still looks like a tracking number.
 */
const trackingOriginal = computed<string | null>(() => {
  const direct = sanitizeText(props.data.trackingOriginal, null)
  if (direct) return direct
  const fromNotes = sanitizeText(props.data.notes, null)
  return fromNotes && /^[A-Z0-9-]{8,}$/i.test(fromNotes) ? fromNotes : null
})
</script>

<template>
  <section class="info-grid">
    <div class="info-cell">
      <span class="info-cell__label">Tracking</span>
      <strong class="info-cell__mono">{{ trackingOriginal ?? data.wr ?? data.codigo }}</strong>
    </div>
    <div class="info-cell">
      <span class="info-cell__label">Shipper</span>
      <strong>{{ shipper ?? 'Por confirmar' }}</strong>
    </div>
    <div class="info-cell">
      <span class="info-cell__label">Carrier</span>
      <strong>{{ carrier ?? 'Por confirmar' }}</strong>
    </div>
    <div class="info-cell info-cell--wide">
      <span class="info-cell__label">Descripción</span>
      <strong>{{ descripcion ?? '—' }}</strong>
    </div>
    <div class="info-cell">
      <span class="info-cell__label">Recibido en bodega</span>
      <strong>{{ fmtDateShort(data.fechaRecepcion) }}</strong>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/mixins/responsive' as *;

.info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1px;
  padding: 0;
  background: var(--border);
  border-top: 1px solid var(--border);

  @include sm { grid-template-columns: 1fr 1fr; }
  @include md { grid-template-columns: repeat(3, 1fr); }
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

  &__mono {
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 0.9rem !important;
    letter-spacing: 0.02em;
    color: $brand-orange !important;
  }

  &--wide {
    @include md { grid-column: span 2; }
  }
}
</style>
