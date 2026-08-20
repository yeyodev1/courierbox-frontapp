<script setup lang="ts">
/** The team roster with per-row edit and delete actions. */
import AppButton from '@/components/ui/AppButton.vue'
import type { AdminUser } from './useUsuarios'
import { roleBadge, roleLabel } from './useUsuarios'

defineProps<{ users: AdminUser[]; loading: boolean; currentUserId?: string }>()

const emit = defineEmits<{ create: []; edit: [user: AdminUser]; remove: [user: AdminUser] }>()
</script>

<template>
  <section class="content-card">
    <div class="card-head">
      <h3><i class="fa-solid fa-users-viewfinder" aria-hidden="true" /> Equipo Registrado</h3>
      <AppButton variant="primary" size="sm" @click="emit('create')">
        <i class="fa-solid fa-plus" aria-hidden="true" /> Agregar Usuario
      </AppButton>
    </div>

    <div v-if="loading" class="state-box">
      <span class="loader" />
      <p>Cargando usuarios...</p>
    </div>
    <div v-else-if="!users.length" class="state-box">
      <i class="fa-solid fa-inbox fa-2x" aria-hidden="true" />
      <p>No hay usuarios registrados aún.</p>
    </div>

    <div v-else class="table-scroll">
      <table class="data-table">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Rol</th>
            <th>Registro</th>
            <th class="text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u._id">
            <td>
              <div class="user-cell">
                <span class="user-avatar-sm">{{ u.name.charAt(0).toUpperCase() }}</span>
                <div>
                  <div class="cell-main">{{ u.name }}</div>
                  <div class="cell-sub">{{ u.email }}</div>
                </div>
              </div>
            </td>
            <td><span class="badge" :class="roleBadge(u.role)">{{ roleLabel(u.role) }}</span></td>
            <td class="cell-sub">{{ new Date(u.createdAt).toLocaleDateString() }}</td>
            <td class="text-right">
              <div class="action-group">
                <button class="btn-icon" aria-label="Editar usuario" title="Editar" @click="emit('edit', u)">
                  <i class="fa-solid fa-pen" aria-hidden="true" />
                </button>
                <button
                  v-if="u._id !== currentUserId"
                  class="btn-icon danger"
                  aria-label="Eliminar usuario"
                  title="Eliminar"
                  @click="emit('remove', u)"
                >
                  <i class="fa-regular fa-trash-can" aria-hidden="true" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use './usuarios-ui' as ui;

@include ui.icon-button;

.content-card {
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.12);
  border-radius: 16px;
  padding: $space-6;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-3;
  margin-bottom: $space-5;
  padding-bottom: $space-4;
  border-bottom: 1px solid rgba($ink-500, 0.08);

  h3 {
    display: flex;
    align-items: center;
    gap: $space-2;
    margin: 0;
    font-size: 1rem;
    font-weight: 600;

    i { color: $brand-orange; font-size: 0.9rem; }
  }
}

.table-scroll {
  overflow-x: auto;
  margin: 0 (-$space-6);
  padding: 0 $space-6;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 450px;

  th,
  td {
    padding: $space-3 $space-4;
    text-align: left;
    border-bottom: 1px solid rgba($ink-500, 0.1);
  }

  th {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: $ink-400;
    font-weight: 600;
  }

  tr:last-child td { border-bottom: none; }

  .cell-main { font-weight: 600; font-size: 0.9rem; }
  .cell-sub { font-size: 0.75rem; color: $ink-400; margin-top: 2px; }
  .text-right { text-align: right; }
}

.user-cell {
  display: flex;
  align-items: center;
  gap: $space-3;
}

.user-avatar-sm {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: linear-gradient(135deg, $ink-500, $ink-700);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.8rem;
  flex-shrink: 0;
}

.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;

  &.badge-info { background: rgba($signal-blue, 0.12); color: #6db6ff; border: 1px solid rgba($signal-blue, 0.2); }
  &.badge-orange { background: rgba($brand-orange, 0.12); color: $brand-orange; border: 1px solid rgba($brand-orange, 0.2); }
  &.badge-neutral { background: rgba($ink-400, 0.12); color: $ink-300; border: 1px solid rgba($ink-400, 0.2); }
}

.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $space-3;
  padding: 3rem 1rem;
  color: $ink-400;
  text-align: center;

  p { margin: 0; font-size: 0.9rem; }
  i { opacity: 0.5; }
}

.action-group {
  display: flex;
  gap: $space-2;
  justify-content: flex-end;
}

.loader {
  width: 20px;
  height: 20px;
  border: 3px solid rgba($ink-400, 0.2);
  border-bottom-color: $brand-orange;
  border-radius: 50%;
  display: inline-block;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .loader { animation-duration: 2s; }
}
</style>
