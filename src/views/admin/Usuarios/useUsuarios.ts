import { computed, ref } from 'vue'
import { adminApi } from '@/services/admin.api'
import { useAuthStore } from '@/stores/auth.store'
import { useToastStore } from '@/stores/toast.store'

export interface AdminUser {
  _id: string
  name: string
  email: string
  role: string
  createdAt: string
}

export const ROLE_OPTIONS = [
  { value: 'admin', label: 'Administrador' },
  { value: 'gerencia', label: 'Gerencia' },
  { value: 'superadmin', label: 'Superadmin' },
  { value: 'asesor', label: 'Asesor de compras' },
  { value: 'motorizado', label: 'Motorizado (delivery)' },
  { value: 'bodega', label: 'Bodega' },
  { value: 'user', label: 'Usuario Regular' },
]

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  gerencia: 'Gerencia',
  superadmin: 'Superadmin',
  asesor: 'Asesor',
  motorizado: 'Motorizado',
  bodega: 'Bodega',
}

const STAFF_ROLES = ['admin', 'gerencia', 'superadmin']
const OPERATIONS_ROLES = ['asesor', 'motorizado', 'bodega']

export function roleLabel(role: string) {
  return ROLE_LABEL[role] ?? 'Usuario'
}

export function roleBadge(role: string) {
  if (STAFF_ROLES.includes(role)) return 'badge-info'
  if (OPERATIONS_ROLES.includes(role)) return 'badge-orange'
  return 'badge-neutral'
}

export function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*'
  let pwd = ''
  for (let i = 0; i < 14; i += 1) pwd += chars.charAt(Math.floor(Math.random() * chars.length))
  return pwd
}

function getLoginUrl(): string {
  const origin = window.location.origin
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) return 'http://localhost:5173/login'
  if (origin.includes('testing-storybrand-frontend.bakano.ec')) return 'https://testing-storybrand-backapp.bakano.ec/login'
  return 'https://courierboxlogistics.com/login'
}

export interface CreateUserPayload {
  nombre: string
  apellido: string
  email: string
  password: string
  role: string
  sendEmail: boolean
}

export interface UpdateUserPayload {
  name: string
  email: string
  password: string
  role: string
}

/** Team roster: loading, the derived head-count and every mutation. */
export function useUsuarios() {
  const authStore = useAuthStore()
  const toastStore = useToastStore()

  const users = ref<AdminUser[]>([])
  const loading = ref(false)
  const apiError = ref('')

  const stats = computed(() => {
    const count = (role: string) => users.value.filter((u) => u.role === role).length
    return {
      total: users.value.length,
      admins: count('admin'),
      gerencia: count('gerencia'),
      superadmins: count('superadmin'),
      asesores: count('asesor'),
      regUsers: count('user'),
    }
  })

  async function fetchUsers() {
    loading.value = true
    try {
      const data = await adminApi.getUsers()
      users.value = data.users || []
    } catch (err: unknown) {
      apiError.value = (err as Error)?.message || 'Error al cargar usuarios'
    } finally {
      loading.value = false
    }
  }

  /** Returns an error message, or null when the user was created. */
  async function createUser(form: CreateUserPayload): Promise<string | null> {
    const fullName = `${form.nombre.trim()} ${form.apellido.trim()}`.trim()
    if (!fullName) return 'Ingresa al menos el nombre'
    try {
      await adminApi.createUser({
        name: fullName,
        email: form.email,
        role: form.role,
        password: form.password || generatePassword(),
        sendEmail: form.sendEmail,
        loginUrl: getLoginUrl(),
      })
      toastStore.showNotification('Usuario creado exitosamente', 'success')
      await fetchUsers()
      return null
    } catch (err: unknown) {
      return (err as Error)?.message || 'Error al crear usuario'
    }
  }

  async function updateUser(id: string, form: UpdateUserPayload): Promise<boolean> {
    try {
      const payload: Record<string, unknown> = { name: form.name, email: form.email, role: form.role }
      if (form.password) payload.password = form.password
      await adminApi.updateUser(id, payload)
      toastStore.showNotification(`Datos de ${form.name} guardados`, 'success')
      await fetchUsers()
      return true
    } catch (err: unknown) {
      toastStore.showNotification((err as Error)?.message || 'Error al actualizar', 'error')
      return false
    }
  }

  async function deleteUser(id: string): Promise<boolean> {
    try {
      await adminApi.deleteUser(id)
      await fetchUsers()
      toastStore.showNotification('Usuario eliminado', 'success')
      return true
    } catch (err: unknown) {
      toastStore.showNotification((err as Error)?.message || 'Error al eliminar', 'error')
      return false
    }
  }

  /**
   * An admin may not remove peers or superadmins — only a superadmin can.
   * Returns the refusal message, or null when the deletion may proceed.
   */
  function deletionBlockedReason(user: AdminUser): string | null {
    if (authStore.userRole !== 'admin') return null
    if (user.role === 'superadmin') {
      return '¿Quieres eliminar a un superadmin? Romper la empresa no viene en el plan, bro. No puedes tocarlo.'
    }
    if (user.role === 'admin') {
      return '¿Quieres eliminar a otro admin? No puedes, bro. Eso solo lo hace un superadmin.'
    }
    return null
  }

  return { authStore, users, loading, apiError, stats, fetchUsers, createUser, updateUser, deleteUser, deletionBlockedReason }
}
