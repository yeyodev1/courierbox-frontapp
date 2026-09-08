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

/**
 * What a stubbed request resolves to. The views read many shapes out of a
 * response (`res.data.total.toFixed(2)`, `res.items.filter(...)`,
 * `res.cliente.nombre.toUpperCase()`), and a fixed `{ data: [] }` object made
 * every other path blow up asynchronously, after mount, as an unhandled
 * rejection that vitest reported as an error even though every test passed.
 * This value answers any property with itself, behaves as an empty array for
 * array methods, as 0 for numbers and as '' for strings, so no data shape can
 * crash a view — which is the point: the smoke test looks for setup/template
 * crashes, not for data contracts, which the per-view specs cover.
 */
function valorCamaleon(): any {
  const objetivo = function () {}
  const p: any = new Proxy(objetivo, {
    get(_t, prop) {
      if (prop === 'then') return undefined // never mistaken for a thenable
      if (prop === Symbol.toPrimitive) return () => 0
      if (prop === Symbol.iterator) return [][Symbol.iterator]
      if (prop === 'length') return 0
      if (prop === 'toString' || prop === 'toLocaleString' || prop === 'toISOString') return () => ''
      if (prop === 'toFixed') return () => '0.00'
      if (prop === 'valueOf') return () => 0
      if (typeof prop === 'string' && typeof (Array.prototype as any)[prop] === 'function') {
        // Booleans, numbers and strings come out real (`some`, `indexOf`,
        // `join`, `reduce` with a seed); an array or nothing comes back as the
        // chameleon so that `x.slice(0, 6).toUpperCase()` and `items.filter().map()`
        // keep working either way.
        return (...args: any[]) => {
          const r = ([] as any[])[prop as any](...args)
          return Array.isArray(r) || r === undefined ? p : r
        }
      }
      return p
    },
    apply: () => p, // `x.nombre.toUpperCase()` and friends stay synchronous
  })
  return p
}

const dato = valorCamaleon()

/** A service module: any method, any depth, resolves asynchronously to `dato`. */
const apiStub: any = new Proxy(function () {} as any, {
  get: (_t, prop) => (prop === 'then' ? undefined : apiStub),
  apply: () => Promise.resolve(dato),
})

// Direct HTTP users outside the service modules: the wizard's asesor step
// instantiates httpBase itself, and "Seguir pedido" calls axios straight.
vi.mock('@/services/httpBase', () => {
  class APIBase {
    get = () => Promise.resolve(dato)
    post = () => Promise.resolve(dato)
    put = () => Promise.resolve(dato)
    patch = () => Promise.resolve(dato)
    delete = () => Promise.resolve(dato)
  }
  return { default: APIBase, http: new APIBase() }
})
vi.mock('axios', () => ({
  default: { get: apiStub, post: apiStub, put: apiStub, patch: apiStub, delete: apiStub, isAxiosError: () => false, create: () => apiStub },
}))

vi.mock('@/services/admin.api', () => ({ adminApi: apiStub, default: apiStub }))
vi.mock('@/services/asesoria.api', () => ({ asesoriaApi: apiStub, default: apiStub }))
vi.mock('@/services/auth.api', () => ({ authAPI: apiStub, default: apiStub }))
vi.mock('@/services/contactos.api', () => ({ contactosApi: apiStub, default: apiStub }))
vi.mock('@/services/contactos_cb.api', () => ({ contactosCbAPI: apiStub, default: apiStub }))
// `CATEGORIAS_POR_TIPO` is a plain lookup, not a client: stubbing it with the
// catch-all proxy handed the toolbar a function where it declares an array.
vi.mock('@/services/costos.api', () => ({
  CATEGORIAS_POR_TIPO: { operacional: [], logistico: [], envio: [], recepcion: [] },
  costosApi: apiStub,
  default: apiStub,
}))
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
vi.mock('@/services/ingreso_carga.api', () => ({ ingresoCargaApi: apiStub, default: apiStub }))

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
  ['NotFoundView.vue', () => import('@/views/NotFoundView.vue')],
  ['asesor/AsesorSolicitudesView.vue', () => import('@/views/asesor/AsesorSolicitudesView.vue')],
  ['PersonalShopperView.vue', () => import('@/views/PersonalShopperView.vue')],
  ['bodega/BodegaFacturacionView.vue', () => import('@/views/bodega/BodegaFacturacionView.vue')],
  ['admin/AdminHomologacionView.vue', () => import('@/views/admin/AdminHomologacionView.vue')],
  ['admin/AdminIngresoCargaView.vue', () => import('@/views/admin/AdminIngresoCargaView.vue')],
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
  ['admin/CentroCostos/CentroCostosLayout.vue', () => import('@/views/admin/CentroCostos/CentroCostosLayout.vue')],
  ['admin/CentroCostos/GastosGeneralesView.vue', () => import('@/views/admin/CentroCostos/GastosGeneralesView.vue')],
  ['admin/CentroCostos/GastosEnviosView.vue', () => import('@/views/admin/CentroCostos/GastosEnviosView.vue')],
  ['admin/CentroCostos/RecepcionesView.vue', () => import('@/views/admin/CentroCostos/RecepcionesView.vue')],
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
