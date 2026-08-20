<script setup lang="ts">
/** Step rail plus the audit history of the order. */
import { STATUS_STEPS, auditLabel, formatDate, type AuditEntry } from './useSeguirPedido'

defineProps<{ currentStepIndex: number; auditLog?: AuditEntry[] }>()
</script>

<template>
  <div class="seguir-steps">
    <div
      v-for="(step, idx) in STATUS_STEPS"
      :key="step.key"
      class="step"
      :class="{ active: idx <= currentStepIndex, current: idx === currentStepIndex }"
    >
      <div class="step-dot" />
      <span>{{ step.label }}</span>
    </div>
  </div>

  <div v-if="auditLog?.length" class="seguir-timeline">
    <h3>Historial</h3>
    <div v-for="entry in auditLog" :key="entry.timestamp" class="timeline-entry">
      <div class="timeline-dot" />
      <div class="timeline-body">
        <div class="timeline-action">{{ auditLabel(entry.action) }}</div>
        <div class="timeline-date">{{ formatDate(entry.timestamp) }}</div>
        <div v-if="entry.notes" class="timeline-notes">{{ entry.notes }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.seguir-steps {
  display: flex;
  justify-content: space-between;
  gap: 0;
  padding: $space-4 0;
  margin-bottom: $space-6;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 20px;
    left: 24px;
    right: 24px;
    height: 2px;
    background: rgba($ink-500, 0.2);
    z-index: 0;
  }
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-2;
  position: relative;
  z-index: 1;
  font-size: 0.7rem;
  color: $ink-500;
  text-align: center;

  &.active { color: $fg-dark; }
  &.current { color: $brand-orange; font-weight: 600; }
}

.step-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: $ink-600;
  border: 2px solid rgba($ink-500, 0.2);

  .active & { background: $brand-orange; border-color: $brand-orange; }
  .current & { box-shadow: 0 0 0 4px rgba($brand-orange, 0.15); }
}

.seguir-timeline {
  border-top: 1px solid rgba($ink-500, 0.1);
  padding-top: $space-6;

  h3 { font-size: 0.9rem; margin: 0 0 $space-4; color: $ink-300; }
}

.timeline-entry {
  display: flex;
  gap: $space-3;
  padding: $space-2 0;
  border-left: 2px solid rgba($brand-orange, 0.15);
  margin-left: 4px;

  &:last-child { border-left-color: transparent; }
}

.timeline-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: $brand-orange;
  flex-shrink: 0;
  margin-left: -6px;
  margin-top: 5px;
}

.timeline-body { flex: 1; }

.timeline-action { font-size: 0.85rem; font-weight: 600; color: $fg-dark; }
.timeline-date { font-size: 0.75rem; color: $ink-400; margin-top: 2px; }

.timeline-notes {
  font-size: 0.8rem;
  color: $ink-300;
  margin-top: $space-1;
  background: rgba($ink-700, 0.3);
  padding: $space-1 $space-2;
  border-radius: 6px;
}
</style>
