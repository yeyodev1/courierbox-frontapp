<script setup lang="ts">
/**
 * The eight primary destinations. Each label is doubled inside a clipped box so
 * hovering slides the italic copy up in place of the plain one.
 */
import { MEGA_LINKS } from './mega-menu'
import type { ItemRefSetter } from './useMegaMenuReveal'

defineProps<{ currentPath: string; setItemRef: ItemRefSetter }>()
const emit = defineEmits<{ close: []; hover: [art: string] }>()
</script>

<template>
  <nav class="mega__nav" aria-label="Navegación principal">
    <ul>
      <li
        v-for="(l, i) in MEGA_LINKS"
        :key="l.to"
        :class="['mega__row', { 'is-active': currentPath === l.to }]"
        @mouseenter="emit('hover', l.art)"
        @focusin="emit('hover', l.art)"
      >
        <RouterLink :ref="setItemRef(i)" :to="l.to" class="mega__link" @click="emit('close')">
          <span class="mega__num">{{ l.num }}</span>
          <span class="mega__label">
            <span class="mega__label-clip">
              <span class="mega__label-text">{{ l.label }}</span>
              <span class="mega__label-text mega__label-text--alt" aria-hidden="true">{{ l.label }}</span>
            </span>
            <span class="mega__kicker">{{ l.kicker }}</span>
          </span>
          <span class="mega__arrow" aria-hidden="true">↗</span>
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/motion' as *;
@use '@/styles/mixins/responsive' as *;

.mega__nav ul {
  display: grid;
  padding: 0;
  margin: 0;
  list-style: none;
}

.mega__row {
  border-bottom: 1px solid var(--border);
  overflow: hidden;
  position: relative;
  transition: padding $dur-base $ease-out-expo;

  &:first-child { border-top: 1px solid var(--border); }
  &.is-active .mega__num { color: $brand-orange; }
}

.mega__link {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: baseline;
  gap: clamp(0.75rem, 2vw, 1.5rem);
  padding-block: clamp(0.85rem, 2.2vw, 1.4rem);
  color: var(--fg);
  text-decoration: none;
  position: relative;
  transition: color $dur-base $ease-out-expo, padding-left $dur-base $ease-out-expo;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 0;
    background: linear-gradient(90deg, $brand-orange, transparent);
    opacity: 0.12;
    transition: width $dur-base $ease-out-expo;
    pointer-events: none;
  }

  @include hover-supported {
    &:hover {
      padding-left: clamp(0.5rem, 2vw, 1.5rem);
      color: $brand-orange;

      &::before { width: 100%; }

      .mega__arrow { transform: translate(4px, -4px) rotate(0deg); opacity: 1; }
      .mega__label-text { transform: translateY(-100%); }
    }
  }
}

.mega__num {
  font-family: 'JetBrains Mono', monospace;
  font-size: clamp(0.7rem, 1.1vw, 0.85rem);
  color: var(--fg-faint);
  letter-spacing: 0.18em;
  align-self: flex-start;
  padding-top: 1.25rem;
}

.mega__label {
  display: grid;
  gap: 0.35rem;
  min-width: 0;
}

.mega__label-clip {
  display: block;
  position: relative;
  overflow: hidden;
  line-height: 0.95;
  height: clamp(2.3rem, 8.6vw, 7.2rem);
}

.mega__label-text {
  font-family: 'Fraunces', serif;
  font-weight: 500;
  font-size: clamp(2.4rem, 9vw, 7.5rem);
  line-height: 0.95;
  letter-spacing: -0.03em;
  display: block;
  transition: transform $dur-slow $ease-out-expo;
  will-change: transform;

  &--alt {
    color: $brand-orange;
    font-style: italic;
    font-weight: 400;
    position: absolute;
    top: 100%;
    left: 0;
  }
}

.mega__kicker {
  color: var(--fg-muted);
  font-size: clamp(0.85rem, 1.1vw, 1rem);
  margin-top: 0.25rem;
}

.mega__arrow {
  font-size: clamp(1.25rem, 2vw, 1.75rem);
  color: var(--fg-muted);
  align-self: flex-start;
  padding-top: 1rem;
  opacity: 0.5;
  transition: transform $dur-base $ease-out-expo, opacity $dur-base $ease-out-expo;
  transform: rotate(-30deg);
}

@media (prefers-reduced-motion: reduce) {
  .mega__row,
  .mega__link,
  .mega__label-text,
  .mega__arrow { transition: none; }
}
</style>
