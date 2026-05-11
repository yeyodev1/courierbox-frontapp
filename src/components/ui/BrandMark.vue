<script setup lang="ts">
import logoImage from "@/assets/logo/image.png";

const props = defineProps({
  size: {
    type: [Number, String],
    default: 36,
  },
  withWord: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <div class="brand">
    <img
      :src="logoImage"
      alt="Courier Box"
      class="brand__logo"
      :style="{ height: typeof props.size === 'number' ? `${props.size}px` : props.size }"
    />
  </div>
</template>

<style lang="scss" scoped>
.brand {
  display: inline-flex;
  align-items: center;
  user-select: none;

  &__logo {
    width: auto;
    max-width: 100%;
    display: block;
    object-fit: contain;
  }
}
</style>
