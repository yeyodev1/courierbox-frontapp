<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { adminApi } from '@/services/admin.api'
import { useToastStore } from '@/stores/toast.store'
import { useAuthStore } from '@/stores/auth.store'

const toastStore = useToastStore()
const authStore = useAuthStore()

const users = ref<any[]>([])
const loadingUsers = ref(false)
const creatingUser = ref(false)
const userForm = ref({ name: '', email: '', password: '', role: 'admin' })
const showEditUserModal = ref(false)
const editingUserId = ref<string | null>(null)
const editUserForm = ref({ name: '', email: '', password: '', role: 'admin' })
const updatingUser = ref(false)
const updateSuccess = ref(false)
const showDeleteUserModal = ref(false)
const userToDelete = ref<any>(null)

async function fetchUsers() {
  loadingUsers.value = true
  try {
    const data = await adminApi.getUsers()
    users.value = data.users || []
  } catch (err: any) {
    toastStore.showNotification(err.message || 'Error al cargar usuarios', 'error')
  } finally {
    loadingUsers.value = false
  }
}

async function handleSaveUser() {
  creatingUser.value = true
  try {
    await adminApi.createUser({ ...userForm.value })
    toastStore.showNotification('Usuario creado exitosamente', 'success')
    userForm.value = { name: '', email: '', password: '', role: 'admin' }
    await fetchUsers()
  } catch (err: any) {
    toastStore.showNotification(err.message || 'Error al crear usuario', 'error')
  } finally {
    creatingUser.value = false
  }
}

function startEditUser(user: any) {
  editingUserId.value = user._id
  editUserForm.value = { name: user.name, email: user.email, password: '', role: user.role }
  showEditUserModal.value = true
}

function cancelEditUser() {
  showEditUserModal.value = false
  editingUserId.value = null
  editUserForm.value = { name: '', email: '', password: '', role: 'admin' }
}

async function handleUpdateUser() {
  if (!editingUserId.value) return
  updatingUser.value = true
  try {
    const payload: any = { ...editUserForm.value }
    if (!payload.password) delete payload.password
    await adminApi.updateUser(editingUserId.value, payload)
    toastStore.showNotification(`Datos de ${editUserForm.value.name} guardados`, 'success')
    updateSuccess.value = true
    await fetchUsers()
    setTimeout(() => { updateSuccess.value = false; cancelEditUser() }, 1500)
  } catch (err: any) {
    toastStore.showNotification(err.message || 'Error al actualizar', 'error')
  } finally {
    updatingUser.value = false
  }
}

function confirmDeleteUser(user: any) {
  userToDelete.value = user
  showDeleteUserModal.value = true
}

async function executeDeleteUser() {
  if (!userToDelete.value) return
  try {
    await adminApi.deleteUser(userToDelete.value._id)
    showDeleteUserModal.value = false
    userToDelete.value = null
    await fetchUsers()
    toastStore.showNotification('Usuario eliminado', 'success')
  } catch (err: any) {
    toastStore.showNotification(err.message || 'Error al eliminar', 'error')
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <div class="page-content">
    <div class="content-grid">
      <section class="content-card">
        <div class="card-head">
          <h3><i class="fa-solid fa-user-plus" /> Registrar Miembro</h3>
        </div>
        <form @submit.prevent="handleSaveUser" class="premium-form">
          <div class="form-group">
            <label>Nombre Completo</label>
            <input type="text" v-model="userForm.name" required placeholder="Ej. Ana Lucía" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Correo Electrónico</label>
              <input type="email" v-model="userForm.email" required placeholder="ejemplo@courierbox.com" />
            </div>
            <div class="form-group">
              <label>Contraseña</label>
              <input type="password" v-model="userForm.password" required placeholder="********" />
            </div>
          </div>
          <div class="form-group">
            <label>Rol</label>
            <select v-model="userForm.role" class="select-el">
              <option value="admin">Administrador Total</option>
              <option value="user">Usuario Regular</option>
            </select>
          </div>
          <button type="submit" :disabled="creatingUser" class="btn-primary">
            <span v-if="!creatingUser">Crear Usuario</span>
            <span v-else class="loader" />
          </button>
        </form>
      </section>

      <section class="content-card">
        <div class="card-head">
          <h3><i class="fa-solid fa-users-viewfinder" /> Equipo Registrado</h3>
        </div>
        <div v-if="loadingUsers" class="state-box">
          <span class="loader" /><p>Cargando...</p>
        </div>
        <div v-else-if="users.length === 0" class="state-box">
          <i class="fa-solid fa-inbox fa-2x" /><p>No hay usuarios registrados aún.</p>
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
                    <div class="user-avatar-sm">{{ u.name.charAt(0).toUpperCase() }}</div>
                    <div>
                      <div class="cell-main">{{ u.name }}</div>
                      <div class="cell-sub">{{ u.email }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span :class="['badge', u.role === 'admin' ? 'badge-info' : 'badge-neutral']">
                    {{ u.role === 'admin' ? 'Admin' : 'Usuario' }}
                  </span>
                </td>
                <td class="cell-sub">{{ new Date(u.createdAt).toLocaleDateString() }}</td>
                <td class="text-right">
                  <div class="action-group">
                    <button class="btn-icon" title="Editar" @click="startEditUser(u)"><i class="fa-solid fa-pen" /></button>
                    <button v-if="u._id !== authStore.currentUser?.userId" class="btn-icon danger" title="Eliminar" @click="confirmDeleteUser(u)"><i class="fa-regular fa-trash-can" /></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <!-- Modals -->
    <transition name="fade">
      <div v-if="showDeleteUserModal" class="modal-overlay" @click.self="showDeleteUserModal = false">
        <div class="modal-card">
          <div class="modal-icon-box danger"><i class="fa-solid fa-triangle-exclamation" /></div>
          <h3>Eliminar Usuario</h3>
          <p>¿Eliminar a <strong>{{ userToDelete?.name }}</strong>? No se puede deshacer.</p>
          <div class="modal-actions">
            <button class="btn-ghost" @click="showDeleteUserModal = false">Cancelar</button>
            <button class="btn-danger" @click="executeDeleteUser">Sí, eliminar</button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="showEditUserModal" class="modal-overlay" @click.self="showEditUserModal = false">
        <div class="modal-card wide">
          <div class="modal-header-bar">
            <h3><i class="fa-solid fa-pen" /> Actualizar Perfil</h3>
            <button class="btn-icon" @click="cancelEditUser"><i class="fa-solid fa-xmark" /></button>
          </div>
          <form @submit.prevent="handleUpdateUser" class="premium-form">
            <div class="form-group">
              <label>Nombre Completo</label>
              <div class="input-icon-wrap">
                <i class="fa-solid fa-user" />
                <input type="text" v-model="editUserForm.name" required />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Correo</label>
                <div class="input-icon-wrap">
                  <i class="fa-solid fa-envelope" />
                  <input type="email" v-model="editUserForm.email" required />
                </div>
              </div>
              <div class="form-group">
                <label>Contraseña <span class="opt-tag">Opcional</span></label>
                <div class="input-icon-wrap">
                  <i class="fa-solid fa-lock" />
                  <input type="password" v-model="editUserForm.password" placeholder="Solo si cambia" />
                </div>
              </div>
            </div>
            <div class="form-group">
              <label>Rol</label>
              <select v-model="editUserForm.role" class="select-el">
                <option value="admin">Administrador Total</option>
                <option value="user">Usuario Regular</option>
              </select>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-ghost" @click="cancelEditUser">Cancelar</button>
              <button type="submit" :disabled="updatingUser || updateSuccess" :class="['btn-primary', { 'btn-success': updateSuccess }]">
                <span v-if="updateSuccess"><i class="fa-solid fa-check" /> Guardado</span>
                <span v-else-if="!updatingUser">Guardar Cambios</span>
                <span v-else class="loader" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
@use 'sass:color';
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.page-content {
  width: 100%;
  max-width: 100%;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1.3fr;
  gap: $space-6;
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

.content-card {
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.12);
  border-radius: 16px;
  padding: $space-6;
  transition: border-color 0.2s;
  overflow: hidden;

  &:hover {
    border-color: rgba($ink-400, 0.2);
  }

  .card-head {
    display: flex;
    align-items: center;
    gap: $space-3;
    margin-bottom: $space-5;
    padding-bottom: $space-4;
    border-bottom: 1px solid rgba($ink-500, 0.08);

    h3 {
      font-size: 1rem;
      font-weight: 600;
      margin: 0;
      display: flex;
      align-items: center;
      gap: $space-2;

      i {
        color: $brand-orange;
        font-size: 0.9rem;
      }
    }
  }
}

// FORMS
.premium-form {
  display: flex;
  flex-direction: column;
  gap: $space-5;

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $space-4;

    @media (max-width: 640px) {
      grid-template-columns: 1fr;
    }
  }

  .form-group {
    display: flex;
    flex-direction: column;

    label {
      font-size: 0.8rem;
      font-weight: 500;
      color: $ink-300;
      margin-bottom: $space-2;

      .opt-tag {
        font-size: 0.65rem;
        color: $ink-400;
        background: rgba($ink-500, 0.15);
        padding: 1px 6px;
        border-radius: 4px;
        margin-left: 4px;
        font-weight: 500;
      }
    }

    input, .select-el {
      background: rgba($ink-1000, 0.5);
      border: 1px solid rgba($ink-500, 0.3);
      color: $fg-dark;
      padding: 0.75rem 1rem;
      border-radius: 10px;
      font-size: 0.9rem;
      transition: all 0.25s;
      width: 100%;

      &::placeholder { color: $ink-500; }

      &:focus {
        outline: none;
        border-color: $brand-orange;
        box-shadow: 0 0 0 3px rgba($brand-orange, 0.1);
        background: rgba($ink-1000, 0.8);
      }
    }

    .select-el {
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236F6F7A' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 1rem center;
      background-size: 1rem;
      cursor: pointer;
    }

    .input-icon-wrap {
      position: relative;

      i {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: $ink-400;
        transition: color 0.2s;
      }

      input {
        padding-left: 2.75rem;

        &:focus ~ i {
          color: $brand-orange;
        }
      }
    }
  }

  .form-error {
    display: flex;
    align-items: center;
    gap: $space-2;
    background: rgba($signal-red, 0.08);
    color: #ff8a8f;
    padding: $space-3 $space-4;
    border-radius: 10px;
    font-size: 0.85rem;
    border: 1px solid rgba($signal-red, 0.15);
    margin: 0;
  }
}

// BUTTONS
.btn-primary {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: $space-2;
  background: $brand-orange;
  color: #fff;
  border: none;
  padding: 0.85rem 1.5rem;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  min-height: 46px;

  &:hover:not(:disabled) {
    background: color.adjust($brand-orange, $lightness: 5%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba($brand-orange, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.btn-success {
    background: $signal-green;
    pointer-events: none;
  }
}

.btn-ghost {
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: 1px solid rgba($ink-500, 0.3);
  border-radius: 10px;
  color: $ink-300;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;

  &:hover {
    background: rgba($ink-500, 0.15);
    color: $fg-dark;
  }
}

.btn-danger {
  padding: 0.75rem 1.5rem;
  background: $signal-red;
  border: none;
  border-radius: 10px;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;

  &:hover {
    background: color.adjust($signal-red, $lightness: -8%);
  }
}

.btn-icon {
  width: 34px;
  height: 34px;
  background: rgba($ink-500, 0.15);
  border: 1px solid rgba($ink-500, 0.2);
  border-radius: 8px;
  color: $ink-300;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;

  &:hover {
    background: rgba($ink-400, 0.25);
    color: $fg-dark;
  }

  &.danger:hover {
    background: rgba($signal-red, 0.15);
    color: #ff8a8f;
    border-color: rgba($signal-red, 0.2);
  }
}

.action-group {
  display: flex;
  gap: $space-2;
  justify-content: flex-end;
}

// TABLES
.table-scroll {
  width: 100%;
  overflow-x: auto;
  
  // Custom scrollbar
  &::-webkit-scrollbar {
    height: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba($ink-500, 0.5);
    border-radius: 4px;
  }
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 500px;

  th, td {
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

  tr:last-child td {
    border-bottom: none;
  }

  .cell-main {
    font-weight: 600;
    font-size: 0.9rem;
  }

  .cell-sub {
    font-size: 0.75rem;
    color: $ink-400;
    margin-top: 2px;
  }

  .text-right {
    text-align: right;
  }
}

.user-cell {
  display: flex;
  align-items: center;
  gap: $space-3;

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
}

// BADGES
.badge {
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  display: inline-block;

  &-success { background: rgba($signal-green, 0.12); color: $signal-green; border: 1px solid rgba($signal-green, 0.2); }
  &-warning { background: rgba($signal-amber, 0.12); color: $signal-amber; border: 1px solid rgba($signal-amber, 0.2); }
  &-danger { background: rgba($signal-red, 0.12); color: #ff8a8f; border: 1px solid rgba($signal-red, 0.2); }
  &-info { background: rgba($signal-blue, 0.12); color: #6db6ff; border: 1px solid rgba($signal-blue, 0.2); }
  &-neutral { background: rgba($ink-400, 0.12); color: $ink-300; border: 1px solid rgba($ink-400, 0.2); }
}

// STATE BOX
.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: $ink-400;
  text-align: center;
  gap: $space-3;

  p { margin: 0; font-size: 0.9rem; }
  i { opacity: 0.5; }
}

// MODALS
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba($ink-1000, 0.75);
  backdrop-filter: blur(6px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-4;
}

.modal-card {
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.15);
  border-radius: 20px;
  padding: $space-8;
  max-width: 420px;
  width: 100%;
  text-align: center;

  &.wide {
    max-width: 520px;
    text-align: left;
  }

  .modal-icon-box {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto $space-4;
    font-size: 1.2rem;

    &.danger { background: rgba($signal-red, 0.12); color: #ff8a8f; }
  }

  h3 {
    font-size: 1.15rem;
    margin: 0 0 $space-2;
    display: flex;
    align-items: center;
    gap: $space-2;
  }

  p {
    color: $ink-300;
    font-size: 0.9rem;
    margin: 0 0 $space-6;
  }

  .modal-header-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $space-5;
  }

  .modal-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $space-3;

    @media (max-width: 640px) {
      grid-template-columns: 1fr;
    }
  }
}

.loader {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(#fff, 0.3);
  border-bottom-color: #fff;
  border-radius: 50%;
  display: inline-block;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
