<script setup lang="ts">
/** Provider catalogue tab: search, list and activate/deactivate. */
import type { Proveedor } from '@/services/proveedores.api'

defineProps<{ proveedores: Proveedor[]; loading: boolean }>()
const query = defineModel<string>('query', { required: true })

const emit = defineEmits<{
  search: []
  create: []
  edit: [proveedor: Proveedor]
  'toggle-activo': [proveedor: Proveedor]
}>()
</script>

<template>
  <div class="toolbar">
    <label class="filter search-filter">
      <i class="fa-solid fa-search" />
      <input v-model="query" class="field-input" placeholder="Buscar proveedor por nombre, tipo, país..." @input="emit('search')" />
    </label>
    <button class="btn-primary" @click="emit('create')"><i class="fa-solid fa-plus" /> Nuevo proveedor</button>
  </div>

  <div v-if="loading" class="loading"><i class="fa-solid fa-circle-notch fa-spin" /> Cargando...</div>
  <div v-else-if="!proveedores.length" class="empty"><i class="fa-solid fa-truck-field" /><p>No hay proveedores</p></div>

  <div v-else class="table-wrapper">
    <table class="envios-table">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Tipo / Ruta</th>
          <th>País</th>
          <th>Ciudad</th>
          <th>Contacto</th>
          <th>Teléfono</th>
          <th>Estado</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in proveedores" :key="p._id">
          <td><strong>{{ p.nombre }}</strong></td>
          <td>{{ p.tipo || '—' }}</td>
          <td>{{ p.pais || '—' }}</td>
          <td>{{ p.ciudad || '—' }}</td>
          <td>{{ p.contacto || '—' }}</td>
          <td>{{ p.telefono || '—' }}</td>
          <td><span class="badge" :class="p.activo ? 'badge-green' : 'badge-gray'">{{ p.activo ? 'Activo' : 'Inactivo' }}</span></td>
          <td>
            <div class="row-actions">
              <button class="btn-icon" title="Editar" @click="emit('edit', p)"><i class="fa-solid fa-pen" /></button>
              <button class="btn-icon" :title="p.activo ? 'Desactivar' : 'Activar'" @click="emit('toggle-activo', p)">
                <i :class="p.activo ? 'fa-solid fa-toggle-on' : 'fa-solid fa-toggle-off'" />
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use './envios-ui' as ui;

@include ui.table;
@include ui.badges;
@include ui.buttons;
@include ui.fields;
@include ui.states;
@include ui.toolbar;

.search-filter {
  display: flex;
  align-items: center;
  gap: $space-2;
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.15);
  border-radius: 12px;
  padding: $space-1 $space-3;

  i { color: $ink-400; }
  .field-input { background: transparent; border: none; padding: $space-1; min-width: 260px; }
}

.row-actions { display: flex; gap: $space-1; }
</style>
