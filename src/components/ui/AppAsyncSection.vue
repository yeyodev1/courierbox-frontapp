<script setup lang="ts">
/**
 * The four states every data-backed section has to render: loading, error,
 * empty and content. Views used to hand-roll each one (or skip the empty and
 * error branches entirely), which is why the app felt inconsistent while data
 * was in flight.
 *
 *   <AppAsyncSection :loading="loading" :error="error" :empty="!rows.length" @retry="load">
 *     <template #skeleton><AppSkeleton variant="table-row" :count="6" /></template>
 *     <DataTable :rows="rows" />
 *   </AppAsyncSection>
 */
import AppSkeleton from '@/components/ui/AppSkeleton.vue'

withDefaults(
  defineProps<{
    loading?: boolean
    /** Non-empty string (or Error) switches to the error state. */
    error?: string | null
    /** True switches to the empty state once loading finished without error. */
    empty?: boolean
    emptyTitle?: string
    emptyMessage?: string
    emptyIcon?: string
    errorTitle?: string
    /** Hides the retry button when there is nothing sensible to retry. */
    retryable?: boolean
    /** Rows rendered by the default skeleton when no #skeleton slot is given. */
    skeletonCount?: number
    skeletonVariant?: 'text' | 'title' | 'card' | 'circle' | 'pill' | 'table-row'
  }>(),
  {
    loading: false,
    error: null,
    empty: false,
    emptyTitle: 'Nada por aquí todavía',
    emptyMessage: '',
    emptyIcon: 'fa-solid fa-inbox',
    errorTitle: 'No pudimos cargar esto',
    retryable: true,
    skeletonCount: 4,
    skeletonVariant: 'card',
  }
)

defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="async-section">
    <div v-if="loading" class="async-section__loading" aria-busy="true" aria-live="polite">
      <slot name="skeleton">
        <AppSkeleton :variant="skeletonVariant" :count="skeletonCount" gap="0.75rem" />
      </slot>
      <span class="sr-only">Cargando…</span>
    </div>

    <div v-else-if="error" class="async-section__state is-error" role="alert">
      <i class="fa-solid fa-triangle-exclamation" aria-hidden="true" />
      <h3>{{ errorTitle }}</h3>
      <p>{{ error }}</p>
      <button v-if="retryable" type="button" class="async-section__retry" @click="$emit('retry')">
        <i class="fa-solid fa-rotate-right" aria-hidden="true" /> Reintentar
      </button>
    </div>

    <div v-else-if="empty" class="async-section__state">
      <slot name="empty">
        <i :class="emptyIcon" aria-hidden="true" />
        <h3>{{ emptyTitle }}</h3>
        <p v-if="emptyMessage">{{ emptyMessage }}</p>
      </slot>
    </div>

    <slot v-else />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use '@/styles/tokens/motion' as *;

.async-section {
  width: 100%;
}

.async-section__loading {
  animation: async-fade-in $dur-fast ease both;
}

.async-section__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $space-3;
  padding: $space-10 $space-6;
  text-align: center;
  border: 1px dashed rgba($ink-500, 0.28);
  border-radius: $radius-lg;
  background: rgba($ink-900, 0.5);
  animation: async-fade-in $dur-base ease both;

  > i {
    font-size: 1.6rem;
    color: $ink-400;
  }

  h3 {
    margin: 0;
    font-size: 1rem;
    color: $ink-200;
  }

  p {
    margin: 0;
    max-width: 46ch;
    color: $ink-300;
    font-size: 0.9rem;
  }

  &.is-error {
    border-color: rgba($signal-red, 0.35);
    background: rgba($signal-red, 0.06);

    > i {
      color: #ff8a8f;
    }
  }
}

.async-section__retry {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  min-height: 40px;
  padding: 0 $space-4;
  border-radius: $radius-md;
  border: 1px solid rgba($ink-500, 0.3);
  background: rgba($ink-700, 0.85);
  color: $ink-100;
  font: inherit;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background $dur-fast ease, border-color $dur-fast ease;

  &:hover {
    background: rgba($ink-600, 0.95);
    border-color: rgba($brand-orange, 0.4);
  }

  &:focus-visible {
    outline: 2px solid $brand-orange;
    outline-offset: 2px;
  }
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

@keyframes async-fade-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: none; }
}

@media (prefers-reduced-motion: reduce) {
  .async-section__loading,
  .async-section__state {
    animation: none;
  }
}
</style>
