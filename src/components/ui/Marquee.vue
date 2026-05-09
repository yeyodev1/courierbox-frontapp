<script setup lang="ts">
interface Props {
  speed?: number;
  reverse?: boolean;
}
withDefaults(defineProps<Props>(), { speed: 60, reverse: false });
</script>

<template>
  <div class="marquee" :style="{ '--speed': `${speed}s` }">
    <div :class="['marquee__track', { 'marquee__track--reverse': reverse }]">
      <div class="marquee__row"><slot /></div>
      <div class="marquee__row" aria-hidden="true"><slot /></div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.marquee {
  overflow: hidden;
  width: 100%;
  &__track {
    display: flex;
    gap: 4rem;
    width: max-content;
    animation: scroll var(--speed, 60s) linear infinite;
    &--reverse { animation-direction: reverse; }
  }
  &__row {
    display: flex;
    gap: 4rem;
    flex-shrink: 0;
    align-items: center;
  }
}
@keyframes scroll {
  to { transform: translateX(-50%); }
}
</style>
