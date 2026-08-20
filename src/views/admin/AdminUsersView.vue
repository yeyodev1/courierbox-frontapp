<script setup lang="ts">
/** Team management: roster, role head-count and the create/edit/delete flows. */
import { onMounted, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppOverlay from '@/components/ui/AppOverlay.vue'
import UsuariosStats from './Usuarios/UsuariosStats.vue'
import UsuariosTable from './Usuarios/UsuariosTable.vue'
import UsuarioCreateModal from './Usuarios/UsuarioCreateModal.vue'
import UsuarioEditModal from './Usuarios/UsuarioEditModal.vue'
import { useUsuarios, type AdminUser, type CreateUserPayload, type UpdateUserPayload } from './Usuarios/useUsuarios'

const u = useUsuarios()

const showCreate = ref(false)
const creating = ref(false)
const createError = ref('')

const showEdit = ref(false)
const editingUser = ref<AdminUser | null>(null)
const updating = ref(false)
const updateSuccess = ref(false)

const showDelete = ref(false)
const userToDelete = ref<AdminUser | null>(null)
const deleting = ref(false)

const blockedMessage = ref('')

async function handleCreate(form: CreateUserPayload) {
  creating.value = true
  createError.value = ''
  const error = await u.createUser(form)
  creating.value = false
  if (error) createError.value = error
  else showCreate.value = false
}

function startEdit(user: AdminUser) {
  editingUser.value = user
  showEdit.value = true
}

function closeEdit() {
  showEdit.value = false
  editingUser.value = null
  updateSuccess.value = false
}

async function handleUpdate(form: UpdateUserPayload) {
  if (!editingUser.value) return
  updating.value = true
  const ok = await u.updateUser(editingUser.value._id, form)
  updating.value = false
  if (!ok) return
  updateSuccess.value = true
  setTimeout(closeEdit, 1500)
}

function confirmDelete(user: AdminUser) {
  const blocked = u.deletionBlockedReason(user)
  if (blocked) {
    blockedMessage.value = blocked
    return
  }
  userToDelete.value = user
  showDelete.value = true
}

async function executeDelete() {
  if (!userToDelete.value) return
  deleting.value = true
  const ok = await u.deleteUser(userToDelete.value._id)
  deleting.value = false
  if (!ok) return
  showDelete.value = false
  userToDelete.value = null
}

onMounted(u.fetchUsers)
</script>

<template>
  <div class="page-content">
    <UsuariosStats :stats="u.stats.value" />

    <UsuariosTable
      :users="u.users.value"
      :loading="u.loading.value"
      :current-user-id="u.authStore.currentUser?.userId"
      @create="showCreate = true"
      @edit="startEdit"
      @remove="confirmDelete"
    />

    <UsuarioCreateModal
      v-model:saving="creating"
      v-model:error="createError"
      :open="showCreate"
      @close="showCreate = false"
      @submit="handleCreate"
    />

    <UsuarioEditModal
      :open="showEdit"
      :user="editingUser"
      :saving="updating"
      :success="updateSuccess"
      @close="closeEdit"
      @submit="handleUpdate"
    />

    <AppOverlay :open="showDelete" labelledby="delete-modal-title" :persistent="deleting" @close="showDelete = false">
      <div class="modal-card">
        <div class="modal-icon-box danger"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true" /></div>
        <h3 id="delete-modal-title">Eliminar Usuario</h3>
        <p>¿Eliminar a <strong>{{ userToDelete?.name }}</strong>? Esta acción no se puede deshacer.</p>
        <div class="modal-actions">
          <AppButton type="button" variant="outline" @click="showDelete = false">Cancelar</AppButton>
          <AppButton type="button" variant="primary" :loading="deleting" @click="executeDelete">Sí, eliminar</AppButton>
        </div>
      </div>
    </AppOverlay>

    <AppOverlay :open="!!blockedMessage" labelledby="blocked-modal-title" @close="blockedMessage = ''">
      <div class="modal-card">
        <div class="modal-icon-box danger"><i class="fa-solid fa-shield-halved" aria-hidden="true" /></div>
        <h3 id="blocked-modal-title">Acceso denegado</h3>
        <p>{{ blockedMessage }}</p>
        <div class="modal-actions">
          <AppButton type="button" variant="primary" @click="blockedMessage = ''">Entendido</AppButton>
        </div>
      </div>
    </AppOverlay>
  </div>
</template>

<style scoped lang="scss">
@use './Usuarios/usuarios-ui' as ui;

@include ui.modal-card;
</style>
