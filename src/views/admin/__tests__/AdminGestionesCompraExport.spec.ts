import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminGestionesCompraView from '../GestionesCompra/AdminGestionesCompraView.vue'

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  stats: vi.fn(),
  download: vi.fn(),
  getUsers: vi.fn(),
  push: vi.fn(),
  toast: vi.fn(),
  createObjectURL: vi.fn(),
  revokeObjectURL: vi.fn(),
}))

vi.mock('vue-router', () => ({ useRouter: () => ({ push: mocks.push }) }))
vi.mock('@/stores/toast.store', () => ({ useToastStore: () => ({ showNotification: mocks.toast }) }))
vi.mock('@/services/admin.api', () => ({ adminApi: { getUsers: mocks.getUsers } }))
vi.mock('@/services/gestiones_compra.api', () => ({
  gestionesCompraAPI: {
    list: mocks.list,
    getStatsMensuales: mocks.stats,
    downloadExport: mocks.download,
  },
}))

describe('AdminGestionesCompraView exportaciones', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.list.mockResolvedValue({ gestiones: [], total: 0, page: 1, pages: 0, limit: 20 })
    mocks.stats.mockResolvedValue({
      totalGestiones: 0,
      sumaValorTotal: 0,
      sumaComision: 0,
      sumaCostoVenta: 0,
      sumaMargenNeto: 0,
      sumaValorPagado: 0,
      ventasConfirmadas: 0,
      comisionGanada: 0,
      porEstado: {},
      porEstadoPago: {},
    })
    mocks.getUsers.mockResolvedValue({ users: [] })
    mocks.download.mockResolvedValue(new Blob(['archivo'], { type: 'application/octet-stream' }))
    mocks.createObjectURL.mockReturnValue('blob:gestiones-export')
    vi.stubGlobal('URL', { createObjectURL: mocks.createObjectURL, revokeObjectURL: mocks.revokeObjectURL })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  })

  it.each([
    ['Excel', 'excel'],
    ['PDF', 'pdf'],
  ] as const)('descarga %s al hacer clic', async (label, format) => {
    const wrapper = mount(AdminGestionesCompraView)
    await flushPromises()
    const button = wrapper.findAll('button').find((candidate) => candidate.text().includes(label))
    expect(button).toBeDefined()
    await button!.trigger('click')
    await flushPromises()

    expect(mocks.download).toHaveBeenCalledWith(expect.objectContaining({ format }))
    expect(mocks.createObjectURL).toHaveBeenCalledWith(expect.any(Blob))
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled()
    expect(mocks.toast).toHaveBeenCalledWith(expect.stringContaining('descargado correctamente'), 'success')
  })
})
