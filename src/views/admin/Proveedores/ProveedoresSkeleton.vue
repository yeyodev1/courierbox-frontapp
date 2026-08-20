<script setup lang="ts">
/** Placeholder grid shown while the directory and its spend summary load. */
withDefaults(defineProps<{ count?: number }>(), { count: 4 })
</script>

<template>
  <div class="skeleton-grid" aria-busy="true" aria-live="polite">
    <article v-for="n in count" :key="n" class="provider-skeleton" :class="`tone-${(n - 1) % 4}`">
      <div class="skeleton-top">
        <div class="skeleton-title-block">
          <span class="skeleton-line skeleton-title" />
          <span class="skeleton-line skeleton-subtitle" />
        </div>
        <span class="skeleton-pill" />
      </div>
      <div class="skeleton-meta">
        <span class="skeleton-label" />
        <span class="skeleton-label" />
        <span class="skeleton-label" />
      </div>
      <div class="skeleton-notes" />
      <div class="skeleton-band" />
      <div class="skeleton-actions">
        <span class="skeleton-button" />
        <span class="skeleton-button" />
        <span class="skeleton-button" />
      </div>
    </article>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: $space-4;
}

.provider-skeleton {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: $space-4;
  min-height: 310px;
  padding: $space-5;
  border-radius: 16px;
  border: 1px solid rgba($ink-500, 0.12);
  background: linear-gradient(180deg, rgba($ink-900, 0.96), rgba($ink-900, 0.84));

  &::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 5px;
    background: var(--skeleton-accent, $brand-orange);
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(#fff, 0.05), transparent);
    transform: translateX(-100%);
    animation: shimmer 1.35s infinite;
  }

  &.tone-0 { --skeleton-accent: #{$brand-orange}; }
  &.tone-1 { --skeleton-accent: #{$signal-blue}; }
  &.tone-2 { --skeleton-accent: #{$signal-green}; }
  &.tone-3 { --skeleton-accent: #{$signal-amber}; }
}

.skeleton-top,
.skeleton-actions,
.skeleton-meta {
  display: flex;
  gap: $space-3;
  align-items: center;
  justify-content: space-between;
}

.skeleton-top { align-items: flex-start; }
.skeleton-meta { flex-wrap: wrap; }
.skeleton-actions { justify-content: flex-start; flex-wrap: wrap; }

.skeleton-title-block {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  flex: 1;
}

.skeleton-line,
.skeleton-pill,
.skeleton-label,
.skeleton-band,
.skeleton-button,
.skeleton-notes {
  position: relative;
  overflow: hidden;
  background: rgba($ink-700, 0.85);
}

.skeleton-line,
.skeleton-label { border-radius: 999px; }

.skeleton-title { width: 62%; height: 18px; }
.skeleton-subtitle { width: 42%; height: 12px; opacity: 0.8; }
.skeleton-pill { width: 72px; height: 28px; border-radius: 999px; }
.skeleton-label { width: calc(33.333% - 0.5rem); height: 36px; border-radius: 12px; }
.skeleton-notes { height: 48px; border-radius: 14px; }
.skeleton-band { height: 56px; border-radius: 14px; }
.skeleton-button { width: 96px; height: 40px; border-radius: 12px; }

@keyframes shimmer {
  to { transform: translateX(100%); }
}

@media (prefers-reduced-motion: reduce) {
  .provider-skeleton::after { animation: none; }
}
</style>
