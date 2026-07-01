<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: '',
  },
  iconVariant: {
    type: String,
    default: 'info', // 'info', 'warn', 'success'
  },
  maxWidth: {
    type: String,
    default: '600px',
  },
  preventCloseOnOverlay: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits<{
  (e: 'close'): void
}>()

function handleOverlayClick() {
  if (!props.preventCloseOnOverlay) {
    emit('close')
  }
}

function handleEscape(e: KeyboardEvent) {
  if (props.show && e.key === 'Escape' && !props.preventCloseOnOverlay) {
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
})
</script>

<template>
  <transition name="fade">
    <div v-if="show" class="modal-overlay" @click.self="handleOverlayClick">
      <div class="modal-card" :style="{ maxWidth: maxWidth }">
        <button type="button" class="modal-close-btn" aria-label="Cerrar modal" @click="emit('close')">
          <i class="fa-solid fa-xmark" />
        </button>

        <slot name="header"></slot>

        <div class="modal-scroll" data-lenis-prevent>
          <div v-if="icon" class="modal-icon-box" :class="iconVariant">
            <i :class="icon" />
          </div>
          <h3 v-if="title">{{ title }}</h3>
          
          <slot></slot>
        </div>

        <div v-if="$slots.footer" class="modal-actions-fixed">
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  </transition>
</template>

<style lang="scss" scoped>
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba($ink-1000, 0.75);
  backdrop-filter: blur(6px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-4;

  @media (max-width: 640px) {
    align-items: flex-start;
    padding: $space-2;
  }
}

.modal-card {
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.15);
  border-radius: 20px;
  width: 100%;
  text-align: left;
  position: relative;
  
  /* Flex layout to enforce strict heights for scrolling */
  height: calc(100svh - 4rem) !important;
  max-height: 800px !important;
  overflow: hidden !important;
  display: flex !important;
  flex-direction: column !important;
  padding: 0 !important;

  @media (max-width: 640px) {
    max-width: none !important;
    border-radius: 16px;
    height: calc(100svh - 2rem) !important;
    margin-top: $space-2;
  }
}

.modal-close-btn {
  position: absolute;
  top: $space-3;
  right: $space-3;
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba($ink-500, 0.18);
  border-radius: 10px;
  background: rgba($ink-800, 0.8);
  color: $ink-300;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 2;

  &:hover {
    color: $fg-dark;
    border-color: rgba($signal-red, 0.35);
    background: rgba($signal-red, 0.12);
  }
}

.modal-scroll {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: $space-8;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;

  @media (max-width: 640px) {
    padding: $space-4;
  }

  h3 {
    text-align: center;
    font-size: 1.15rem;
    margin: 0 0 $space-6;
    
    @media (max-width: 640px) {
      font-size: 1.05rem;
      margin-bottom: $space-4;
    }
  }
}

.modal-icon-box {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto $space-4;
  font-size: 1.2rem;

  &.info {
    background: rgba($brand-orange, 0.12);
    color: $brand-orange;
  }
  &.warn {
    background: rgba($signal-red, 0.12);
    color: #ff8a8f;
  }
  &.success {
    background: rgba(#9ae6b4, 0.12);
    color: #9ae6b4;
  }
}

.modal-actions-fixed {
  flex: 0 0 auto;
  padding: $space-4 $space-8;
  background: $ink-900;
  border-top: 1px solid rgba($ink-500, 0.15);

  @media (max-width: 640px) {
    padding: $space-4;
  }
}
</style>
