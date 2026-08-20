<script setup lang="ts">
/** Decorative panel that swaps with whichever menu row is hovered. */
import { glyphFor } from './mega-menu'

defineProps<{ art: string }>()
</script>

<template>
  <aside class="mega__art" aria-hidden="true">
    <div class="mega__art-stage">
      <Transition name="art">
        <div :key="art" :class="['art', `art--${art}`]">
          <svg class="art__bg" viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <defs>
              <radialGradient id="g1" cx="20%" cy="10%" r="80%">
                <stop offset="0%" stop-color="#F08A1F" stop-opacity="0.6" />
                <stop offset="100%" stop-color="#06060A" stop-opacity="0" />
              </radialGradient>
              <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#1E1E27" />
                <stop offset="100%" stop-color="#06060A" />
              </linearGradient>
              <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.1" fill="#F08A1F" fill-opacity="0.18" />
              </pattern>
            </defs>
            <rect width="600" height="800" fill="url(#g2)" />
            <rect width="600" height="800" fill="url(#dots)" />
            <rect width="600" height="800" fill="url(#g1)" />
          </svg>

          <div class="art__glyph" aria-hidden="true"><span>{{ glyphFor(art) }}</span></div>

          <div class="art__caption">
            <span class="art__tag">{{ art }}</span>
            <span class="art__since">Operación 24/7 · Miami ↔ Ecuador</span>
          </div>
        </div>
      </Transition>
    </div>
  </aside>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/mixins/responsive' as *;

.mega__art {
  display: none;
  align-self: stretch;
  min-height: 420px;

  @include lg { display: block; }
}

.mega__art-stage {
  position: relative;
  height: 100%;
  min-height: 420px;
  border-radius: 24px;
  overflow: hidden;
  border: 1px solid var(--border);
}

.art {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-rows: 1fr auto;

  &__bg {
    width: 100%;
    height: 100%;
    position: absolute;
    inset: 0;
  }

  &__glyph {
    position: relative;
    z-index: 2;
    display: grid;
    place-items: center;
    height: 100%;
    font-size: clamp(8rem, 22vw, 18rem);
    line-height: 1;
    color: $brand-orange;
    text-shadow: 0 0 80px rgba($brand-orange, 0.45);
    font-family: 'Fraunces', serif;

    span { display: inline-block; animation: floaty 6s ease-in-out infinite; }
  }

  &__caption {
    position: relative;
    z-index: 2;
    display: flex;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    color: var(--fg);
    border-top: 1px solid rgba($ink-100, 0.1);
    background: rgba($ink-1000, 0.55);
    backdrop-filter: blur(10px);
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.78rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  &__tag { color: $brand-orange; }
  &__since { color: var(--fg-muted); }
}

@keyframes floaty {
  0%,
  100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}

.art-enter-active,
.art-leave-active {
  transition: opacity 0.45s ease, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.art-enter-from { opacity: 0; transform: scale(1.04); }
.art-leave-to { opacity: 0; transform: scale(0.98); }

@media (prefers-reduced-motion: reduce) {
  .art__glyph span,
  .art-enter-active,
  .art-leave-active { animation: none; transition: none; }
}
</style>
