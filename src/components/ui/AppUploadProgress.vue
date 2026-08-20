<script setup lang="ts">
/**
 * The waiting screen for a batch upload.
 *
 * Waiting is the tense part, so the panel answers the three questions an
 * operator actually has: how many are done, how many are left, and did anything
 * fail. Status is carried by an icon and a word as well as a colour, so it still
 * reads for someone who cannot tell the green from the red.
 */
import { computed } from 'vue'
import BrandMark from './BrandMark.vue'
import type { UploadItem } from '@/composables/useUploadQueue'

const props = withDefaults(
  defineProps<{
    items: UploadItem[]
    done: number
    failed: number
    pending: number
    percent: number
    /** What is happening right now, e.g. "Subiendo 3 de 8...". */
    message?: string
    /** Switches the panel to its success state. */
    finished?: boolean
    finishedMessage?: string
    /** Shown while work is in flight, to explain why waiting is safe. */
    hint?: string
  }>(),
  {
    message: '',
    finished: false,
    finishedMessage: '¡Listo!',
    hint: 'No cierres esta ventana: se están guardando tus fotos.',
  },
)

const emit = defineEmits<{ retry: [] }>()

const total = computed(() => props.items.length)

const STATUS_META = {
  pending: { icon: 'fa-regular fa-clock', label: 'En espera' },
  uploading: { icon: 'fa-solid fa-arrow-up', label: 'Subiendo' },
  done: { icon: 'fa-solid fa-check', label: 'Guardada' },
  error: { icon: 'fa-solid fa-triangle-exclamation', label: 'Falló' },
} as const

/** Only the states actually present, so the legend never explains nothing. */
const legend = computed(() =>
  (['done', 'uploading', 'pending', 'error'] as const)
    .map((status) => ({
      status,
      ...STATUS_META[status],
      count: props.items.filter((i) => i.status === status).length,
    }))
    .filter((entry) => entry.count > 0),
)
</script>

<template>
  <div class="upload-progress" role="status" aria-live="polite">
    <div class="brand">
      <BrandMark :size="34" variant="plate" />
      <span v-if="!finished" class="brand-pulse" aria-hidden="true" />
    </div>

    <template v-if="finished">
      <div class="check-pop"><i class="fa-solid fa-check" aria-hidden="true" /></div>
      <p class="headline">{{ finishedMessage }}</p>
    </template>

    <template v-else>
      <p class="headline">{{ message || 'Guardando...' }}</p>

      <div class="counter">
        <span class="counter-done">{{ done }}</span>
        <span class="counter-of">de</span>
        <span class="counter-total">{{ total }}</span>
      </div>
      <p class="counter-caption">
        {{ total === 1 ? 'imagen guardada' : 'imágenes guardadas' }}
      </p>

      <div class="bar" role="progressbar" :aria-valuenow="percent" aria-valuemin="0" aria-valuemax="100">
        <div class="bar-fill" :style="{ width: percent + '%' }" />
      </div>

      <div class="tallies">
        <span class="tally done"><i class="fa-solid fa-check" aria-hidden="true" /> {{ done }} listas</span>
        <span v-if="pending" class="tally pending">
          <i class="fa-regular fa-clock" aria-hidden="true" /> faltan {{ pending }}
        </span>
        <span v-if="failed" class="tally error">
          <i class="fa-solid fa-triangle-exclamation" aria-hidden="true" /> {{ failed }} con error
        </span>
      </div>

      <p class="hint">{{ hint }}</p>
    </template>

    <ul class="thumbs">
      <li v-for="item in items" :key="item.id" class="thumb" :class="item.status">
        <img :src="item.preview" alt="" />
        <span class="thumb-state">
          <i :class="STATUS_META[item.status].icon" aria-hidden="true" />
        </span>
        <span class="sr-only">{{ STATUS_META[item.status].label }}</span>
      </li>
    </ul>

    <ul v-if="legend.length > 1" class="legend">
      <li v-for="entry in legend" :key="entry.status" class="legend-item" :class="entry.status">
        <span class="legend-dot" aria-hidden="true" />
        {{ entry.label }} ({{ entry.count }})
      </li>
    </ul>

    <button v-if="failed && !finished" type="button" class="retry" @click="emit('retry')">
      <i class="fa-solid fa-rotate-right" aria-hidden="true" /> Reintentar las {{ failed }} que fallaron
    </button>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.upload-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-3;
  text-align: center;
  padding: $space-5;
  max-width: 420px;
}

.brand {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* A slow halo around the mark: motion that says "working", not "hurry". */
.brand-pulse {
  position: absolute;
  inset: -10px;
  border-radius: 50%;
  border: 2px solid rgba($brand-orange, 0.45);
  animation: halo 1.8s ease-out infinite;
}

.headline {
  margin: 0;
  color: $fg-dark;
  font-weight: 700;
  font-size: 1rem;
}

.counter {
  display: flex;
  align-items: baseline;
  gap: $space-2;
  font-variant-numeric: tabular-nums;
}

.counter-done { font-size: 2.6rem; font-weight: 800; color: $brand-orange; line-height: 1; }
.counter-of { color: $ink-400; font-size: 0.9rem; }
.counter-total { font-size: 1.6rem; font-weight: 700; color: $ink-300; }

.counter-caption {
  margin: -4px 0 0;
  color: $ink-400;
  font-size: 0.8rem;
}

.bar {
  width: 100%;
  height: 8px;
  border-radius: 999px;
  background: $ink-700;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 999px;
  background: $brand-orange;
  box-shadow: 0 0 12px rgba($brand-orange, 0.5);
  transition: width 0.35s ease;
}

.tallies {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: $space-2;
}

.tally {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 700;

  &.done { background: rgba($signal-green, 0.14); color: $signal-green; }
  &.pending { background: rgba($ink-500, 0.2); color: $ink-300; }
  &.error { background: rgba($signal-red, 0.14); color: $signal-red; }
}

.hint {
  margin: 0;
  color: $ink-400;
  font-size: 0.78rem;
  line-height: 1.4;
}

.thumbs {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: $space-2;
  list-style: none;
  margin: 0;
  padding: 0;
  max-width: 380px;
}

.thumb {
  position: relative;
  width: 54px;
  height: 54px;
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid $ink-600;
  opacity: 0.5;
  transition: opacity 0.2s, border-color 0.2s, transform 0.2s;

  img { width: 100%; height: 100%; object-fit: cover; }

  &.uploading {
    opacity: 1;
    border-color: $brand-orange;
    transform: scale(1.06);
  }
  &.done { opacity: 1; border-color: $signal-green; }
  &.error { opacity: 1; border-color: $signal-red; }
}

.thumb-state {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-size: 0.85rem;
}

.thumb.done .thumb-state { color: $signal-green; background: rgba(0, 0, 0, 0.32); }
.thumb.error .thumb-state { color: $signal-red; }
.thumb.pending .thumb-state { color: $ink-300; }
.thumb.uploading .thumb-state { color: $brand-orange; animation: nudge 0.9s ease-in-out infinite; }

.legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: $space-3;
  list-style: none;
  margin: 0;
  padding: 0;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: $ink-400;
  font-size: 0.72rem;
}

.legend-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: $ink-500;
}

.legend-item.done .legend-dot { background: $signal-green; }
.legend-item.uploading .legend-dot { background: $brand-orange; }
.legend-item.error .legend-dot { background: $signal-red; }

.retry {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  background: transparent;
  border: 1px solid rgba($signal-red, 0.5);
  color: $signal-red;
  border-radius: 12px;
  padding: $space-2 $space-4;
  font-family: inherit;
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
}

.check-pop {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  background: rgba($signal-green, 0.16);
  color: $signal-green;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.9rem;
  animation: pop 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

@keyframes halo {
  0% { transform: scale(0.9); opacity: 0.7; }
  100% { transform: scale(1.35); opacity: 0; }
}
@keyframes nudge {
  0%, 100% { transform: translateY(1px); }
  50% { transform: translateY(-2px); }
}
@keyframes pop {
  from { transform: scale(0.5); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .brand-pulse,
  .thumb.uploading .thumb-state,
  .check-pop { animation: none; }
  .bar-fill,
  .thumb { transition: none; }
  .thumb.uploading { transform: none; }
}
</style>
