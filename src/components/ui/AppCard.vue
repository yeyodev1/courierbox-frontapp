<script setup lang="ts">
interface Props {
  hover?: boolean;
  padded?: boolean;
}
withDefaults(defineProps<Props>(), { hover: true, padded: true });
</script>

<template>
  <article :class="['card', { 'card--hover': hover, 'card--padded': padded }]">
    <slot />
  </article>
</template>

<style scoped lang="scss">
@use "@/styles/tokens/colors" as *;
@use "@/styles/tokens/space" as *;
@use "@/styles/tokens/motion" as *;
@use "@/styles/mixins/responsive" as *;

.card {
  position: relative;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: $radius-lg;
  overflow: hidden;
  transition:
    transform $dur-base $ease-out-expo,
    border-color $dur-base $ease-out-expo,
    background $dur-base $ease-out-expo;

  &--padded { padding: clamp(1.5rem, 3vw, 2.5rem); }

  &--hover {
    @include hover-supported {
      &:hover {
        transform: translateY(-4px);
        border-color: rgba($brand-orange, 0.6);
        background: var(--surface);
      }
    }
  }
}
</style>
