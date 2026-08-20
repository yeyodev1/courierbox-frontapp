<script setup lang="ts">
/** Where the wizard stands: current step plus the per-field checklist. */
defineProps<{
  paso: number
  totalPasos: number
  pasoLabel: string
  porcentaje: number
  checklist: Array<{ label: string; value: string; state: string }>
}>()
</script>

<template>
  <div class="live-progress">
    <div class="panel-card">
      <div class="panel-head">
        <h3><i class="fa-solid fa-bullseye" aria-hidden="true" /> Completando ahora</h3>
        <span>{{ paso }} / {{ totalPasos }}</span>
      </div>
      <strong class="live-progress__step">{{ pasoLabel }}</strong>
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: `${porcentaje}%` }" />
      </div>
    </div>

    <div class="live-progress__grid">
      <article
        v-for="item in checklist"
        :key="item.label"
        class="live-progress__item"
        :class="`state-${item.state}`"
      >
        <span class="live-progress__label">{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </article>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.live-progress {
  display: flex;
  flex-direction: column;
  gap: $space-4;

  &__step { display: block; margin-bottom: $space-2; font-size: 1.05rem; color: $brand-orange; }

  &__grid {
    display: flex;
    flex-wrap: wrap;
    gap: $space-3;

    @media (max-width: 980px) { flex-direction: column; }
  }

  &__item {
    flex: 1 1 180px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: $space-3 $space-4;
    border-radius: 14px;
    border: 1px solid rgba($ink-500, 0.2);
    background: $ink-900;

    strong { color: $fg-dark; font-size: 0.9rem; word-break: break-word; }

    &.state-done { border-color: rgba($signal-green, 0.25); }
    &.state-pending { opacity: 0.85; }
  }

  &__label {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: $ink-400;
  }
}

.panel-card {
  padding: $space-5;
  border-radius: 20px;
  border: 1px solid rgba($ink-500, 0.18);
  background: $ink-900;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-3;

  h3 { display: flex; align-items: center; gap: $space-2; margin: 0; font-size: 1rem; }
  span { color: $ink-400; font-size: 0.82rem; }
}

.progress-track {
  height: 4px;
  background: $ink-700;
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: $brand-orange;
  border-radius: 999px;
  transition: width 0.25s ease;
}

@media (prefers-reduced-motion: reduce) {
  .progress-fill { transition: none; }
}
</style>
