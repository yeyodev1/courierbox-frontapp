<script setup lang="ts">
/**
 * Skeleton placeholder. One shimmer definition lives in styles/base/_global.scss
 * (`.u-skel`); this component only supplies the shapes.
 *
 *   <AppSkeleton variant="text" :count="3" />
 *   <AppSkeleton variant="card" height="180px" />
 *   <AppSkeleton variant="table-row" :count="6" />
 */
withDefaults(
  defineProps<{
    variant?: 'text' | 'title' | 'card' | 'circle' | 'pill' | 'table-row'
    /** How many placeholders to render. */
    count?: number
    /** Overrides the variant's default height. */
    height?: string
    /** Overrides the variant's default width. */
    width?: string
    /** Gap between repeated placeholders. */
    gap?: string
  }>(),
  {
    variant: 'text',
    count: 1,
    height: '',
    width: '',
    gap: '0.5rem',
  }
)
</script>

<template>
  <div
    class="skel-group"
    :class="`skel-group--${variant}`"
    :style="{ gap }"
    aria-hidden="true"
  >
    <span
      v-for="n in count"
      :key="n"
      class="u-skel skel"
      :class="`skel--${variant}`"
      :style="{ height: height || undefined, width: width || undefined }"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/space' as *;

.skel-group {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.skel-group--circle,
.skel-group--pill {
  flex-direction: row;
  align-items: center;
}

.skel--text {
  height: 0.85rem;
  width: 100%;

  /* Ragged last line reads as text rather than a solid block. */
  &:last-child:not(:only-child) {
    width: 62%;
  }
}

.skel--title {
  height: 1.5rem;
  width: 45%;
  border-radius: $radius-sm;
}

.skel--card {
  height: 120px;
  width: 100%;
  border-radius: $radius-md;
}

.skel--circle {
  height: 40px;
  width: 40px;
  border-radius: 50%;
  flex: 0 0 auto;
}

.skel--pill {
  height: 28px;
  width: 88px;
  border-radius: $radius-pill;
  flex: 0 0 auto;
}

.skel--table-row {
  height: 46px;
  width: 100%;
  border-radius: $radius-sm;
}

@media (prefers-reduced-motion: reduce) {
  .skel {
    animation: none;
  }
}
</style>
