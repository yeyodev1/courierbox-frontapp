<script setup lang="ts">
/**
 * Unopinionated modal shell: backdrop, entrance/exit motion, body scroll-lock,
 * focus trap, Escape and focus restoration.
 *
 * It owns none of the card styling — pass your existing markup through the
 * default slot. Because slot content is compiled in the parent, the parent's
 * scoped styles keep applying even though the overlay is teleported to <body>.
 */
import { computed, ref, toRef, useId } from 'vue'
import { useModalBehavior } from '@/composables/useModalBehavior'

const props = withDefaults(
  defineProps<{
    open: boolean
    /** Accessible name. Use `labelledby` instead when a visible heading exists. */
    label?: string
    labelledby?: string
    /** Blocks Escape and backdrop dismissal (e.g. while a request is in flight). */
    persistent?: boolean
    /** Stacking level. `nested` sits above a regular modal. */
    layer?: 'modal' | 'nested'
    /** Pin the card to the top on short viewports instead of centring it. */
    align?: 'center' | 'top'
    /** Extra classes for the element that wraps the slot and gets animated. */
    contentClass?: string
  }>(),
  {
    label: '',
    labelledby: '',
    persistent: false,
    layer: 'modal',
    align: 'center',
    contentClass: '',
  }
)

const emit = defineEmits<{ close: [] }>()

const contentRef = ref<HTMLElement | null>(null)
const fallbackId = `overlay-${useId()}`

const dismissible = computed(() => !props.persistent)

useModalBehavior({
  isOpen: toRef(props, 'open'),
  container: contentRef,
  closable: () => dismissible.value,
  onEscape: () => emit('close'),
})

function onBackdrop() {
  if (dismissible.value) emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="overlay" appear>
      <div
        v-if="open"
        class="app-overlay"
        :class="[`app-overlay--${layer}`, `app-overlay--${align}`]"
        @click.self="onBackdrop"
      >
        <div
          :id="fallbackId"
          ref="contentRef"
          class="app-overlay__content"
          :class="contentClass"
          role="dialog"
          aria-modal="true"
          :aria-label="labelledby ? undefined : label || undefined"
          :aria-labelledby="labelledby || undefined"
          tabindex="-1"
          @click.self="onBackdrop"
        >
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use '@/styles/tokens/motion' as *;

.overlay-enter-active {
  transition: opacity $dur-fast ease;

  .app-overlay__content {
    transition:
      opacity $dur-base ease,
      transform $dur-base $ease-out-expo;
  }
}

.overlay-leave-active {
  transition: opacity 0.16s ease;

  .app-overlay__content {
    transition:
      opacity 0.14s ease,
      transform 0.16s ease-in;
  }
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;

  .app-overlay__content {
    opacity: 0;
    transform: translateY(16px) scale(0.96);
  }
}

.overlay-leave-to .app-overlay__content {
  transform: translateY(6px) scale(0.985);
}

@media (prefers-reduced-motion: reduce) {
  .overlay-enter-active,
  .overlay-leave-active {
    transition-duration: 0.01ms;

    .app-overlay__content {
      transition-duration: 0.01ms;
      transform: none !important;
    }
  }
}

.app-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  justify-content: center;
  padding: $space-4;
  background: rgba($ink-1000, 0.82);
  backdrop-filter: blur(6px);
  overflow-y: auto;
  overscroll-behavior: contain;

  &--modal { z-index: 1000; }
  &--nested { z-index: 1100; }

  &--center { align-items: center; }
  &--top { align-items: flex-start; }

  @media (max-width: 640px) {
    align-items: flex-start;
    padding: $space-3 $space-2;
  }
}

/* Full-width row so a slotted card can size itself with either `width: 100%;
   max-width: X` or `width: min(X, 100%)`. Clicks landing in the side gutters
   still dismiss, handled by @click.self on this element. */
.app-overlay__content {
  will-change: transform, opacity;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;

  &:focus {
    outline: none;
  }

  > :deep(*) {
    max-width: 100%;
  }
}
</style>
