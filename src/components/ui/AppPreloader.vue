<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import BrandMark from "@/components/ui/BrandMark.vue";

/**
 * The curtain used to lift on a hard-coded 2.2s timer, so it hid a fast load
 * and lied about a slow one. It now tracks real signals — router readiness,
 * webfonts, and the window load event — bounded by a minimum on-screen time so
 * it doesn't flash, and a hard cap so a stalled asset can't trap the user.
 */

const MIN_VISIBLE_MS = 700;
const MAX_VISIBLE_MS = 5000;
const SESSION_KEY = 'cb:preloader-shown';

// Milestone weights: the bar advances when something real completes.
const MILESTONES = { mounted: 20, router: 45, fonts: 75, window: 100 } as const;

const isLoaded = ref(false);
const dismissed = ref(false);
const progress = ref(0);

const router = useRouter();
const startedAt = Date.now();
const timers: number[] = [];
let removeWindowLoad: (() => void) | null = null;

const barScale = computed(() => Math.min(1, progress.value / 100));

function advance(to: number) {
  if (to > progress.value) progress.value = to;
}

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function finish() {
  if (isLoaded.value) return;
  advance(100);
  const elapsed = Date.now() - startedAt;
  const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
  timers.push(
    window.setTimeout(() => {
      isLoaded.value = true;
      // Unmount once the curtain finished sliding so it can never eat clicks.
      timers.push(window.setTimeout(() => (dismissed.value = true), 1100));
    }, wait)
  );
}

onMounted(async () => {
  // Already greeted this session (or motion is unwelcome) — don't replay it.
  if (sessionStorage.getItem(SESSION_KEY) || prefersReducedMotion()) {
    dismissed.value = true;
    return;
  }
  sessionStorage.setItem(SESSION_KEY, '1');

  advance(MILESTONES.mounted);

  // Hard cap: never hold the page hostage to a stalled asset.
  timers.push(window.setTimeout(finish, MAX_VISIBLE_MS));

  const signals: Promise<unknown>[] = [
    router.isReady().then(() => advance(MILESTONES.router)),
  ];

  if (document.fonts?.ready) {
    signals.push(document.fonts.ready.then(() => advance(MILESTONES.fonts)));
  } else {
    advance(MILESTONES.fonts);
  }

  signals.push(
    new Promise<void>((resolve) => {
      if (document.readyState === 'complete') {
        advance(MILESTONES.window);
        resolve();
        return;
      }
      const onLoad = () => {
        advance(MILESTONES.window);
        resolve();
      };
      window.addEventListener('load', onLoad, { once: true });
      removeWindowLoad = () => window.removeEventListener('load', onLoad);
    })
  );

  await Promise.allSettled(signals);
  finish();
});

onBeforeUnmount(() => {
  timers.forEach((t) => window.clearTimeout(t));
  removeWindowLoad?.();
});
</script>

<template>
  <div v-if="!dismissed" class="preloader-curtain" :class="{ 'is-loaded': isLoaded }">
    <div class="curtain-panel curtain-left"></div>
    <div class="curtain-panel curtain-right"></div>

    <div class="preloader-content">
      <div class="logo-wrapper">
        <div class="brand-logo-container">
           <BrandMark :size="72" with-word />
        </div>

        <div class="loading-status">
          <div class="loading-text">Cargando experiencia...</div>
          <div
            class="progress-line"
            role="progressbar"
            aria-label="Cargando"
            :aria-valuenow="Math.round(progress)"
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <div class="progress-line-inner" :style="{ transform: `scaleX(${barScale})` }"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.preloader-curtain {
  position: fixed;
  inset: 0;
  z-index: 999999;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.curtain-panel {
  position: absolute;
  top: 0;
  width: 50vw;
  height: 100vh;
  background: #09090b;
  transition: transform 1s cubic-bezier(0.77, 0, 0.175, 1);
  pointer-events: auto;
  will-change: transform;
}

.curtain-left {
  left: 0;
  transform-origin: left;
}

.curtain-right {
  right: 0;
  transform-origin: right;
  border-left: 1px solid rgba(255, 255, 255, 0.03);
}

.preloader-content {
  position: relative;
  z-index: 2;
  transition: opacity 0.6s ease, transform 0.6s ease;
  will-change: opacity, transform;
}

.logo-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2.5rem;
}

.brand-logo-container {
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0% 100%);
  animation: revealLogo 1.2s cubic-bezier(0.77, 0, 0.175, 1) forwards, pulseGlow 2.5s infinite ease-in-out;
  transform-origin: center;
}

.loading-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.2rem;
  animation: fadeIn 0.8s ease 0.6s forwards;
  opacity: 0;
}

.loading-text {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.35em;
  font-weight: 500;
}

.progress-line {
  width: 220px;
  height: 2px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
  border-radius: 4px;
}

.progress-line-inner {
  height: 100%;
  width: 100%;
  background: #ff5e00; // brand orange
  transform-origin: left;
  transform: scaleX(0);
  transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform;
}

// When loaded
.is-loaded {
  .curtain-left {
    transform: translateX(-100%);
  }
  .curtain-right {
    transform: translateX(100%);
  }
  
  .preloader-content {
    opacity: 0;
    transform: scale(0.92);
  }
}

@keyframes revealLogo {
  0% { transform: translateY(40px) scale(0.95); opacity: 0; clip-path: polygon(0 100%, 100% 100%, 100% 100%, 0% 100%); }
  100% { transform: translateY(0) scale(1); opacity: 1; clip-path: polygon(0 0, 100% 0, 100% 100%, 0% 100%); }
}

@keyframes fadeIn {
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
}

@keyframes pulseGlow {
  0%, 100% { filter: drop-shadow(0 0 10px rgba(255, 94, 0, 0.15)); }
  50% { filter: drop-shadow(0 0 30px rgba(255, 94, 0, 0.5)); }
}
</style>
