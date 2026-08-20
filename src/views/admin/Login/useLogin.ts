import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { adminApi } from '@/services/admin.api'
import { useToastStore } from '@/stores/toast.store'

/** Where each role lands after signing in; anything else goes to the admin panel. */
const DESTINO_POR_ROL: Record<string, string> = {
  asesor: 'AsesorDashboard',
  superadmin: 'SuperadminDashboard',
  motorizado: 'MotorizadoEntregas',
  bodega: 'BodegaCompras',
}

export const PANELES = [
  { titulo: 'Administración', detalle: 'Finanzas, reportes y usuarios' },
  { titulo: 'Asesor', detalle: 'Ventas y gestiones de compra' },
  { titulo: 'Bodega y counter', detalle: 'Recepción, facturación y entregas' },
  { titulo: 'Motorizado', detalle: 'Rutas y entregas del día' },
]

function messageFor(err: { status?: number; message?: string }) {
  if (err?.status === 401) return 'Correo o contraseña incorrectos. Revisa e intenta de nuevo.'
  if (err?.status === 429) return 'Demasiados intentos seguidos. Espera un minuto antes de reintentar.'
  return err?.message || 'No pudimos iniciar sesión. Intenta de nuevo.'
}

/**
 * Single entry point for all five roles. The router target depends on the role
 * the API returns, so people who wear two hats know which panel they will get.
 */
export function useLogin() {
  const router = useRouter()
  const authStore = useAuthStore()
  const toastStore = useToastStore()

  const email = ref('')
  const password = ref('')
  const loading = ref(false)
  const error = ref('')

  const puedeEnviar = computed(
    () => email.value.trim().length > 0 && password.value.length > 0 && !loading.value,
  )

  async function submit() {
    if (!puedeEnviar.value) return
    loading.value = true
    error.value = ''
    try {
      const res = await adminApi.login(email.value.trim(), password.value)
      authStore.setToken(res.token)
      router.push({ name: DESTINO_POR_ROL[res.user?.role ?? ''] ?? 'AdminDashboard' })
    } catch (err: unknown) {
      // Keep the message on the form. A toast disappears before it is read, and
      // this is the one place where the reason has to stay put.
      error.value = messageFor(err as { status?: number; message?: string })
      toastStore.showNotification(error.value, 'error')
    } finally {
      loading.value = false
    }
  }

  return { email, password, loading, error, puedeEnviar, submit }
}
