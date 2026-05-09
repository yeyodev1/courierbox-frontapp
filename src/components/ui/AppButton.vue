<script setup lang="ts">
interface Props {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  as?: "button" | "a" | "router-link";
  to?: string;
  href?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  loading?: boolean;
  block?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: "primary",
  size: "md",
  as: "button",
  type: "button",
  disabled: false,
  loading: false,
  block: false,
});
</script>

<template>
  <component
    :is="props.as === 'router-link' ? 'router-link' : props.as"
    :to="props.as === 'router-link' ? props.to : undefined"
    :href="props.as === 'a' ? props.href : undefined"
    :type="props.as === 'button' ? props.type : undefined"
    :disabled="props.as === 'button' ? props.disabled || props.loading : undefined"
    :class="['btn', `btn--${props.variant}`, `btn--${props.size}`, { 'btn--block': props.block, 'is-loading': props.loading }]"
  >
    <span v-if="props.loading" class="btn__spinner" aria-hidden="true" />
    <span class="btn__content"><slot /></span>
    <span class="btn__arrow" aria-hidden="true">→</span>
  </component>
</template>

<style scoped lang="scss">
@use "@/styles/tokens/colors" as *;
@use "@/styles/tokens/space" as *;
@use "@/styles/tokens/motion" as *;
@use "@/styles/mixins/responsive" as *;

.btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: $radius-pill;
  font-family: inherit;
  font-weight: 500;
  letter-spacing: -0.01em;
  cursor: pointer;
  white-space: nowrap;
  transition:
    background $dur-base $ease-out-expo,
    color $dur-base $ease-out-expo,
    transform $dur-base $ease-out-expo,
    border-color $dur-base $ease-out-expo;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  border: 1px solid transparent;

  &:disabled, &.is-loading {
    opacity: 0.55;
    cursor: not-allowed;
  }

  &__arrow {
    display: inline-block;
    transition: transform $dur-base $ease-out-expo;
  }

  @include hover-supported {
    &:hover:not(:disabled):not(.is-loading) {
      transform: translateY(-1px);
      .btn__arrow { transform: translateX(4px); }
    }
  }

  &--sm { padding: 0.6rem 1.1rem; font-size: 0.875rem; min-height: 40px; }
  &--md { padding: 0.85rem 1.5rem; font-size: 0.95rem; min-height: 48px; }
  &--lg { padding: 1.05rem 1.9rem; font-size: 1rem; min-height: 56px; }

  &--block { width: 100%; }

  &--primary {
    background: $brand-orange;
    color: $ink-1000;
    &:hover:not(:disabled) { background: $brand-orange-soft; }
  }

  &--secondary {
    background: $ink-100;
    color: $ink-1000;
    &:hover:not(:disabled) { background: $ink-200; }
  }

  &--ghost {
    background: transparent;
    color: var(--fg);
    &:hover:not(:disabled) { background: rgba($ink-100, 0.06); }
  }

  &--outline {
    background: transparent;
    color: var(--fg);
    border-color: var(--border-strong);
    &:hover:not(:disabled) { border-color: $brand-orange; color: $brand-orange; }
  }

  &__spinner {
    width: 14px; height: 14px;
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
