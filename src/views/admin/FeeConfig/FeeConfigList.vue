<script setup lang="ts">
/** The configured fee rules, with the default one called out. */
import type { FeeConfig } from '@/services/asesoria.api'
import { describeConfig } from './useFeeConfig'

defineProps<{ configs: FeeConfig[] }>()
const emit = defineEmits<{ 'set-default': [id: string]; remove: [id: string] }>()
</script>

<template>
  <div class="configs-list">
    <div v-for="config in configs" :key="config._id" class="config-card" :class="{ default: config.isDefault }">
      <div class="config-main">
        <div class="config-name">
          {{ config.name }}
          <span v-if="config.isDefault" class="default-badge">Por defecto</span>
        </div>
        <div class="config-desc">{{ describeConfig(config) }}</div>
      </div>
      <div class="config-actions">
        <button v-if="!config.isDefault" class="btn-ghost" @click="emit('set-default', config._id)">
          Hacer por defecto
        </button>
        <button class="btn-ghost danger" aria-label="Eliminar tarifa" @click="emit('remove', config._id)">
          <i class="fa-solid fa-trash" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use './fee-ui' as ui;

@include ui.buttons;

.configs-list {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.config-card {
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.12);
  border-radius: 16px;
  padding: $space-5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: $space-4;

  &.default { border-color: rgba($brand-orange, 0.25); }

  @media (max-width: 640px) { flex-direction: column; align-items: flex-start; }
}

.config-name {
  font-weight: 700;
  font-size: 1.05rem;
  display: flex;
  align-items: center;
  gap: $space-3;
  margin-bottom: $space-1;
}

.default-badge {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 3px 8px;
  border-radius: 20px;
  background: rgba($brand-orange, 0.12);
  color: $brand-orange;
}

.config-desc {
  color: $ink-400;
  font-size: 0.9rem;
}

.config-actions {
  display: flex;
  gap: $space-2;
}
</style>
