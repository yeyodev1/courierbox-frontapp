<script setup lang="ts">
import { computed } from "vue";

interface Props {
  text: string;
  tag?: string;
  by?: "word" | "char";
  stagger?: number;
}

const props = withDefaults(defineProps<Props>(), { tag: "h2", by: "word", stagger: 0.04 });

const tokens = computed(() =>
  props.by === "word" ? props.text.split(/(\s+)/) : Array.from(props.text)
);
</script>

<template>
  <component :is="tag" class="reveal-text" data-reveal-group>
    <span
      v-for="(t, i) in tokens"
      :key="i"
      class="reveal-text__token"
      :class="{ 'reveal-text__space': /^\s+$/.test(t) }"
    >
      <span data-reveal :style="{ transitionDelay: `${i * stagger}s` }">{{ t }}</span>
    </span>
  </component>
</template>

<style scoped lang="scss">
.reveal-text {
  display: block;
  &__token {
    display: inline-block;
    overflow: hidden;
    line-height: inherit;
    > span { display: inline-block; }
  }
  &__space { white-space: pre; }
}
</style>
