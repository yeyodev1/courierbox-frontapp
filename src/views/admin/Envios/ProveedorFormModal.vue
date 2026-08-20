<script setup lang="ts">
/** Create/edit a logistics provider. Rendered above the envío form as a nested layer. */
import AppOverlay from '@/components/ui/AppOverlay.vue'
import type { ProveedorForm } from './useProveedores'

defineProps<{ open: boolean; editing: boolean }>()
const form = defineModel<ProveedorForm>('form', { required: true })
const emit = defineEmits<{ close: []; save: [] }>()
</script>

<template>
  <AppOverlay :open="open" layer="nested" label="Proveedor" @close="emit('close')">
    <div class="modal-card">
      <div class="modal-icon-box info"><i class="fa-solid fa-truck-field" /></div>
      <h3>{{ editing ? 'Editar' : 'Nuevo' }} proveedor</h3>

      <div class="modal-body">
        <input v-model="form.nombre" class="field-input" placeholder="Nombre del proveedor *" />
        <input v-model="form.tipo" class="field-input" placeholder="Tipo o ruta (ej: Envío Expreso, Flota propia...)" />
        <div class="field-row">
          <input v-model="form.pais" class="field-input" placeholder="País de origen" />
          <input v-model="form.ciudad" class="field-input" placeholder="Ciudad" />
        </div>
        <div class="field-row">
          <input v-model="form.contacto" class="field-input" placeholder="Persona de contacto" />
          <input v-model="form.telefono" class="field-input" placeholder="Teléfono" />
        </div>
        <input v-model="form.email" class="field-input" type="email" placeholder="Email" />
        <textarea v-model="form.notas" class="field-input" rows="2" placeholder="Notas..." />
      </div>

      <div class="modal-actions">
        <button class="btn-ghost" @click="emit('close')">Cancelar</button>
        <button class="btn-primary" :disabled="!form.nombre" @click="emit('save')">
          <i class="fa-solid fa-check" /> {{ editing ? 'Guardar' : 'Crear' }}
        </button>
      </div>
    </div>
  </AppOverlay>
</template>

<style scoped lang="scss">
@use './envios-ui' as ui;

@include ui.modal-card;
@include ui.fields;
@include ui.buttons;
</style>
