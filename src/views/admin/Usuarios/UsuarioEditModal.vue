<script setup lang="ts">
/** Edit an existing user. The password field only applies when filled in. */
import { ref, watch } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppOverlay from '@/components/ui/AppOverlay.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import { ROLE_OPTIONS, type AdminUser, type UpdateUserPayload } from './useUsuarios'

const props = defineProps<{ open: boolean; user: AdminUser | null; saving: boolean; success: boolean }>()
const emit = defineEmits<{ close: []; submit: [form: UpdateUserPayload] }>()

const form = ref<UpdateUserPayload>({ name: '', email: '', password: '', role: 'admin' })

watch(
  () => props.user,
  (user) => {
    form.value = { name: user?.name ?? '', email: user?.email ?? '', password: '', role: user?.role ?? 'admin' }
  },
  { immediate: true },
)
</script>

<template>
  <AppOverlay :open="open" labelledby="edit-modal-title" @close="emit('close')">
    <div class="modal-card wide">
      <div class="modal-header-bar">
        <h3 id="edit-modal-title"><i class="fa-solid fa-pen" aria-hidden="true" /> Actualizar Perfil</h3>
        <button class="btn-icon" aria-label="Cerrar" @click="emit('close')">
          <i class="fa-solid fa-xmark" aria-hidden="true" />
        </button>
      </div>

      <form class="premium-form" @submit.prevent="emit('submit', form)">
        <div class="form-row">
          <div class="form-group">
            <label for="edit-name">Nombre Completo</label>
            <div class="input-icon-wrap">
              <i class="fa-solid fa-user" aria-hidden="true" />
              <input id="edit-name" v-model="form.name" type="text" required />
            </div>
          </div>
          <div class="form-group">
            <label for="edit-email">Correo Electrónico</label>
            <div class="input-icon-wrap">
              <i class="fa-solid fa-envelope" aria-hidden="true" />
              <input id="edit-email" v-model="form.email" type="email" required />
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="edit-password">Contraseña <span class="opt-tag">Opcional</span></label>
            <div class="input-icon-wrap">
              <i class="fa-solid fa-lock" aria-hidden="true" />
              <input id="edit-password" v-model="form.password" type="password" placeholder="Solo si cambia" />
            </div>
          </div>
          <div class="form-group">
            <AppSelect v-model="form.role" :options="ROLE_OPTIONS" label="Rol" />
          </div>
        </div>

        <div class="modal-actions">
          <AppButton type="button" variant="outline" @click="emit('close')">Cancelar</AppButton>
          <AppButton type="submit" :loading="saving" :class="{ 'btn-success': success }">
            <span v-if="success"><i class="fa-solid fa-check" /> Guardado</span>
            <span v-else>Guardar Cambios</span>
          </AppButton>
        </div>
      </form>
    </div>
  </AppOverlay>
</template>

<style scoped lang="scss">
@use './usuarios-ui' as ui;

@include ui.modal-card;
@include ui.form;
@include ui.icon-button;
</style>
