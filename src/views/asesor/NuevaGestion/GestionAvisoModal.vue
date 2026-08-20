<script setup lang="ts">
/** Shared shell for the "resume draft" and "leave and discard" prompts. */
import AppOverlay from '@/components/ui/AppOverlay.vue'

withDefaults(
  defineProps<{
    open: boolean
    label: string
    title: string
    icon: string
    tone?: 'warn' | 'info'
    layer?: 'modal' | 'nested'
  }>(),
  { tone: 'warn', layer: 'modal' },
)

const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <AppOverlay :open="open" :layer="layer" :label="label" @close="emit('close')">
    <div class="card leave-modal">
      <div class="leave-icon" :class="tone"><i :class="icon" aria-hidden="true" /></div>
      <h2>{{ title }}</h2>
      <p><slot /></p>
      <div class="leave-actions"><slot name="actions" /></div>
    </div>
  </AppOverlay>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.leave-modal {
  width: min(460px, 100%);
  background: linear-gradient(180deg, rgba($ink-900, 0.98), rgba($ink-1000, 0.98));
  border: 1px solid rgba($brand-orange, 0.2);
  border-radius: 24px;
  padding: $space-6;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: $space-3;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5);

  h2 { margin: 0; font-size: 1.3rem; color: $fg-dark; }
  p { margin: 0; color: $ink-300; line-height: 1.55; }
}

.leave-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba($brand-orange, 0.14);
  color: $brand-orange;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;

  &.info { background: rgba($signal-blue, 0.14); color: $signal-blue; }
}

.leave-actions {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;
  justify-content: center;
  margin-top: $space-2;
}
</style>
