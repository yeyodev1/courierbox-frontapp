<script setup lang="ts">
defineProps<{
  title: string
  subtitle: string
  ariaLabel: string
  main?: boolean
  side?: boolean
}>()
</script>

<template>
  <section class="panel" :class="{ 'panel-main': main, 'panel-side': side }" :aria-label="ariaLabel">
    <div class="card-head">
      <h3><slot name="title" />{{ title }}</h3>
      <span class="card-subtitle">{{ subtitle }}</span>
    </div>
    <slot />
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.panel {
  display: flex;
  flex-direction: column;
  gap: $space-4;
  padding: $space-5;
  width: 100%;
  min-width: 0;
  flex: 1 1 auto;
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.12);
  border-radius: 18px;
}

.panel-main {
  flex: 1 1 auto;
}

.panel-side {
  flex: 1 1 auto;
}

.card-head {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $space-1;
  padding-bottom: $space-3;
  border-bottom: 1px solid rgba($ink-500, 0.08);
  text-align: center;

  h3 {
    margin: 0;
    display: flex;
    align-items: center;
    gap: $space-2;
    font-size: 1rem;
    font-weight: 700;
    justify-content: center;
  }

  .card-subtitle {
    font-size: 0.75rem;
    color: $ink-400;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
}

@media (max-width: 860px) {
  .panel {
    flex-basis: 100%;
    width: 100%;
  }
}

@media (min-width: 860px) {
  .panel-main { flex: 2 1 640px; }
  .panel-side { flex: 1 1 320px; }
}
</style>
