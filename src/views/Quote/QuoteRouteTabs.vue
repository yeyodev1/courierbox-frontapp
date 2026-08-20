<script setup lang="ts">
/** Lane picker: España, USA estándar or USA express. */
import { RATES, type Origin } from './quote-rates'

const origin = defineModel<Origin>({ required: true })
</script>

<template>
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
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/mixins/responsive' as *;

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
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.72rem;
    font-weight: 600;
    flex-shrink: 0;
  }

  &__copy {
    display: grid;
    gap: 0.15rem;
    min-width: 0;

    strong { font-size: 0.95rem; font-weight: 600; color: var(--fg); line-height: 1.2; }
    em { font-style: normal; font-size: 0.78rem; color: var(--fg-faint); letter-spacing: 0.02em; }
  }

  &:hover { border-color: rgba($brand-orange, 0.5); }

  &.is-active {
    border-color: $brand-orange;
    background: linear-gradient(140deg, rgba($brand-orange, 0.16), transparent 70%), var(--surface);
  }
}

@media (prefers-reduced-motion: reduce) {
  .tab { transition: none; }
}
</style>
