import { flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminDashboardView from '../AdminDashboardView.vue'

const mocks = vi.hoisted(() => ({
  getPayments: vi.fn(),
  getUsers: vi.fn(),
  getData: vi.fn(),
  costosResumen: vi.fn(),
  gestionesStats: vi.fn(),
  push: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mocks.push }),
}))

vi.mock('@/services/admin.api', () => ({
  adminApi: {
    getPayments: mocks.getPayments,
    getUsers: mocks.getUsers,
    getData: mocks.getData,
  },
}))

vi.mock('@/services/costos.api', () => ({
  costosApi: {
    resumen: mocks.costosResumen,
  },
}))

vi.mock('@/services/gestiones_compra.api', () => ({
  gestionesCompraAPI: {
    getStatsMensuales: mocks.gestionesStats,
  },
}))

describe('AdminDashboardView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getPayments.mockResolvedValue({ payments: [{ createdAt: new Date().toISOString(), status: 'pending' }] })
    mocks.getUsers.mockResolvedValue({ users: [{ _id: 'u1' }] })
    mocks.getData.mockImplementation((endpoint: string) => {
      if (endpoint === 'v1/etl/pendientes') return Promise.resolve({ paquetes: [{ _id: 'p1' }] })
      if (endpoint === 'v1/conciliacion/resumen') return Promise.resolve({ resumen: { total: 3 } })
      return Promise.resolve({})
    })
    mocks.costosResumen.mockResolvedValue({ resumen: { total: { total: 123.45 } } })
    mocks.gestionesStats.mockResolvedValue({ totalGestiones: 2, sumaValorTotal: 100, sumaComision: 6, sumaCostoVenta: 70, sumaMargenNeto: 24, porEstado: {} })
  })

  it('muestra el total de gastos y pide el resumen de costos', async () => {
    const wrapper = mount(AdminDashboardView)
    await flushPromises()

    expect(mocks.costosResumen).toHaveBeenCalled()
    expect(wrapper.text()).toContain('Gastos')
    expect(wrapper.text()).toContain('$123.45')
  })

  it('navega a costos desde acceso rápido', async () => {
    const wrapper = mount(AdminDashboardView)
    await flushPromises()

    await wrapper.get('button[aria-label="Ir a Gastos"]').trigger('click')
    expect(mocks.push).toHaveBeenCalledWith('/admin/costos')
  })

  it('muestra "—" y avisa cuando una fuente falla, en vez de un 0 inventado', async () => {
    mocks.costosResumen.mockRejectedValue(new Error('502'))

    const wrapper = mount(AdminDashboardView)
    await flushPromises()

    // El 0 sería indistinguible de un día sin gastos reales.
    expect(wrapper.text()).not.toContain('$0.00')
    expect(wrapper.text()).toContain('—')
    expect(wrapper.text()).toContain('no se pudo cargar')
  })

  it('una fuente caída no impide que las demás se muestren', async () => {
    mocks.getData.mockRejectedValue(new Error('502'))

    const wrapper = mount(AdminDashboardView)
    await flushPromises()

    // Antes las llamadas iban encadenadas dentro de un solo try, así que la
    // primera en fallar dejaba en cero todo lo que venía después.
    expect(wrapper.text()).toContain('$123.45')
  })

  it('separa los miles en los montos', async () => {
    mocks.costosResumen.mockResolvedValue({ resumen: { total: { total: 12280.5 } } })

    const wrapper = mount(AdminDashboardView)
    await flushPromises()

    expect(wrapper.text()).toContain('$12,280.50')
  })

  it('muestra skeleton mientras carga los datos', async () => {
    mocks.getPayments.mockReturnValue(new Promise(() => {}))
    mocks.getUsers.mockReturnValue(new Promise(() => {}))
    mocks.getData.mockReturnValue(new Promise(() => {}))
    mocks.costosResumen.mockReturnValue(new Promise(() => {}))

    const wrapper = mount(AdminDashboardView)
    await nextTick()

    expect(wrapper.find('.dashboard-skeleton').exists()).toBe(true)
    expect(wrapper.findAll('.skeleton-stat')).toHaveLength(6)
    expect(wrapper.findAll('.skeleton-action')).toHaveLength(5)
  })
})
