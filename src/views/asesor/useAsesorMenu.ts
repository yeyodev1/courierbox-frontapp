import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import type { ShellMenuGroup } from '@/components/layout/ShellSidebar.vue'

/** Highlights a section for every page nested under it. */
const under = (path: string) => (routePath: string) => routePath.startsWith(path)

const MENU_GROUPS: ShellMenuGroup[] = [
  {
    label: 'Mi panel',
    items: [
      { path: '/asesor', label: 'Dashboard', icon: 'fa-solid fa-chart-pie', match: (p) => p === '/asesor' },
      { path: '/asesor/solicitudes', label: 'Solicitudes web', icon: 'fa-solid fa-inbox', match: under('/asesor/solicitudes') },
      { path: '/asesor/calculadora', label: 'Calculadora', icon: 'fa-solid fa-calculator', match: under('/asesor/calculadora') },
      {
        path: '/asesor/ventas',
        label: 'Ventas',
        icon: 'fa-solid fa-bag-shopping',
        // The "new gestión" wizard is reached from Ventas, so it keeps that tab lit.
        match: (p) => p.startsWith('/asesor/ventas') || p.startsWith('/asesor/gestiones-compra/nueva'),
      },
    ],
  },
  {
    label: 'Gestión de Compra',
    items: [
      { path: '/asesor/gestiones-compra', label: 'Mis Gestiones', icon: 'fa-solid fa-cart-plus', match: under('/asesor/gestiones-compra') },
      { path: '/asesor/ordenes', label: 'Histórico', icon: 'fa-solid fa-box-archive', match: under('/asesor/ordenes') },
      { path: '/asesor/contactos', label: 'Contactos', icon: 'fa-solid fa-address-book', match: under('/asesor/contactos') },
    ],
  },
]

const PAGE_META: Record<string, { title: string; sub: string }> = {
  '/asesor': { title: 'Dashboard', sub: 'Resumen de tus gestiones y pagos' },
  '/asesor/calculadora': { title: 'Calculadora de gestión', sub: 'Cotiza el fee de gestión de compra' },
  '/asesor/ventas': { title: 'Ventas', sub: 'Registra ventas, historial y comprobantes' },
  '/asesor/ordenes': { title: 'Histórico', sub: 'Órdenes anteriores en modo de solo lectura' },
  '/asesor/gestiones-compra': { title: 'Mis Gestiones de Compra', sub: 'Administra tus gestiones del mes' },
  '/asesor/gestiones-compra/nueva': { title: 'Nueva Venta', sub: 'Registra una nueva venta de compra' },
  '/asesor/contactos': { title: 'Contactos', sub: 'Gestiona el historial de tus clientes' },
}

/** Navigation tree, page title and the signed-in identity for the asesor shell. */
export function useAsesorMenu() {
  const route = useRoute()
  const authStore = useAuthStore()

  const userDisplayName = computed(() => {
    const user = authStore.currentUser
    return user?.name || user?.email || 'Asesor'
  })

  return {
    authStore,
    menuGroups: MENU_GROUPS,
    currentPath: computed(() => route.path),
    userDisplayName,
    userEmail: computed(() => authStore.currentUser?.email || ''),
    userInitial: computed(() => userDisplayName.value.charAt(0).toUpperCase()),
    pageMeta: computed(() => PAGE_META[route.path] || { title: 'Asesor', sub: '' }),
  }
}
