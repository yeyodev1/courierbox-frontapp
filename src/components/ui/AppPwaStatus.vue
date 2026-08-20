<script setup lang="ts">
/**
 * Two pieces of PWA feedback the operation actually needs:
 *  - a connection banner, so a driver knows why a save is not going through;
 *  - a mandatory update gate: `registerType: 'prompt'` hands us control of
 *    when the new build takes over, and we use it to block the UI until the
 *    user refreshes — a stale client must never keep talking to a newer API.
 */
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'

/** Every minute the worker asks the server whether a new build exists, so a
 *  deploy reaches open tabs without waiting for the user to navigate. */
const UPDATE_CHECK_MS = 60_000

const { needRefresh, updateServiceWorker } = useRegisterSW({
  onRegisteredSW(_url, registration) {
    if (!registration) return
    window.setInterval(() => registration.update().catch(() => {}), UPDATE_CHECK_MS)
  },
  onRegisterError(error: unknown) {
    console.warn('[pwa] service worker registration failed', error)
  },
})

// The update screen is deliberately not dismissable: a stale client talking
// to a newer API is how we end up with silent data bugs. Lock the page scroll
// underneath while it is showing.
watch(needRefresh, (value) => {
  document.documentElement.classList.toggle('pwa-update-lock', value)
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

  </div>

  <Teleport to="body">
    <Transition name="pwa-fade">
      <div
        v-if="needRefresh"
        class="pwa-update"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="pwa-update-title"
        data-lenis-prevent
      >
        <div class="pwa-update__card">
          <div class="pwa-update__icon">
            <i class="fa-solid fa-arrows-rotate" aria-hidden="true" />
          </div>
          <h2 id="pwa-update-title">Nueva versión disponible</h2>
          <p>
            Courier Box se actualizó. Para seguir trabajando con los datos correctos
            hay que refrescar la aplicación.
          </p>
          <button type="button" class="pwa-update__btn" :disabled="applying" @click="applyUpdate">
            <i v-if="applying" class="fa-solid fa-spinner fa-spin" aria-hidden="true" />
            {{ applying ? 'Actualizando…' : 'Actualizar ahora' }}
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
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

  @media (max-width: 480px) {
    flex-wrap: wrap;
    border-radius: $radius-lg;
  }
}

/* Full-screen, non-dismissable update gate. Sits above every modal (1000/1100)
   and above the status pills (1200). */
.pwa-update {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-4;
  background: rgba($ink-1000, 0.88);
  backdrop-filter: blur(8px);

  &__card {
    width: 100%;
    max-width: 420px;
    padding: $space-8;
    border-radius: 20px;
    border: 1px solid rgba($brand-orange, 0.35);
    background: $ink-900;
    text-align: center;
    color: $ink-100;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);

    h2 {
      margin: 0 0 $space-3;
      font-size: 1.25rem;
    }

    p {
      margin: 0 0 $space-6;
      color: $ink-300;
      font-size: 0.92rem;
      line-height: 1.5;
    }
  }

  &__icon {
    width: 56px;
    height: 56px;
    margin: 0 auto $space-4;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba($brand-orange, 0.14);
    color: $brand-orange;
    font-size: 1.4rem;
  }

  &__btn {
    width: 100%;
    min-height: 46px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: $space-2;
    border: none;
    border-radius: $radius-pill;
    background: $brand-orange;
    color: $ink-1000;
    font: inherit;
    font-weight: 700;
    font-size: 0.95rem;
    cursor: pointer;

    &:disabled { opacity: 0.7; cursor: wait; }

    &:focus-visible {
      outline: 2px solid $brand-orange;
      outline-offset: 3px;
    }
  }
}

:global(html.pwa-update-lock) {
  overflow: hidden !important;
}

.pwa-fade-enter-active,
.pwa-fade-leave-active {
  transition: opacity $dur-base ease;
}

.pwa-fade-enter-from,
.pwa-fade-leave-to {
  opacity: 0;
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
