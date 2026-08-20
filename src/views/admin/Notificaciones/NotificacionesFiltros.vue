<script setup lang="ts">
/** State filter chips plus the manual refresh. */
import { FILTROS, type FiltroEstado } from './useNotificaciones'

defineProps<{ activo: FiltroEstado; cargando: boolean }>()
const emit = defineEmits<{ filtrar: [estado: FiltroEstado]; refrescar: [] }>()
</script>

<template>
  <div class="filter-bar" aria-label="Filtrar por estado">
    <span class="filter-label">Estado</span>
    <div class="filter-options">
      <button
        v-for="filtro in FILTROS"
        :key="filtro.value || 'todos'"
        type="button"
        class="filter-button"
        :class="{ active: activo === filtro.value }"
        :aria-pressed="activo === filtro.value"
        :disabled="cargando"
        @click="emit('filtrar', filtro.value)"
      >
        {{ filtro.label }}
      </button>
    </div>
    <button type="button" class="refresh-button" :disabled="cargando" @click="emit('refrescar')">
      <i class="fa-solid fa-rotate" :class="{ spinning: cargando }" aria-hidden="true" />
      Actualizar
    </button>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use './notificaciones-ui' as ui;

@include ui.spinner;

.filter-bar {
  display: flex;
  align-items: center;
  gap: $space-3;
  flex-wrap: wrap;
  padding: $space-3;
  background: ui.$black-soft;
  border: 1px solid rgba(ui.$cream, 0.1);
  border-radius: 16px;
}

.filter-label {
  padding-left: $space-2;
  color: ui.$cream-muted;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.filter-options {
  display: flex;
  flex: 1;
  align-items: center;
  gap: $space-2;
  flex-wrap: wrap;
}

.filter-button {
  @include ui.interactive-button;

  padding: $space-2 $space-3;
  color: ui.$cream-muted;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 650;

  &:hover:not(:disabled) { color: #fff; border-color: rgba($brand-orange, 0.45); }
  &.active { color: ui.$black-soft; background: $brand-orange; border-color: $brand-orange; }
}

.refresh-button {
  @include ui.interactive-button;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  padding: $space-2 $space-3;
  color: ui.$cream;
  background: transparent;
  border: 1px solid rgba(ui.$cream, 0.22);
  border-radius: 10px;

  &:hover:not(:disabled) { color: $brand-orange; border-color: $brand-orange; }
}

@media (max-width: 560px) {
  .filter-bar { align-items: stretch; flex-direction: column; }
  .filter-label { padding-left: 0; }
  .filter-options { gap: $space-1; }
  .refresh-button { width: 100%; }
}
</style>
