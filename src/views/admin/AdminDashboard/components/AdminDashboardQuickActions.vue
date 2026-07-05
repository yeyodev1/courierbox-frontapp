<script setup lang="ts">
import DashboardPanelShell from './DashboardPanelShell.vue'

interface QuickAction {
  label: string
  icon: string
  route: string
  badge: string
  note: string
}

defineProps<{ actions: QuickAction[] }>()

const emit = defineEmits<{ navigate: [route: string] }>()
</script>

<template>
  <DashboardPanelShell title="Acceso rápido" subtitle="Atajos con datos" ariaLabel="Acceso rápido" :side="true">
    <div class="quick-actions">
      <button
        v-for="action in actions"
        :key="action.route"
        class="qa-btn"
        type="button"
        :aria-label="`Ir a ${action.label}`"
        @click="emit('navigate', action.route)"
      >
        <span class="qa-icon"><i class="fa-solid" :class="action.icon" aria-hidden="true" /></span>
        <span class="qa-label">{{ action.label }}</span>
        <span class="qa-badge">{{ action.badge }}</span>
        <small class="qa-note">{{ action.note }}</small>
      </button>
    </div>
  </DashboardPanelShell>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.quick-actions {
  display: grid;
  grid-template-columns: 1fr;
  gap: $space-2;
}

.qa-btn {
  display: flex;
  min-width: 0;
  padding: $space-3;
  border-radius: 12px;
  border: 1px solid rgba($ink-500, 0.1);
  background: rgba($ink-800, 0.35);
  color: $fg-dark;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  font-family: inherit;
  text-align: center;
  min-height: 96px;

  &:focus-visible {
    outline: 2px solid $brand-orange;
    outline-offset: 2px;
  }

  &:hover {
    transform: translateY(-2px);
    border-color: rgba($brand-orange, 0.2);
    background: rgba($ink-700, 0.45);
  }
}

.qa-icon {
  display: flex;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  align-items: center;
  justify-content: center;
  background: rgba($brand-orange, 0.12);
  color: $brand-orange;
  align-self: center;
}

.qa-label {
  font-size: 0.8rem;
  font-weight: 700;
  display: block;
  width: 100%;
}

.qa-badge {
  font-size: 0.72rem;
  font-weight: 700;
  color: $fg-dark;
  display: block;
  width: 100%;
}

.qa-note {
  font-size: 0.68rem;
  color: $ink-400;
  display: block;
  width: 100%;
}

@media (min-width: 640px) {
  .quick-actions { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (min-width: 860px) {
  .quick-actions { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
</style>
