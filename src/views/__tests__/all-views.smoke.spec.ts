import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

/**
 * Mounts every routed view and layout to catch setup/template crashes a
 * typecheck cannot see: a missing import, a null deref in a computed, a store
 * read before it exists. All service modules are stubbed, so nothing hits the
 * network. Nested presentational components are excluded — they require props
 * and are covered by their own specs.
 */

const apiStub: any = new Proxy(function () {} as any, {
  get: (_t, prop) => (prop === 'then' ? undefined : apiStub),
  apply: () => Promise.resolve({ data: [], items: [], total: 0, results: [], gestiones: [], orders: [], notificaciones: [], retiros: [], paquetes: [], contactos: [], proveedores: [], envios: [], stats: {} }),
})

vi.mock('@/services/admin.api', () => ({ adminApi: apiStub, default: apiStub }))
vi.mock('@/services/asesoria.api', () => ({ asesoriaApi: apiStub, default: apiStub }))
vi.mock('@/services/auth.api', () => ({ authAPI: apiStub, default: apiStub }))
vi.mock('@/services/contactos.api', () => ({ contactosApi: apiStub, default: apiStub }))
vi.mock('@/services/contactos_cb.api', () => ({ contactosCbAPI: apiStub, default: apiStub }))
vi.mock('@/services/costos.api', () => ({ CATEGORIAS_POR_TIPO: apiStub, costosApi: apiStub, default: apiStub }))
vi.mock('@/services/courierbridge.api', () => ({ courierBridgeApi: apiStub, default: apiStub }))
vi.mock('@/services/cuentas_bancarias.api', () => ({ cuentasBancariasAPI: apiStub, default: apiStub }))
vi.mock('@/services/envios.api', () => ({ enviosApi: apiStub, default: apiStub }))
vi.mock('@/services/gestiones_compra.api', () => ({ gestionesCompraAPI: apiStub, default: apiStub }))
vi.mock('@/services/notificaciones.api', () => ({ notificacionesApi: apiStub, default: apiStub }))
vi.mock('@/services/proveedores.api', () => ({ proveedoresApi: apiStub, default: apiStub }))
vi.mock('@/services/retiros_counter.api', () => ({ retirosCounterApi: apiStub, default: apiStub }))
vi.mock('@/services/tracking', () => ({ fetchTracking: apiStub, trackingService: apiStub, default: apiStub }))

vi.mock('@/services/facturacion.api', () => ({
  facturacionApi: apiStub,
  calcularTotalesLocal: () => ({ pesoTotalLb: 0, totalFlete: 0, totalArancel: 0, subtotal: 0, totalIva: 0, totalGeneral: 0 }),
  default: apiStub,
}))

vi.mock('@/services/homologacion.api', () => ({ homologacionApi: apiStub, default: apiStub }))

vi.mock('@/services/solicitudes.api', () => ({ solicitudesApi: apiStub, default: apiStub }))

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<any>('vue-router')
  return {
    ...actual,
    useRoute: () => ({ params: { id: 'x', codigo: 'x', token: 'x', key: 'x' }, query: {}, path: '/', name: 'x', meta: {} }),
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), resolve: () => ({ href: '/' }) }),
    onBeforeRouteLeave: vi.fn(),
    onBeforeRouteUpdate: vi.fn(),
  }
})

const VIEWS: Array<[string, () => Promise<any>]> = [
  ['asesor/AsesorSolicitudesView.vue', () => import('@/views/asesor/AsesorSolicitudesView.vue')],
  ['PersonalShopperView.vue', () => import('@/views/PersonalShopperView.vue')],
  ['bodega/BodegaFacturacionView.vue', () => import('@/views/bodega/BodegaFacturacionView.vue')],
  ['admin/AdminHomologacionView.vue', () => import('@/views/admin/AdminHomologacionView.vue')],
  ['AboutView.vue', () => import('@/views/AboutView.vue')],
  ['ContactView.vue', () => import('@/views/ContactView.vue')],
  ['HomeView.vue', () => import('@/views/HomeView.vue')],
  ['PaymentPortalView.vue', () => import('@/views/PaymentPortalView.vue')],
  ['QuoteView.vue', () => import('@/views/QuoteView.vue')],
  ['SeguirCompraView.vue', () => import('@/views/SeguirCompraView.vue')],
  ['SeguirPedidoView.vue', () => import('@/views/SeguirPedidoView.vue')],
  ['ServicesView.vue', () => import('@/views/ServicesView.vue')],
  ['TrackingView.vue', () => import('@/views/TrackingView.vue')],
  ['admin/AdminCajaView.vue', () => import('@/views/admin/AdminCajaView.vue')],
  ['admin/AdminContactosView.vue', () => import('@/views/admin/AdminContactosView.vue')],
  ['admin/AdminCuentasBancariasView.vue', () => import('@/views/admin/AdminCuentasBancariasView.vue')],
  ['admin/AdminDashboardView.vue', () => import('@/views/admin/AdminDashboardView.vue')],
  ['admin/AdminEnviosView.vue', () => import('@/views/admin/AdminEnviosView.vue')],
  ['admin/AdminFeeConfigView.vue', () => import('@/views/admin/AdminFeeConfigView.vue')],
  ['admin/AdminLayout.vue', () => import('@/views/admin/AdminLayout.vue')],
  ['admin/AdminNotificacionesView.vue', () => import('@/views/admin/AdminNotificacionesView.vue')],
  ['admin/AdminPaymentsView.vue', () => import('@/views/admin/AdminPaymentsView.vue')],
  ['admin/AdminProduccionView.vue', () => import('@/views/admin/AdminProduccionView.vue')],
  ['admin/AdminProveedoresView.vue', () => import('@/views/admin/AdminProveedoresView.vue')],
  ['admin/AdminPurchaseOrdersView.vue', () => import('@/views/admin/AdminPurchaseOrdersView.vue')],
  ['admin/AdminReportesView.vue', () => import('@/views/admin/AdminReportesView.vue')],
  ['admin/AdminTrackingView.vue', () => import('@/views/admin/AdminTrackingView.vue')],
  ['admin/AdminUsersView.vue', () => import('@/views/admin/AdminUsersView.vue')],
  ['admin/ConciliacionView.vue', () => import('@/views/admin/ConciliacionView.vue')],
  ['admin/Costos/CostosIndex.vue', () => import('@/views/admin/Costos/CostosIndex.vue')],
  ['admin/DashboardView.vue', () => import('@/views/admin/DashboardView.vue')],
  ['admin/GestionesCompra/AdminGestionCompraDetailView.vue', () => import('@/views/admin/GestionesCompra/AdminGestionCompraDetailView.vue')],
  ['admin/GestionesCompra/AdminGestionesCompraView.vue', () => import('@/views/admin/GestionesCompra/AdminGestionesCompraView.vue')],
  ['admin/GestionesCompra/AdminNuevaGestionView.vue', () => import('@/views/admin/GestionesCompra/AdminNuevaGestionView.vue')],
  ['admin/LoginView.vue', () => import('@/views/admin/LoginView.vue')],
  ['admin/SuperadminDashboardView.vue', () => import('@/views/admin/SuperadminDashboardView.vue')],
  ['asesor/AsesorCalculatorView.vue', () => import('@/views/asesor/AsesorCalculatorView.vue')],
  ['asesor/AsesorContactoDetailView.vue', () => import('@/views/asesor/AsesorContactoDetailView.vue')],
  ['asesor/AsesorContactosView.vue', () => import('@/views/asesor/AsesorContactosView.vue')],
  ['asesor/AsesorDashboardView.vue', () => import('@/views/asesor/AsesorDashboardView.vue')],
  ['asesor/AsesorGestionCompraDetailView.vue', () => import('@/views/asesor/AsesorGestionCompraDetailView.vue')],
  ['asesor/AsesorGestionesCompraView.vue', () => import('@/views/asesor/AsesorGestionesCompraView.vue')],
  ['asesor/AsesorLayout.vue', () => import('@/views/asesor/AsesorLayout.vue')],
  ['asesor/AsesorNuevaGestionView.vue', () => import('@/views/asesor/AsesorNuevaGestionView.vue')],
  ['asesor/AsesorOrderDetailView.vue', () => import('@/views/asesor/AsesorOrderDetailView.vue')],
  ['asesor/AsesorOrdersView.vue', () => import('@/views/asesor/AsesorOrdersView.vue')],
  ['bodega/BodegaCompraDetailView.vue', () => import('@/views/bodega/BodegaCompraDetailView.vue')],
  ['bodega/BodegaComprasView.vue', () => import('@/views/bodega/BodegaComprasView.vue')],
  ['bodega/BodegaCounterView.vue', () => import('@/views/bodega/BodegaCounterView.vue')],
  ['bodega/BodegaEnviosView.vue', () => import('@/views/bodega/BodegaEnviosView.vue')],
  ['bodega/BodegaLayout.vue', () => import('@/views/bodega/BodegaLayout.vue')],
  ['bodega/BodegaMotorizadosView.vue', () => import('@/views/bodega/BodegaMotorizadosView.vue')],
  ['motorizado/MotorizadoEntregaDetailView.vue', () => import('@/views/motorizado/MotorizadoEntregaDetailView.vue')],
  ['motorizado/MotorizadoEntregasView.vue', () => import('@/views/motorizado/MotorizadoEntregasView.vue')],
  ['motorizado/MotorizadoLayout.vue', () => import('@/views/motorizado/MotorizadoLayout.vue')],
  ['shared/GestionCompraWizard/GestionCompraWizard.vue', () => import('@/views/shared/GestionCompraWizard/GestionCompraWizard.vue')],
  ['shared/GestionCompraWizard/StepAsesor.vue', () => import('@/views/shared/GestionCompraWizard/StepAsesor.vue')],
  ['shared/GestionCompraWizard/StepCliente.vue', () => import('@/views/shared/GestionCompraWizard/StepCliente.vue')],
  ['shared/GestionCompraWizard/StepComision.vue', () => import('@/views/shared/GestionCompraWizard/StepComision.vue')],
  ['shared/GestionCompraWizard/StepCostoVenta.vue', () => import('@/views/shared/GestionCompraWizard/StepCostoVenta.vue')],
  ['shared/GestionCompraWizard/StepFechaEntrega.vue', () => import('@/views/shared/GestionCompraWizard/StepFechaEntrega.vue')],
  ['shared/GestionCompraWizard/StepImagenCompra.vue', () => import('@/views/shared/GestionCompraWizard/StepImagenCompra.vue')],
  ['shared/GestionCompraWizard/StepPaginaCompra.vue', () => import('@/views/shared/GestionCompraWizard/StepPaginaCompra.vue')],
  ['shared/GestionCompraWizard/StepReserva.vue', () => import('@/views/shared/GestionCompraWizard/StepReserva.vue')],
  ['shared/GestionCompraWizard/StepResumen.vue', () => import('@/views/shared/GestionCompraWizard/StepResumen.vue')],
  ['shared/GestionCompraWizard/StepValorTotal.vue', () => import('@/views/shared/GestionCompraWizard/StepValorTotal.vue')]
]

describe('todas las vistas montan sin errores', () => {
  let errors: string[] = []
  let spy: any

  beforeEach(() => {
    setActivePinia(createPinia())
    errors = []
    localStorage.setItem('admin_token', 'test-token')
    spy = vi.spyOn(console, 'error').mockImplementation((...args: any[]) => {
      errors.push(args.map(String).join(' '))
    })
  })

  afterEach(() => {
    spy?.mockRestore()
    vi.clearAllMocks()
  })

  it.each(VIEWS)('%s', async (_name, load) => {
    const mod = await load()
    const wrapper = mount(mod.default, {
      global: {
        stubs: {
          teleport: true,
          RouterLink: { template: '<a><slot /></a>' },
          RouterView: { template: '<div />' },
          transition: false,
        },
        config: { warnHandler: () => {} },
      },
    })
    await flushPromises()

    const fatal = errors.filter((e) =>
      /Unhandled error|render function|setup function|Cannot read|is not a function|is not defined|No "\w+" export/i.test(e))
    expect(fatal, fatal.join('\n---\n')).toEqual([])
    expect(wrapper.html()).toBeTruthy()
    wrapper.unmount()
  })
})
