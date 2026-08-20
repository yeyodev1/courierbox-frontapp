<script setup lang="ts">
/** Head-count of the team broken down by role. */
import { computed } from 'vue'

const props = defineProps<{
  stats: { total: number; admins: number; gerencia: number; superadmins: number; asesores: number; regUsers: number }
}>()

const cards = computed(() => [
  { key: 'total', label: 'Total Usuarios', icon: 'fa-users', tone: 'users', value: props.stats.total },
  { key: 'admins', label: 'Administradores', icon: 'fa-shield-halved', tone: 'admin', value: props.stats.admins },
  { key: 'gerencia', label: 'Gerencia', icon: 'fa-briefcase', tone: 'admin', value: props.stats.gerencia },
  { key: 'superadmins', label: 'Superadmin', icon: 'fa-user-shield', tone: 'admin', value: props.stats.superadmins },
  { key: 'asesores', label: 'Asesores', icon: 'fa-handshake', tone: 'asesor', value: props.stats.asesores },
  { key: 'regUsers', label: 'Usuarios', icon: 'fa-user', tone: 'user', value: props.stats.regUsers },
])
</script>

<template>
  <div class="stats-grid">
    <div v-for="card in cards" :key="card.key" class="stat-card">
      <span class="stat-icon" :class="card.tone"><i class="fa-solid" :class="card.icon" aria-hidden="true" /></span>
      <div class="stat-body">
        <span class="stat-value">{{ card.value }}</span>
        <span class="stat-label">{{ card.label }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $space-4;
  margin-bottom: $space-6;

  @media (max-width: 768px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 480px) { grid-template-columns: 1fr; }
}

.stat-card {
  display: flex;
  align-items: center;
  gap: $space-4;
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.12);
  border-radius: 16px;
  padding: $space-5;
  transition: all 0.2s;

  &:hover {
    border-color: rgba($ink-400, 0.25);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  }
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  flex-shrink: 0;

  &.users { background: rgba($signal-blue, 0.12); color: #6db6ff; }
  &.admin { background: rgba($signal-red, 0.12); color: #ff8a8f; }
  &.asesor { background: rgba($brand-orange, 0.12); color: $brand-orange; }
  &.user { background: rgba($signal-green, 0.12); color: $signal-green; }
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.2;
}

.stat-label {
  font-size: 0.75rem;
  color: $ink-400;
  margin-top: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .stat-card { transition: none; }
  .stat-card:hover { transform: none; }
}
</style>
