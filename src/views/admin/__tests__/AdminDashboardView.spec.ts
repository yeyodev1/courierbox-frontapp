import { flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminDashboardView from '../AdminDashboardView.vue'

const mocks = vi.hoisted(() => ({
  getPayments: vi.fn(),
  getUsers: vi.fn(),
  getData: vi.fn(),
  costosResumen: vi.fn(),
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
