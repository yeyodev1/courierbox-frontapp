<script setup lang="ts">
import MarkSvg from "@/assets/logo/courierbox-mark.svg?raw";

interface Props {
  size?: number | string;
  withWord?: boolean;
}
withDefaults(defineProps<Props>(), { size: 36, withWord: false });
</script>

<template>
  <span class="brand">
    <span class="brand__mark" :style="{ width: typeof $props.size === 'number' ? `${$props.size}px` : $props.size, height: typeof $props.size === 'number' ? `${$props.size}px` : $props.size }" v-html="MarkSvg" />
    <span v-if="withWord" class="brand__word">
      Courier <strong>Box</strong>
    </span>
  </span>
</template>

<style scoped lang="scss">
.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--fg);

  &__mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--accent);
    flex-shrink: 0;

    :deep(svg) {
      width: 100%;
      height: 100%;
    }
  }

  &__word {
    font-family: "Inter Tight", sans-serif;
    font-weight: 500;
    letter-spacing: -0.02em;
    font-size: 1rem;

    strong { font-weight: 700; color: var(--accent); }
  }
}
</style>
