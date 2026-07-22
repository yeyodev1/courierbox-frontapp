<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { adminApi } from '@/services/admin.api'
import { useAuthStore } from '@/stores/auth.store'
import { useToastStore } from '@/stores/toast.store'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppButton from '@/components/ui/AppButton.vue'

const roleOptions = [
  { value: 'admin', label: 'Administrador' },
  { value: 'gerencia', label: 'Gerencia' },
  { value: 'superadmin', label: 'Superadmin' },
  { value: 'asesor', label: 'Asesor de compras' },
  { value: 'motorizado', label: 'Motorizado (delivery)' },
  { value: 'bodega', label: 'Bodega' },
  { value: 'user', label: 'Usuario Regular' },
]

const authStore = useAuthStore()
const toastStore = useToastStore()

const users = ref<any[]>([])
const loadingUsers = ref(false)
const apiError = ref('')

const showCreateModal = ref(false)
const createForm = ref({ nombre: '', apellido: '', email: '', password: '', role: 'asesor' })
const sendEmail = ref(true)
const creatingUser = ref(false)
const createError = ref('')

const showEditModal = ref(false)
const editingUserId = ref<string | null>(null)
const editForm = ref({ name: '', email: '', password: '', role: 'admin' })
const updatingUser = ref(false)
const updateSuccess = ref(false)

const showDeleteModal = ref(false)
const userToDelete = ref<any>(null)
const deletingUser = ref(false)
const showProtectedDeleteModal = ref(false)
const protectedDeleteMessage = ref('')

const stats = computed(() => {
  const total = users.value.length
  const admins = users.value.filter((u: any) => u.role === 'admin').length
  const gerencia = users.value.filter((u: any) => u.role === 'gerencia').length
  const superadmins = users.value.filter((u: any) => u.role === 'superadmin').length
  const asesores = users.value.filter((u: any) => u.role === 'asesor').length
  const regUsers = users.value.filter((u: any) => u.role === 'user').length
  const recent = users.value.filter((u: any) => {
    const d = new Date(u.createdAt)
    return d > new Date(Date.now() - 30 * 86400000)
  }).length
  return { total, admins, gerencia, superadmins, asesores, regUsers, recent }
})

onMounted(() => fetchUsers())

async function fetchUsers() {
  loadingUsers.value = true
  try {
    const data = await adminApi.getUsers()
    users.value = data.users || []
  } catch (err: any) {
    apiError.value = err.message || 'Error al cargar usuarios'
  } finally {
    loadingUsers.value = false
  }
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*'
  let pwd = ''
  for (let i = 0; i < 14; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return pwd
}

function openCreateModal() {
  createForm.value = { nombre: '', apellido: '', email: '', password: generatePassword(), role: 'asesor' }
  sendEmail.value = true
  createError.value = ''
  showCreateModal.value = true
}

function cancelCreate() {
  showCreateModal.value = false
}

function getLoginUrl(): string {
  const origin = window.location.origin
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    return 'http://localhost:5173/login'
  }
  if (origin.includes('testing-storybrand-frontend.bakano.ec')) {
    return 'https://testing-storybrand-backapp.bakano.ec/login'
  }
  return 'https://courierboxlogistics.com/login'
}

async function handleCreateUser() {
  creatingUser.value = true
  createError.value = ''
  try {
    const fullName = `${createForm.value.nombre.trim()} ${createForm.value.apellido.trim()}`.trim()
    if (!fullName) {
      createError.value = 'Ingresa al menos el nombre'
      creatingUser.value = false
      return
    }
    const payload: any = { name: fullName, email: createForm.value.email, role: createForm.value.role }
    payload.password = createForm.value.password || generatePassword()
    payload.sendEmail = sendEmail.value
    payload.loginUrl = getLoginUrl()
    await adminApi.createUser(payload)
    toastStore.showNotification('Usuario creado exitosamente', 'success')
    showCreateModal.value = false
    await fetchUsers()
  } catch (err: any) {
    createError.value = err.message || 'Error al crear usuario'
  } finally {
    creatingUser.value = false
  }
}

function startEditUser(user: any) {
  editingUserId.value = user._id
  editForm.value = { name: user.name, email: user.email, password: '', role: user.role }
  showEditModal.value = true
}

function cancelEdit() {
  showEditModal.value = false
  editingUserId.value = null
  editForm.value = { name: '', email: '', password: '', role: 'admin' }
}

async function handleUpdateUser() {
  if (!editingUserId.value) return
  updatingUser.value = true
  try {
    const payload: any = { name: editForm.value.name, email: editForm.value.email, role: editForm.value.role }
    if (editForm.value.password) payload.password = editForm.value.password
    await adminApi.updateUser(editingUserId.value, payload)
    toastStore.showNotification(`Datos de ${editForm.value.name} guardados`, 'success')
    updateSuccess.value = true
    await fetchUsers()
    setTimeout(() => { updateSuccess.value = false; cancelEdit() }, 1500)
  } catch (err: any) {
    toastStore.showNotification(err.message || 'Error al actualizar', 'error')
  } finally {
    updatingUser.value = false
  }
}

function confirmDeleteUser(user: any) {
  const currentRole = authStore.userRole
  const targetRole = String(user?.role || '')

  if (currentRole === 'admin' && (targetRole === 'admin' || targetRole === 'superadmin')) {
    protectedDeleteMessage.value = targetRole === 'superadmin'
      ? '¿Quieres eliminar a un superadmin? Romper la empresa no viene en el plan, bro. No puedes tocarlo.'
      : '¿Quieres eliminar a otro admin? No puedes, bro. Eso solo lo hace un superadmin.'
    showProtectedDeleteModal.value = true
    return
  }

  userToDelete.value = user
  showDeleteModal.value = true
}

async function executeDeleteUser() {
  if (!userToDelete.value) return
  deletingUser.value = true
  try {
    await adminApi.deleteUser(userToDelete.value._id)
    showDeleteModal.value = false
    userToDelete.value = null
    await fetchUsers()
    toastStore.showNotification('Usuario eliminado', 'success')
  } catch (err: any) {
    toastStore.showNotification(err.message || 'Error al eliminar', 'error')
  } finally {
    deletingUser.value = false
  }
}
</script>

<template>
  <div class="page-content">
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-icon users"><i class="fa-solid fa-users" aria-hidden="true" /></span>
        <div class="stat-body">
          <span class="stat-value">{{ stats.total }}</span>
          <span class="stat-label">Total Usuarios</span>
        </div>
      </div>
      <div class="stat-card">
        <span class="stat-icon admin"><i class="fa-solid fa-shield-halved" aria-hidden="true" /></span>
        <div class="stat-body">
          <span class="stat-value">{{ stats.admins }}</span>
          <span class="stat-label">Administradores</span>
        </div>
      </div>
      <div class="stat-card">
        <span class="stat-icon admin"><i class="fa-solid fa-briefcase" aria-hidden="true" /></span>
        <div class="stat-body">
          <span class="stat-value">{{ stats.gerencia }}</span>
          <span class="stat-label">Gerencia</span>
        </div>
      </div>
      <div class="stat-card">
        <span class="stat-icon admin"><i class="fa-solid fa-user-shield" aria-hidden="true" /></span>
        <div class="stat-body">
          <span class="stat-value">{{ stats.superadmins }}</span>
          <span class="stat-label">Superadmin</span>
        </div>
      </div>
      <div class="stat-card">
        <span class="stat-icon asesor"><i class="fa-solid fa-handshake" aria-hidden="true" /></span>
        <div class="stat-body">
          <span class="stat-value">{{ stats.asesores }}</span>
          <span class="stat-label">Asesores</span>
        </div>
      </div>
      <div class="stat-card">
        <span class="stat-icon user"><i class="fa-solid fa-user" aria-hidden="true" /></span>
        <div class="stat-body">
          <span class="stat-value">{{ stats.regUsers }}</span>
          <span class="stat-label">Usuarios</span>
        </div>
      </div>
    </div>

    <section class="content-card">
      <div class="card-head">
        <h3><i class="fa-solid fa-users-viewfinder" aria-hidden="true" /> Equipo Registrado</h3>
        <AppButton variant="primary" size="sm" @click="openCreateModal">
          <i class="fa-solid fa-plus" aria-hidden="true" /> Agregar Usuario
        </AppButton>
      </div>

      <div v-if="loadingUsers" class="state-box">
        <span class="loader" />
        <p>Cargando usuarios...</p>
      </div>
      <div v-else-if="users.length === 0" class="state-box">
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
              <td>
                <span :class="['badge', ['admin','gerencia','superadmin'].includes(u.role) ? 'badge-info' : ['asesor','motorizado','bodega'].includes(u.role) ? 'badge-orange' : 'badge-neutral']">
                  {{ u.role === 'admin' ? 'Admin' : u.role === 'gerencia' ? 'Gerencia' : u.role === 'superadmin' ? 'Superadmin' : u.role === 'asesor' ? 'Asesor' : u.role === 'motorizado' ? 'Motorizado' : u.role === 'bodega' ? 'Bodega' : 'Usuario' }}
                </span>
              </td>
              <td class="cell-sub">{{ new Date(u.createdAt).toLocaleDateString() }}</td>
              <td class="text-right">
                <div class="action-group">
                  <button class="btn-icon" aria-label="Editar usuario" title="Editar" @click="startEditUser(u)">
                    <i class="fa-solid fa-pen" aria-hidden="true" />
                  </button>
                  <button
                    v-if="u._id !== authStore.currentUser?.userId"
                    class="btn-icon danger"
                    aria-label="Eliminar usuario"
                    title="Eliminar"
                    @click="confirmDeleteUser(u)"
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

    <!-- Create modal -->
    <transition name="modal-scale">
      <div v-if="showCreateModal" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="create-modal-title" @click.self="cancelCreate" @keydown.escape="cancelCreate">
        <div class="modal-card wide">
          <div class="modal-header-bar">
            <h3 id="create-modal-title"><i class="fa-solid fa-user-plus" aria-hidden="true" /> Nuevo Usuario</h3>
            <button class="btn-icon" aria-label="Cerrar" @click="cancelCreate"><i class="fa-solid fa-xmark" aria-hidden="true" /></button>
          </div>
          <form @submit.prevent="handleCreateUser" class="premium-form">
            <div class="form-row">
              <div class="form-group">
                <label for="create-nombre">Nombre</label>
                <div class="input-icon-wrap">
                  <i class="fa-solid fa-user" aria-hidden="true" />
                  <input id="create-nombre" type="text" v-model="createForm.nombre" required placeholder="Ej. Ana Lucía" />
                </div>
              </div>
              <div class="form-group">
                <label for="create-apellido">Apellido</label>
                <div class="input-icon-wrap">
                  <i class="fa-solid fa-user" aria-hidden="true" />
                  <input id="create-apellido" type="text" v-model="createForm.apellido" placeholder="Ej. Pérez" />
                </div>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="create-email">Correo Electrónico</label>
                <div class="input-icon-wrap">
                  <i class="fa-solid fa-envelope" aria-hidden="true" />
                  <input id="create-email" type="email" v-model="createForm.email" required placeholder="ejemplo@courierbox.com" />
                </div>
              </div>
              <div class="form-group">
                <label for="create-password">
                  Contraseña
                  <span class="opt-tag">Opcional</span>
                </label>
                <div class="input-icon-wrap">
                  <i class="fa-solid fa-lock" aria-hidden="true" />
                  <input id="create-password" type="text" v-model="createForm.password" placeholder="Vacío = auto-generada" />
                </div>
                <span class="field-hint">Si dejas vacío, se generará automáticamente.</span>
              </div>
            </div>

            <div class="form-group">
              <label>Rol</label>
              <div class="role-cards">
                <button
                  v-for="opt in roleOptions"
                  :key="opt.value"
                  type="button"
                  class="role-card"
                  :class="{ selected: createForm.role === opt.value }"
                  @click="createForm.role = opt.value"
                >
                  <span class="role-card__label">{{ opt.label }}</span>
                  <i v-if="createForm.role === opt.value" class="fa-solid fa-circle-check" aria-hidden="true" />
                </button>
              </div>
            </div>
            <label class="checkbox-row">
              <input type="checkbox" v-model="sendEmail" />
              <span class="checkbox-mark"><i class="fa-solid fa-check" aria-hidden="true" /></span>
              <span>Enviar credenciales por correo electrónico</span>
            </label>
            <p v-if="createError" class="form-error"><i class="fa-solid fa-circle-exclamation" aria-hidden="true" /> {{ createError }}</p>
            <div class="modal-actions">
              <AppButton type="button" variant="outline" @click="cancelCreate">Cancelar</AppButton>
              <AppButton type="submit" :loading="creatingUser">Crear Usuario</AppButton>
            </div>
          </form>
        </div>
      </div>
    </transition>

    <!-- Edit modal -->
    <transition name="modal-scale">
      <div v-if="showEditModal" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="edit-modal-title" @click.self="cancelEdit" @keydown.escape="cancelEdit">
        <div class="modal-card wide">
          <div class="modal-header-bar">
            <h3 id="edit-modal-title"><i class="fa-solid fa-pen" aria-hidden="true" /> Actualizar Perfil</h3>
            <button class="btn-icon" aria-label="Cerrar" @click="cancelEdit"><i class="fa-solid fa-xmark" aria-hidden="true" /></button>
          </div>
          <form @submit.prevent="handleUpdateUser" class="premium-form">
            <div class="form-row">
              <div class="form-group">
                <label for="edit-name">Nombre Completo</label>
                <div class="input-icon-wrap">
                  <i class="fa-solid fa-user" aria-hidden="true" />
                  <input id="edit-name" type="text" v-model="editForm.name" required />
                </div>
              </div>
              <div class="form-group">
                <label for="edit-email">Correo Electrónico</label>
                <div class="input-icon-wrap">
                  <i class="fa-solid fa-envelope" aria-hidden="true" />
                  <input id="edit-email" type="email" v-model="editForm.email" required />
                </div>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="edit-password">
                  Contraseña
                  <span class="opt-tag">Opcional</span>
                </label>
                <div class="input-icon-wrap">
                  <i class="fa-solid fa-lock" aria-hidden="true" />
                  <input id="edit-password" type="password" v-model="editForm.password" placeholder="Solo si cambia" />
                </div>
              </div>
              <div class="form-group">
                <AppSelect v-model="editForm.role" :options="roleOptions" label="Rol" />
              </div>
            </div>
            <div class="modal-actions">
              <AppButton type="button" variant="outline" @click="cancelEdit">Cancelar</AppButton>
              <AppButton type="submit" :loading="updatingUser" :class="{ 'btn-success': updateSuccess }">
                <span v-if="updateSuccess"><i class="fa-solid fa-check" /> Guardado</span>
                <span v-else>Guardar Cambios</span>
              </AppButton>
            </div>
          </form>
        </div>
      </div>
    </transition>

    <!-- Delete modal -->
    <transition name="modal-scale">
      <div v-if="showDeleteModal" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title" @click.self="showDeleteModal = false" @keydown.escape="showDeleteModal = false">
        <div class="modal-card">
          <div class="modal-icon-box danger"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true" /></div>
          <h3 id="delete-modal-title">Eliminar Usuario</h3>
          <p>¿Eliminar a <strong>{{ userToDelete?.name }}</strong>? Esta acción no se puede deshacer.</p>
          <div class="modal-actions">
            <AppButton type="button" variant="outline" @click="showDeleteModal = false">Cancelar</AppButton>
            <AppButton type="button" variant="primary" :loading="deletingUser" @click="executeDeleteUser">Sí, eliminar</AppButton>
          </div>
        </div>
      </div>
    </transition>

    <!-- Protected delete modal -->
    <transition name="modal-scale">
      <div v-if="showProtectedDeleteModal" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="protected-delete-modal-title" @click.self="showProtectedDeleteModal = false" @keydown.escape="showProtectedDeleteModal = false">
        <div class="modal-card">
          <div class="modal-icon-box danger"><i class="fa-solid fa-shield-halved" aria-hidden="true" /></div>
          <h3 id="protected-delete-modal-title">Acceso denegado</h3>
          <p>{{ protectedDeleteMessage }}</p>
          <div class="modal-actions">
            <AppButton type="button" variant="primary" @click="showProtectedDeleteModal = false">Entendido</AppButton>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $space-4;
  margin-bottom: $space-6;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
}

.stat-card {
  display: flex;
  align-items: center;
  gap: $space-4;
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.12);
  border-radius: 16px;
  padding: $space-5;
  transition: all 0.2s;

  &:hover {
    border-color: rgba($ink-400, 0.25);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  }

  .stat-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.15rem;
    flex-shrink: 0;

    &.users { background: rgba($signal-blue, 0.12); color: #6db6ff; }
    &.admin { background: rgba($signal-red, 0.12); color: #ff8a8f; }
    &.asesor { background: rgba($brand-orange, 0.12); color: $brand-orange; }
    &.user { background: rgba($signal-green, 0.12); color: $signal-green; }
  }

  .stat-body {
    .stat-value {
      display: block;
      font-size: 1.5rem;
      font-weight: 700;
      line-height: 1.2;
    }
    .stat-label {
      font-size: 0.75rem;
      color: $ink-400;
      margin-top: 2px;
    }
  }
}

.content-card {
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.12);
  border-radius: 16px;
  padding: $space-6;

  .card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
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
      i { color: $brand-orange; font-size: 0.9rem; }
    }
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
  tr:last-child td { border-bottom: none; }

  .cell-main { font-weight: 600; font-size: 0.9rem; }
  .cell-sub { font-size: 0.75rem; color: $ink-400; margin-top: 2px; }
  .text-right { text-align: right; }
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

.badge {
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  display: inline-block;

  &-info { background: rgba($signal-blue, 0.12); color: #6db6ff; border: 1px solid rgba($signal-blue, 0.2); }
  &-orange { background: rgba($brand-orange, 0.12); color: $brand-orange; border: 1px solid rgba($brand-orange, 0.2); }
  &-neutral { background: rgba($ink-400, 0.12); color: $ink-300; border: 1px solid rgba($ink-400, 0.2); }
}

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

.action-group {
  display: flex;
  gap: $space-2;
  justify-content: flex-end;
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

  &:focus-visible {
    outline: 2px solid $brand-orange;
    outline-offset: 2px;
  }

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

// ─── MODALS ──────────────────────────────────────────
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
    max-width: 560px;
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
    margin: 0;
    display: flex;
    align-items: center;
    gap: $space-2;
  }

  p {
    color: $ink-300;
    font-size: 0.9rem;
    margin: $space-4 0 $space-6;
  }

  .modal-header-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $space-6;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: $space-3;

    @media (max-width: 640px) {
      flex-direction: column;

      :deep(.btn) { width: 100%; }
    }
  }
}

// ─── FORM ────────────────────────────────────────────
.premium-form {
  display: flex;
  flex-direction: column;
  gap: $space-5;

  .form-row {
    display: flex;
    gap: $space-4;

    .form-group { flex: 1 1 0; min-width: 0; }

    @media (max-width: 640px) {
      flex-direction: column;
    }
  }

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

    input {
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

    .input-icon-wrap {
      position: relative;

      i {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: $ink-400;
      }

      input {
        padding-left: 2.75rem;
        &:focus ~ i { color: $brand-orange; }
      }
    }

    .field-hint {
      font-size: 0.7rem;
      color: $ink-500;
      margin-top: $space-1;
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

.checkbox-row {
  display: flex;
  align-items: center;
  gap: $space-3;
  cursor: pointer;
  font-size: 0.85rem;
  color: $ink-300;
  user-select: none;

  input[type="checkbox"] {
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
    transition: all 0.2s;
    color: transparent;
    font-size: 0.6rem;
  }

  input:checked + .checkbox-mark {
    background: $brand-orange;
    border-color: $brand-orange;
    color: $ink-1000;
  }

  &:hover .checkbox-mark {
    border-color: $brand-orange;
  }
}

// ─── LOADER ──────────────────────────────────────────
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

// ─── TRANSITIONS ─────────────────────────────────────
.modal-scale-enter-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  .modal-card {
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
}

.modal-scale-leave-active {
  transition: all 0.2s ease;

  .modal-card {
    transition: all 0.2s ease;
  }
}

.modal-scale-enter-from {
  opacity: 0;

  .modal-card {
    opacity: 0;
    transform: scale(0.92) translateY(12px);
  }
}

.modal-scale-leave-to {
  opacity: 0;

  .modal-card {
    opacity: 0;
    transform: scale(0.96) translateY(-8px);
  }
}
</style>
