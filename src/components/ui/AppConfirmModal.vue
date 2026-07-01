<script setup lang="ts">
interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'info'
}

withDefaults(defineProps<Props>(), {
  confirmLabel: 'Confirmar',
  cancelLabel: 'Cancelar',
  variant: 'danger',
})

const emit = defineEmits<{
  cancel: []
  confirm: []
}>()
</script>

<template>
  <transition name="fade">
    <div v-if="open" class="confirm-modal" @click.self="emit('cancel')">
      <div class="confirm-modal__card" :class="`is-${variant}`">
        <button class="confirm-modal__close" type="button" @click="emit('cancel')">
          <i class="fa-solid fa-xmark" />
        </button>
        <div class="confirm-modal__icon" :class="`is-${variant}`">
          <i :class="variant === 'danger' ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-circle-info'" />
        </div>
        <h3>{{ title }}</h3>
        <p>{{ message }}</p>
        <div class="confirm-modal__actions">
          <button type="button" class="btn-secondary" @click="emit('cancel')">{{ cancelLabel }}</button>
          <button type="button" class="btn-danger" @click="emit('confirm')">{{ confirmLabel }}</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.confirm-modal {
  position: fixed;
  inset: 0;
  z-index: 200;
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
  max-height: calc(100vh - 2rem);
  overflow: auto;

  @media (max-width: 640px) {
    max-width: none;
    padding: $space-5;
    max-height: calc(100vh - 1rem);
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
</style>
