<script setup lang="ts">
/** Quick contact creation so an income can be tied to a client without leaving caja. */
import { ref, watch } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import { emptyContactoForm, type NuevoContactoForm } from './useClienteSearch'

const props = defineProps<{ open: boolean; saving: boolean; nombreSugerido: string }>()
const emit = defineEmits<{ close: []; submit: [form: NuevoContactoForm] }>()

const form = ref<NuevoContactoForm>(emptyContactoForm())

// Carries over whatever the operator already typed in the client search box.
watch(
  () => props.open,
  (open) => {
    if (!open) return
    form.value = emptyContactoForm()
    form.value.clientName = props.nombreSugerido
  },
)
</script>

<template>
  <AppModal
    :show="open"
    title="Crear contacto"
    icon="fa-solid fa-address-book"
    icon-variant="info"
    max-width="560px"
    :prevent-close-on-overlay="saving"
    @close="emit('close')"
  >
    <p class="contact-modal-note">
      Este contacto se crea como un registro inicial para que luego puedas usarlo en caja.
    </p>

    <div class="modal-grid single-col">
      <label class="field full">
        <span>Nombre del cliente</span>
        <input v-model="form.clientName" class="field-input" placeholder="Nombre completo" />
      </label>
      <label class="field full">
        <span>Email</span>
        <input v-model="form.clientEmail" class="field-input" type="email" placeholder="correo@ejemplo.com" />
      </label>
      <label class="field full">
        <span>Teléfono</span>
        <input v-model="form.clientPhone" class="field-input" placeholder="0999999999" />
      </label>
    </div>

    <template #footer>
      <div class="modal-actions">
        <button type="button" class="btn-ghost" @click="emit('close')">Cancelar</button>
        <button type="button" class="btn-primary" :disabled="saving" @click="emit('submit', form)">
          <i :class="saving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-user-plus'" />
          {{ saving ? 'Creando...' : 'Crear contacto' }}
        </button>
      </div>
    </template>
  </AppModal>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use './caja-ui' as ui;

@include ui.fields;
@include ui.buttons;

.contact-modal-note {
  margin: 0 0 $space-4;
  color: $ink-300;
}
</style>
