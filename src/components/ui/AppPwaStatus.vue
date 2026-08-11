<script setup lang="ts">
/**
 * Two pieces of PWA feedback the operation actually needs:
 *  - a connection banner, so a driver knows why a save is not going through;
 *  - an update prompt, because `registerType: 'prompt'` means a new build only
 *    takes over when the user says so (never mid-delivery).
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'

const { needRefresh, updateServiceWorker } = useRegisterSW({
  onRegisterError(error: unknown) {
    console.warn('[pwa] service worker registration failed', error)
  },
})

const online = ref(true)
const wasOffline = ref(false)
const applying = ref(false)

function sync() {
  const next = navigator.onLine
  if (!next) wasOffline.value = true
  online.value = next
  // Keep the "back online" note briefly, then let it go.
  if (next && wasOffline.value) {
    window.setTimeout(() => (wasOffline.value = false), 3500)
  }
}

async function applyUpdate() {
  applying.value = true
  await updateServiceWorker(true)
}

onMounted(() => {
  sync()
  window.addEventListener('online', sync)
  window.addEventListener('offline', sync)
})

onBeforeUnmount(() => {
  window.removeEventListener('online', sync)
  window.removeEventListener('offline', sync)
})
</script>

<template>
  <div class="pwa-status" aria-live="polite">
    <Transition name="pwa-slide">
      <div v-if="!online" class="pwa-pill is-offline" role="status">
        <i class="fa-solid fa-wifi" aria-hidden="true" />
        <span>Sin conexión — verás los últimos datos guardados</span>
      </div>
      <div v-else-if="wasOffline" class="pwa-pill is-online" role="status">
        <i class="fa-solid fa-circle-check" aria-hidden="true" />
        <span>Conexión restablecida</span>
      </div>
    </Transition>

    <Transition name="pwa-slide">
      <div v-if="needRefresh" class="pwa-pill is-update" role="status">
        <i class="fa-solid fa-arrows-rotate" aria-hidden="true" />
        <span>Hay una versión nueva</span>
        <button type="button" :disabled="applying" @click="applyUpdate">
          {{ applying ? 'Actualizando…' : 'Actualizar' }}
        </button>
        <button type="button" class="ghost" @click="needRefresh = false">Después</button>
      </div>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use '@/styles/tokens/motion' as *;

.pwa-status {
  position: fixed;
  left: 50%;
  bottom: max($space-4, env(safe-area-inset-bottom));
  transform: translateX(-50%);
  z-index: 1200;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-2;
  pointer-events: none;
  width: min(calc(100vw - 2rem), 520px);
}

.pwa-pill {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-3 $space-4;
  border-radius: $radius-pill;
  background: rgba($ink-800, 0.95);
  border: 1px solid rgba($ink-500, 0.3);
  backdrop-filter: blur(10px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.45);
  color: $ink-100;
  font-size: 0.85rem;

  > span {
    flex: 1 1 auto;
  }

  &.is-offline {
    border-color: rgba($signal-amber, 0.45);
    color: $signal-amber;
  }

  &.is-online {
    border-color: rgba($signal-green, 0.45);
    color: $signal-green;
  }

  &.is-update {
    border-color: rgba($brand-orange, 0.45);
  }

  button {
    flex: 0 0 auto;
    min-height: 32px;
    padding: 0 $space-3;
    border-radius: $radius-pill;
    border: none;
    background: $brand-orange;
    color: $ink-1000;
    font: inherit;
    font-weight: 600;
    font-size: 0.8rem;
    cursor: pointer;

    &:disabled { opacity: 0.6; cursor: not-allowed; }

    &.ghost {
      background: transparent;
      color: $ink-300;
      border: 1px solid rgba($ink-500, 0.35);
    }

    &:focus-visible {
      outline: 2px solid $brand-orange;
      outline-offset: 2px;
    }
  }

  @media (max-width: 480px) {
    flex-wrap: wrap;
    border-radius: $radius-lg;
  }
}

.pwa-slide-enter-active,
.pwa-slide-leave-active {
  transition: opacity $dur-fast ease, transform $dur-base $ease-out-expo;
}

.pwa-slide-enter-from,
.pwa-slide-leave-to {
  opacity: 0;
  transform: translateY(14px);
}

@media (prefers-reduced-motion: reduce) {
  .pwa-slide-enter-active,
  .pwa-slide-leave-active {
    transition-duration: 0.01ms;
    transform: none;
  }
}
</style>
