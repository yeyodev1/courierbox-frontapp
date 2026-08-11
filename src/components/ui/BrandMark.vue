<script setup lang="ts">
/**
 * The Courier Box mark, and optionally the wordmark beside it.
 *
 * The source artwork sits on a 2048px canvas where the glyph only fills the
 * middle 47%, so `size` used to describe a box far larger than anything you
 * could see. This uses a version cropped to the artwork, which means `size` is
 * now the height of the mark itself.
 */
import courierboxMark from '@/assets/logo/courierbox-mark.png'

const props = withDefaults(
  defineProps<{
    /** Height of the mark. A number is read as px. */
    size?: number | string
    /** Show "Courier Box" next to the mark. */
    withWord?: boolean
    /** Second line under the wordmark — the panel a user is in, say. */
    subtitle?: string
    /** `plate` sets the mark on a brand-orange tile, for small dark surfaces. */
    variant?: 'bare' | 'plate'
    /** Wordmark colour. `invert` is for placing on the orange itself. */
    tone?: 'default' | 'invert'
  }>(),
  { size: 36, withWord: false, subtitle: '', variant: 'bare', tone: 'default' }
)

const px = (v: number | string) => (typeof v === 'number' ? `${v}px` : v)
</script>

<template>
  <div class="brand" :class="[`brand--${variant}`, `brand--${tone}`]">
    <span class="brand__plate" :style="{ '--mark-size': px(props.size) }">
      <img :src="courierboxMark" alt="Courier Box" class="brand__logo" />
    </span>

    <span v-if="withWord || subtitle" class="brand__text">
      <strong v-if="withWord" class="brand__word">Courier Box</strong>
      <span v-if="subtitle" class="brand__sub">{{ subtitle }}</span>
    </span>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/tokens/colors' as *;

.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.7em;
  user-select: none;
  min-width: 0;
}

.brand__plate {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}

.brand__logo {
  height: var(--mark-size);
  width: auto;
  display: block;
  object-fit: contain;
}

/* A tinted tile keeps the mark readable on busy or low-contrast surfaces. */
.brand--plate .brand__plate {
  padding: calc(var(--mark-size) * 0.26);
  border-radius: calc(var(--mark-size) * 0.32);
  background: rgba($brand-orange, 0.12);
  border: 1px solid rgba($brand-orange, 0.24);
}

.brand__text {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
  min-width: 0;
}

.brand__word {
  font-weight: 700;
  letter-spacing: -0.015em;
  color: $fg-dark;
  white-space: nowrap;
}

.brand__sub {
  font-size: 0.72em;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: $brand-orange;
  white-space: nowrap;
}

.brand--invert {
  .brand__word { color: $ink-1000; }
  .brand__sub { color: rgba($ink-1000, 0.68); }
}
</style>
