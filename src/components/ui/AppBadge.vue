<script setup lang="ts">
interface Props {
  tone?: "neutral" | "success" | "warning" | "danger" | "brand";
  pulse?: boolean;
}
withDefaults(defineProps<Props>(), { tone: "neutral", pulse: false });
</script>

<template>
  <span :class="['badge', `badge--${tone}`, { 'badge--pulse': pulse }]">
    <span class="badge__dot" aria-hidden="true" />
    <slot />
  </span>
</template>

<style scoped lang="scss">
@use "@/styles/tokens/colors" as *;

.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.04);

  &__dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: currentColor;
    box-shadow: 0 0 0 0 currentColor;
  }

  &--neutral { color: var(--fg-muted); }
  &--success { color: $signal-green; border-color: rgba($signal-green, 0.4); }
  &--warning { color: $signal-amber; border-color: rgba($signal-amber, 0.4); }
  &--danger  { color: $signal-red;   border-color: rgba($signal-red, 0.4); }
  &--brand   { color: $brand-orange; border-color: rgba($brand-orange, 0.5); background: rgba($brand-orange, 0.08); }

  &--pulse .badge__dot {
    animation: pulse 2s ease-in-out infinite;
  }
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 currentColor; }
  50% { box-shadow: 0 0 0 6px transparent; }
}
</style>
