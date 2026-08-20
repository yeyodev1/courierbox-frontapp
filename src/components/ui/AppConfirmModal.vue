<script setup lang="ts">
import { computed, ref, toRef, useId } from 'vue'
import { useModalBehavior } from '@/composables/useModalBehavior'

interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'info'
  confirmLoading?: boolean
  /** Label shown on the confirm button while confirmLoading is true. */
  loadingLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  confirmLabel: 'Confirmar',
  cancelLabel: 'Cancelar',
  variant: 'danger',
  confirmLoading: false,
  loadingLabel: '',
})

const emit = defineEmits<{
  cancel: []
  confirm: []
}>()

const cardRef = ref<HTMLElement | null>(null)
const titleId = `confirm-title-${useId()}`
const descId = `confirm-desc-${useId()}`

const busyLabel = computed(
  () => props.loadingLabel || (props.variant === 'danger' ? 'Eliminando…' : 'Procesando…')
)

const iconClass = computed(() =>
  props.variant === 'danger'
    ? 'fa-solid fa-triangle-exclamation'
    : props.variant === 'warning'
      ? 'fa-solid fa-circle-exclamation'
      : 'fa-solid fa-circle-info'
)

useModalBehavior({
  isOpen: toRef(props, 'open'),
  container: cardRef,
  closable: () => !props.confirmLoading,
  onEscape: () => emit('cancel'),
})
</script>

<template>
  <Teleport to="body">
    <Transition name="confirm" appear>
      <!-- data-lenis-prevent: Lenis smooth-wheel would otherwise eat the wheel
           events of this teleported overlay and block scrolling on tall cards. -->
      <div
        v-if="open"
        class="confirm-modal"
        data-lenis-prevent
        @click.self="!confirmLoading && emit('cancel')"
      >
        <div
          ref="cardRef"
          class="confirm-modal__card"
          :class="`is-${variant}`"
          role="alertdialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          :aria-describedby="descId"
          tabindex="-1"
        >
          <button
            class="confirm-modal__close"
            type="button"
            data-modal-dismiss
            aria-label="Cerrar"
            :disabled="confirmLoading"
            @click="emit('cancel')"
          >
            <i class="fa-solid fa-xmark" />
          </button>

          <div class="confirm-modal__icon" :class="`is-${variant}`">
            <i :class="iconClass" />
          </div>

          <h3 :id="titleId">{{ title }}</h3>
          <p :id="descId">{{ message }}</p>

          <div class="confirm-modal__actions">
            <button
              type="button"
              class="confirm-btn confirm-btn--ghost"
              :disabled="confirmLoading"
              @click="emit('cancel')"
            >
              {{ cancelLabel }}
            </button>
            <button
              type="button"
              class="confirm-btn"
              :class="variant === 'info' ? 'confirm-btn--brand' : 'confirm-btn--danger'"
              :disabled="confirmLoading"
              :aria-busy="confirmLoading"
              @click="emit('confirm')"
            >
              <i v-if="confirmLoading" class="fa-solid fa-spinner fa-spin" />
              {{ confirmLoading ? busyLabel : confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
@use 'sass:color';
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use '@/styles/tokens/motion' as *;

.confirm-enter-active {
  transition: opacity $dur-fast ease;

  .confirm-modal__card {
    transition:
      opacity $dur-base ease,
      transform $dur-base $ease-spring;
  }
}

.confirm-leave-active {
  transition: opacity 0.16s ease;

  .confirm-modal__card {
    transition:
      opacity 0.14s ease,
      transform 0.16s ease-in;
  }
}

.confirm-enter-from,
.confirm-leave-to {
  opacity: 0;

  .confirm-modal__card {
    opacity: 0;
    transform: translateY(12px) scale(0.94);
  }
}

.confirm-leave-to .confirm-modal__card {
  transform: scale(0.97);
}

@media (prefers-reduced-motion: reduce) {
  .confirm-enter-active,
  .confirm-leave-active {
    transition-duration: 0.01ms;

    .confirm-modal__card {
      transition-duration: 0.01ms;
      transform: none !important;
    }
  }
}

.confirm-modal {
  position: fixed;
  inset: 0;
  /* Above AppModal (1000) so a confirm raised from inside a form modal wins. */
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-4;
  background: rgba($ink-1000, 0.8);
  backdrop-filter: blur(6px);
}

.confirm-modal__card {
  position: relative;
  width: 100%;
  max-width: 420px;
  padding: $space-8;
  border-radius: 20px;
  border: 1px solid rgba($ink-500, 0.15);
  background: $ink-900;
  text-align: center;
  max-height: calc(100svh - 2rem);
  overflow: auto;
  overscroll-behavior: contain;
  will-change: transform, opacity;

  &:focus {
    outline: none;
  }

  @media (max-width: 640px) {
    max-width: none;
    padding: $space-5;
    max-height: calc(100svh - 1rem);
  }
}

.confirm-modal__close {
  position: absolute;
  top: $space-3;
  right: $space-3;
  width: 36px;
  height: 36px;
  border: 1px solid rgba($ink-500, 0.18);
  border-radius: 10px;
  background: rgba($ink-800, 0.8);
  color: $ink-300;
  cursor: pointer;
  transition: color $dur-fast ease, background $dur-fast ease, border-color $dur-fast ease;

  &:hover:not(:disabled) {
    color: $fg-dark;
    border-color: rgba($signal-red, 0.35);
    background: rgba($signal-red, 0.12);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid $brand-orange;
    outline-offset: 2px;
  }
}

.confirm-modal__icon {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  margin: 0 auto $space-4;
  font-size: 1.2rem;

  &.is-danger,
  &.is-warning { background: rgba($signal-red, 0.12); color: #ff8a8f; }
  &.is-info { background: rgba($brand-orange, 0.12); color: $brand-orange; }
}

h3 { margin: 0 0 $space-3; }
p { margin: 0 0 $space-6; color: $ink-300; }

.confirm-modal__actions {
  display: flex;
  justify-content: center;
  gap: $space-3;

  @media (max-width: 640px) {
    flex-direction: column-reverse;
  }
}

/* Self-contained buttons: the app has no global .btn-* layer, so relying on the
   caller's scoped styles left these unstyled in most views. */
.confirm-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  min-height: 44px;
  padding: 0 $space-5;
  border-radius: 12px;
  border: 1px solid transparent;
  font: inherit;
  font-weight: 600;
  font-size: 0.92rem;
  cursor: pointer;
  transition: background $dur-fast ease, border-color $dur-fast ease, color $dur-fast ease,
    transform $dur-fast ease;

  &:active:not(:disabled) {
    transform: translateY(1px);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid $brand-orange;
    outline-offset: 2px;
  }
}

.confirm-btn--ghost {
  background: rgba($ink-700, 0.8);
  border-color: rgba($ink-500, 0.25);
  color: $ink-200;

  &:hover:not(:disabled) {
    background: rgba($ink-600, 0.9);
    color: $fg-dark;
  }
}

.confirm-btn--danger {
  background: $signal-red;
  color: #fff;

  &:hover:not(:disabled) {
    background: color.adjust($signal-red, $lightness: -6%);
  }
}

.confirm-btn--brand {
  background: $brand-orange;
  color: $ink-1000;

  &:hover:not(:disabled) {
    background: $brand-orange-soft;
  }
}
</style>
