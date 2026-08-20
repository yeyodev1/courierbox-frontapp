<script setup lang="ts">
/** Quick client creation, with the phone stored against its country code. */
import { computed, ref, watch } from 'vue'
import AppOverlay from '@/components/ui/AppOverlay.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { PHONE_COUNTRIES, toLocalPhone } from './step-cliente'

export interface NuevoClienteForm {
  nombre: string
  email: string
  telefono: string
  cedula: string
  notas: string
  phoneCountry: string
}

const props = defineProps<{ open: boolean; creating: boolean; error: string }>()
const emit = defineEmits<{ close: []; submit: [form: NuevoClienteForm] }>()

function emptyForm(): NuevoClienteForm {
  return { nombre: '', email: '', telefono: '', cedula: '', notas: '', phoneCountry: '593' }
}

const form = ref<NuevoClienteForm>(emptyForm())

const country = computed(
  () => PHONE_COUNTRIES.find((c) => c.code === form.value.phoneCountry) ?? PHONE_COUNTRIES[0],
)

watch(
  () => props.open,
  (open) => {
    if (open) form.value = emptyForm()
  },
)

function onPhoneInput(event: Event) {
  form.value.telefono = toLocalPhone((event.target as HTMLInputElement).value, form.value.phoneCountry)
}
</script>

<template>
  <AppOverlay :open="open" label="Nuevo cliente" @close="emit('close')">
    <div class="modal-card">
      <div class="modal-head">
        <div>
          <span class="history-label">Alta rápida</span>
          <h4>Nuevo cliente</h4>
          <p>Guardamos cédula, email y teléfono sin duplicar registros.</p>
        </div>
        <button class="btn-close" aria-label="Cerrar" @click="emit('close')">
          <i class="fa-solid fa-xmark" />
        </button>
      </div>

      <div class="modal-grid">
        <AppInput v-model="form.nombre" label="Nombre completo *" placeholder="Juan Pérez" />
        <AppInput v-model="form.email" label="Email" placeholder="juan@email.com" type="email" />

        <div class="phone-field">
          <span class="field-label">Teléfono</span>
          <div class="phone-group">
            <select v-model="form.phoneCountry" class="phone-country">
              <option v-for="c in PHONE_COUNTRIES" :key="c.code" :value="c.code">
                {{ c.label }} (+{{ c.code }})
              </option>
            </select>
            <div class="phone-input">
              <span class="phone-prefix">+{{ country?.code }}</span>
              <input
                :value="form.telefono"
                class="phone-text"
                inputmode="numeric"
                :placeholder="country?.placeholder"
                @input="onPhoneInput"
              />
            </div>
          </div>
          <small class="phone-hint">El número se guarda con el código del país seleccionado.</small>
        </div>

        <AppInput v-model="form.cedula" label="Cédula" placeholder="0102030405" />
      </div>

      <AppInput v-model="form.notas" label="Notas" placeholder="Información adicional..." />

      <p v-if="error" class="field-error">{{ error }}</p>

      <div class="modal-actions-row">
        <AppButton variant="outline" @click="emit('close')">Cancelar</AppButton>
        <AppButton variant="primary" :disabled="!form.nombre.trim() || creating" @click="emit('submit', form)">
          {{ creating ? 'Creando...' : 'Crear cliente' }}
        </AppButton>
      </div>
    </div>
  </AppOverlay>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.modal-card {
  width: min(760px, 100%);
  background: linear-gradient(180deg, rgba($ink-900, 0.98), rgba($ink-1000, 0.98));
  border: 1px solid rgba($brand-orange, 0.18);
  border-radius: 24px;
  padding: $space-6;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.45);
}

.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $space-4;
  margin-bottom: $space-5;

  h4 { margin: 0 0 $space-1; color: $fg-dark; }
  p { margin: 0; color: $ink-300; }
}

.history-label {
  display: inline-flex;
  margin-bottom: 2px;
  color: $brand-orange;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.btn-close {
  background: transparent;
  border: 1px solid rgba($brand-orange, 0.25);
  color: $brand-orange;
  border-radius: 12px;
  padding: $space-2 $space-3;
  cursor: pointer;
}

.modal-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: $space-4;
  margin-bottom: $space-4;

  @media (max-width: 900px) { grid-template-columns: 1fr; }
}

.phone-field {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.field-label { color: $ink-300; font-size: 0.85rem; font-weight: 600; }

.phone-group {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.phone-country {
  width: 100%;
  appearance: none;
  border: 1px solid rgba($ink-500, 0.18);
  border-radius: 12px;
  background: $ink-900;
  color: $fg-dark;
  padding: $space-3 $space-4;
  font-family: inherit;
}

.phone-input {
  display: flex;
  align-items: center;
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid rgba($ink-500, 0.18);
  background: $ink-900;
}

.phone-prefix {
  padding: $space-3 $space-4;
  color: $brand-orange;
  font-weight: 800;
  border-right: 1px solid rgba($ink-500, 0.18);
  min-width: 74px;
  text-align: center;
}

.phone-text {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: $fg-dark;
  padding: $space-3 $space-4;
  font-family: inherit;
}

.phone-hint { color: $ink-400; font-size: 0.75rem; }

.field-error { color: $signal-red; font-size: 0.82rem; margin: 0; }

.modal-actions-row {
  display: flex;
  justify-content: flex-end;
  gap: $space-3;
  margin-top: $space-5;
}
</style>
