<script setup lang="ts">
/** New-user form: identity, role and whether to email the credentials. */
import { ref, watch } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppOverlay from '@/components/ui/AppOverlay.vue'
import { ROLE_OPTIONS, generatePassword, type CreateUserPayload } from './useUsuarios'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: []; submit: [form: CreateUserPayload] }>()

const saving = defineModel<boolean>('saving', { default: false })
const error = defineModel<string>('error', { default: '' })

function emptyForm(): CreateUserPayload {
  return { nombre: '', apellido: '', email: '', password: generatePassword(), role: 'asesor', sendEmail: true }
}

const form = ref(emptyForm())

// A fresh open always starts from a clean form with a new suggested password.
watch(
  () => props.open,
  (open) => {
    if (open) form.value = emptyForm()
  },
)
</script>

<template>
  <AppOverlay :open="open" labelledby="create-modal-title" @close="emit('close')">
    <div class="modal-card wide">
      <div class="modal-header-bar">
        <h3 id="create-modal-title"><i class="fa-solid fa-user-plus" aria-hidden="true" /> Nuevo Usuario</h3>
        <button class="btn-icon" aria-label="Cerrar" @click="emit('close')">
          <i class="fa-solid fa-xmark" aria-hidden="true" />
        </button>
      </div>

      <form class="premium-form" @submit.prevent="emit('submit', form)">
        <div class="form-row">
          <div class="form-group">
            <label for="create-nombre">Nombre</label>
            <div class="input-icon-wrap">
              <i class="fa-solid fa-user" aria-hidden="true" />
              <input id="create-nombre" v-model="form.nombre" type="text" required placeholder="Ej. Ana Lucía" />
            </div>
          </div>
          <div class="form-group">
            <label for="create-apellido">Apellido</label>
            <div class="input-icon-wrap">
              <i class="fa-solid fa-user" aria-hidden="true" />
              <input id="create-apellido" v-model="form.apellido" type="text" placeholder="Ej. Pérez" />
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="create-email">Correo Electrónico</label>
            <div class="input-icon-wrap">
              <i class="fa-solid fa-envelope" aria-hidden="true" />
              <input id="create-email" v-model="form.email" type="email" required placeholder="ejemplo@courierbox.com" />
            </div>
          </div>
          <div class="form-group">
            <label for="create-password">Contraseña <span class="opt-tag">Opcional</span></label>
            <div class="input-icon-wrap">
              <i class="fa-solid fa-lock" aria-hidden="true" />
              <input id="create-password" v-model="form.password" type="text" placeholder="Vacío = auto-generada" />
            </div>
            <span class="field-hint">Si dejas vacío, se generará automáticamente.</span>
          </div>
        </div>

        <div class="form-group">
          <label>Rol</label>
          <div class="role-cards">
            <button
              v-for="opt in ROLE_OPTIONS"
              :key="opt.value"
              type="button"
              class="role-card"
              :class="{ selected: form.role === opt.value }"
              @click="form.role = opt.value"
            >
              <span>{{ opt.label }}</span>
              <i v-if="form.role === opt.value" class="fa-solid fa-circle-check" aria-hidden="true" />
            </button>
          </div>
        </div>

        <label class="checkbox-row">
          <input v-model="form.sendEmail" type="checkbox" />
          <span class="checkbox-mark"><i class="fa-solid fa-check" aria-hidden="true" /></span>
          <span>Enviar credenciales por correo electrónico</span>
        </label>

        <p v-if="error" class="form-error">
          <i class="fa-solid fa-circle-exclamation" aria-hidden="true" /> {{ error }}
        </p>

        <div class="modal-actions">
          <AppButton type="button" variant="outline" @click="emit('close')">Cancelar</AppButton>
          <AppButton type="submit" :loading="saving">Crear Usuario</AppButton>
        </div>
      </form>
    </div>
  </AppOverlay>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use './usuarios-ui' as ui;

@include ui.modal-card;
@include ui.form;
@include ui.icon-button;

.role-cards {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}

.role-card {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  padding: 0.6rem 0.9rem;
  border-radius: 10px;
  border: 1px solid rgba($ink-500, 0.35);
  background: rgba($ink-1000, 0.5);
  color: $ink-200;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.16s ease;

  &:hover { border-color: rgba($brand-orange, 0.5); }

  &.selected {
    border-color: $brand-orange;
    background: rgba($brand-orange, 0.12);
    color: $brand-orange;
  }

  i { font-size: 0.8rem; }
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: $space-3;
  cursor: pointer;
  font-size: 0.85rem;
  color: $ink-300;
  user-select: none;

  input[type='checkbox'] {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  .checkbox-mark {
    width: 20px;
    height: 20px;
    border: 2px solid rgba($ink-500, 0.4);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: transparent;
    font-size: 0.6rem;
    transition: all 0.2s;
  }

  input:checked + .checkbox-mark {
    background: $brand-orange;
    border-color: $brand-orange;
    color: $ink-1000;
  }

  &:hover .checkbox-mark { border-color: $brand-orange; }
}
</style>
