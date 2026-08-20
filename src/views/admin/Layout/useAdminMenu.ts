import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

export interface MenuItem {
  path: string
  label: string
  icon: string
  match: (routePath: string) => boolean
}

export interface MenuGroup {
  label: string
  items: MenuItem[]
}

/** Every admin page keyed by route, so the top bar can name what you are looking at. */
const PAGE_META: Record<string, { title: string; sub: string }> = {
  '/admin': { title: 'Dashboard', sub: 'Resumen general del sistema' },
  '/superadmin': { title: 'Dashboard Ejecutivo', sub: 'Control privado y visión ejecutiva' },
  '/admin/payments': { title: 'Links de Pago', sub: 'Genera y administra links de pago' },
  '/admin/users': { title: 'Usuarios', sub: 'Administra los miembros del equipo' },
  '/admin/tracking': { title: 'Tracking Interno', sub: 'Consulta el estado de los envíos' },
  '/admin/fee-config': { title: 'Configuración de tarifas', sub: 'Define el fee de gestión para asesores' },
  '/admin/purchase-orders': { title: 'Histórico de Órdenes', sub: 'Consulta órdenes anteriores sin modificar sus datos' },
  '/admin/costos': { title: 'Costos y Gastos', sub: 'Registra costos operacionales, logísticos y de envío' },
  '/admin/proveedores': { title: 'Proveedores', sub: 'Crea y administra los proveedores conectados a costos y envíos' },
  '/admin/envios': { title: 'Envíos a Domicilio', sub: 'Gestiona los envíos de última milla' },
  '/admin/caja': { title: 'Caja', sub: 'Movimientos de ingreso y egreso' },
  '/admin/produccion': { title: 'Ventas diarias', sub: 'Facturado por courier, gestión de compra y ventas' },
  '/admin/reportes': { title: 'Estado de Resultados', sub: 'Resultados, gastos y flujo real' },
  '/admin/homologacion': { title: 'Homologación de clientes', sub: 'Vincula los paquetes del manifiesto con su dueño' },
  '/admin/contactos': { title: 'Contactos', sub: 'Busca clientes, revisa órdenes e historial de gestión' },
  '/admin/conciliacion': { title: 'Conciliación Bancaria', sub: 'Cruza pagos con transacciones bancarias' },
  '/admin/gestiones-compra': { title: 'Gestiones de Compra', sub: 'Administra las gestiones de compra del equipo' },
  '/admin/cuentas-bancarias': { title: 'Cuentas Bancarias', sub: 'Configura las cuentas de cobro de reservas' },
  '/admin/notificaciones': { title: 'Notificaciones', sub: 'Supervisa y reintenta la entrega de correos' },
  '/superadmin/reportes': { title: 'Estado de Resultados', sub: 'Visión ejecutiva privada' },
  '/superadmin/produccion': { title: 'Ventas diarias', sub: 'Control privado de ventas' },
  '/superadmin/caja': { title: 'Caja', sub: 'Seguimiento financiero privado' },
}

/** Navigation tree, page title and the signed-in identity shown in the shell. */
export function useAdminMenu() {
  const route = useRoute()
  const authStore = useAuthStore()

  const currentRole = computed(() => authStore.userRole || 'admin')
  const basePath = computed(() => (currentRole.value === 'superadmin' ? '/superadmin' : '/admin'))
  const currentPath = computed(() => route.path)

  const p = (path: string) => `${basePath.value}${path}`
  /** Highlights a section for every page nested under it. */
  const under = (path: string) => (routePath: string) => routePath.startsWith(path)

  const menuGroups = computed<MenuGroup[]>(() => {
    if (currentRole.value === 'superadmin') {
      return [
        {
          label: 'Privado',
          items: [
            { path: p(''), label: 'Dashboard Ejecutivo', icon: 'fa-solid fa-chart-line', match: under('/superadmin') },
            { path: p('/reportes'), label: 'Estado de Resultados', icon: 'fa-solid fa-file-invoice-dollar', match: under('/superadmin/reportes') },
            { path: p('/produccion'), label: 'Ventas', icon: 'fa-solid fa-cash-register', match: under('/superadmin/produccion') },
            { path: p('/caja'), label: 'Caja', icon: 'fa-solid fa-vault', match: under('/superadmin/caja') },
            { path: '/admin/notificaciones', label: 'Notificaciones', icon: 'fa-solid fa-envelope', match: under('/admin/notificaciones') },
          ],
        },
      ]
    }

    const base = basePath.value
    return [
      {
        label: 'Navegación',
        items: [
          { path: p(''), label: 'Dashboard', icon: 'fa-solid fa-chart-pie', match: (routePath: string) => routePath === base },
          { path: p('/payments'), label: 'Links de Pago', icon: 'fa-solid fa-link', match: under(`${base}/payments`) },
          { path: p('/users'), label: 'Usuarios', icon: 'fa-solid fa-users', match: under(`${base}/users`) },
          { path: p('/tracking'), label: 'Tracking Interno', icon: 'fa-solid fa-magnifying-glass-location', match: under(`${base}/tracking`) },
        ],
      },
      {
        label: 'Operaciones',
        items: [
          { path: p('/purchase-orders'), label: 'Histórico de Órdenes', icon: 'fa-solid fa-box-archive', match: under(`${base}/purchase-orders`) },
          { path: p('/envios'), label: 'Envíos', icon: 'fa-solid fa-truck', match: under(`${base}/envios`) },
          { path: p('/homologacion'), label: 'Homologación', icon: 'fa-solid fa-people-arrows', match: under(`${base}/homologacion`) },
          { path: p('/contactos'), label: 'Contactos', icon: 'fa-solid fa-address-book', match: under(`${base}/contactos`) },
          { path: p('/notificaciones'), label: 'Notificaciones', icon: 'fa-solid fa-envelope', match: under(`${base}/notificaciones`) },
        ],
      },
      {
        label: 'Finanzas',
        items: [
          { path: '/bodega/facturacion', label: 'Facturación', icon: 'fa-solid fa-file-invoice-dollar', match: under('/bodega/facturacion') },
          { path: p('/costos'), label: 'Costos y Gastos', icon: 'fa-solid fa-coins', match: under(`${base}/costos`) },
          { path: p('/proveedores'), label: 'Proveedores', icon: 'fa-solid fa-truck-fast', match: under(`${base}/proveedores`) },
          { path: p('/caja'), label: 'Caja', icon: 'fa-solid fa-vault', match: under(`${base}/caja`) },
          { path: p('/reportes'), label: 'Estado de Resultados', icon: 'fa-solid fa-file-invoice-dollar', match: under(`${base}/reportes`) },
        ],
      },
      {
        label: 'Producción',
        items: [
          { path: p('/produccion'), label: 'Ventas', icon: 'fa-solid fa-cash-register', match: under(`${base}/produccion`) },
          { path: p('/conciliacion'), label: 'Conciliación', icon: 'fa-solid fa-file-invoice', match: under(`${base}/conciliacion`) },
        ],
      },
      {
        label: 'Gestión de Compra',
        items: [
          { path: p('/gestiones-compra'), label: 'Gestiones de Compra', icon: 'fa-solid fa-bag-shopping', match: under(`${base}/gestiones-compra`) },
          { path: p('/cuentas-bancarias'), label: 'Cuentas Bancarias', icon: 'fa-solid fa-building-columns', match: under(`${base}/cuentas-bancarias`) },
        ],
      },
      {
        label: 'Asesores',
        items: [
          { path: p('/fee-config'), label: 'Tarifas', icon: 'fa-solid fa-calculator', match: under(`${base}/fee-config`) },
        ],
      },
    ]
  })

  const userDisplayName = computed(() => {
    const user = authStore.currentUser
    return user?.name || user?.email || 'Admin'
  })

  const userEmail = computed(() => authStore.currentUser?.email || '')
  const userInitial = computed(() => userDisplayName.value.charAt(0).toUpperCase())

  const roleLabel = computed(() => {
    if (currentRole.value === 'superadmin') return 'Private Suite'
    if (currentRole.value === 'gerencia') return 'Gerencia'
    return 'Admin Panel'
  })

  const pageMeta = computed(() => PAGE_META[route.path] || { title: 'Admin', sub: '' })

  return { authStore, currentPath, menuGroups, userDisplayName, userEmail, userInitial, roleLabel, pageMeta }
}
