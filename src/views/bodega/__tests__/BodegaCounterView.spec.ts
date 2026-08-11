import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import BodegaCounterView from '../BodegaCounterView.vue'

const mocks = vi.hoisted(() => ({
  disponibles: vi.fn(),
  listar: vi.fn(),
  crear: vi.fn(),
  anular: vi.fn(),
  toast: vi.fn(),
}))

vi.mock('@/services/retiros_counter.api', () => ({
  retirosCounterApi: {
    disponibles: mocks.disponibles,
    listar: mocks.listar,
    crear: mocks.crear,
    anular: mocks.anular,
  },
}))

vi.mock('@/stores/toast.store', () => ({
  useToastStore: () => ({ showNotification: mocks.toast }),
}))

function paquete(id: string, clienteId: string, clienteNombre: string) {
  return {
    _id: id,
    wr: `WR-${id}`,
    sh: '',
    trackingOriginal: '',
    contenido: 'Zapatos',
    pesoLb: 2.5,
    consigneeNombre: clienteNombre,
    consigneeLimpio: clienteNombre,
    estado: 'pagado',
    masterClienteId: {
      _id: clienteId,
      nombre: clienteNombre,
      identificacion: '0102030405',
      email: `${clienteId}@mail.com`,
      telefono: '0991234567',
      codigoCasillero: 'CB-001',
    },
  }
}

describe('BodegaCounterView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.listar.mockResolvedValue([])
    mocks.disponibles.mockResolvedValue([])
  })

  async function mountView() {
    const wrapper = mount(BodegaCounterView)
    await flushPromises()
    return wrapper
  }

  it('renders the counter shell and loads the history', async () => {
    const wrapper = await mountView()
    expect(wrapper.text()).toContain('Counter digital')
    expect(mocks.listar).toHaveBeenCalled()
    expect(wrapper.text()).toContain('Todavía no hay retiros registrados')
  })

  it('lets the operator select packages and enables signing', async () => {
    mocks.disponibles.mockResolvedValue([
      paquete('p1', 'c1', 'Ana Pérez'),
      paquete('p2', 'c1', 'Ana Pérez'),
    ])
    const wrapper = await mountView()

    // Bypass the debounce: drive the search the way the timer would.
    await (wrapper.vm as any).buscar()
    await flushPromises()

    const boxes = wrapper.findAll('input[type="checkbox"]')
    expect(boxes.length).toBe(2)

    await boxes[0]!.setValue(true)
    await boxes[1]!.setValue(true)
    await flushPromises()

    expect(wrapper.text()).toContain('2')
    const signButton = wrapper.findAll('button').find((b) => b.text().includes('Firmar y entregar'))
    expect(signButton?.attributes('disabled')).toBeUndefined()
  })

  it('blocks signing when the selection mixes two clients', async () => {
    mocks.disponibles.mockResolvedValue([
      paquete('p1', 'c1', 'Ana Pérez'),
      paquete('p2', 'c2', 'Luis Mora'),
    ])
    const wrapper = await mountView()
    await (wrapper.vm as any).buscar()
    await flushPromises()

    const boxes = wrapper.findAll('input[type="checkbox"]')
    await boxes[0]!.setValue(true)
    await boxes[1]!.setValue(true)
    await flushPromises()

    expect(wrapper.text()).toContain('clientes distintos')
    const signButton = wrapper.findAll('button').find((b) => b.text().includes('Firmar y entregar'))
    expect(signButton?.attributes('disabled')).toBeDefined()
  })

  it('sends one retiro carrying every selected package', async () => {
    mocks.disponibles.mockResolvedValue([
      paquete('p1', 'c1', 'Ana Pérez'),
      paquete('p2', 'c1', 'Ana Pérez'),
    ])
    mocks.crear.mockResolvedValue({
      _id: 'r1',
      totalPaquetes: 2,
      retiradoPorNombre: 'Ana Pérez',
      clienteEmail: 'c1@mail.com',
      comprobanteUrl: 'https://cdn/retiro.pdf',
    })

    const wrapper = await mountView()
    await (wrapper.vm as any).buscar()
    await flushPromises()

    const boxes = wrapper.findAll('input[type="checkbox"]')
    await boxes[0]!.setValue(true)
    await boxes[1]!.setValue(true)

    const vm = wrapper.vm as any
    vm.firmaDataUrl = 'data:image/png;base64,AAAA'
    await vm.confirmarRetiro()
    await flushPromises()

    expect(mocks.crear).toHaveBeenCalledTimes(1)
    const payload = mocks.crear.mock.calls[0]![0]
    expect(payload.items).toHaveLength(2)
    expect(payload.items.map((i: any) => i.paqueteId)).toEqual(['p1', 'p2'])
    expect(payload.clienteNombre).toBe('Ana Pérez')
    expect(payload.firmaDataUrl).toBe('data:image/png;base64,AAAA')
  })

  it('refuses to submit without a signature', async () => {
    mocks.disponibles.mockResolvedValue([paquete('p1', 'c1', 'Ana Pérez')])
    const wrapper = await mountView()
    await (wrapper.vm as any).buscar()
    await flushPromises()

    await wrapper.findAll('input[type="checkbox"]')[0]!.setValue(true)

    const vm = wrapper.vm as any
    vm.firmaDataUrl = ''
    await vm.confirmarRetiro()

    expect(mocks.crear).not.toHaveBeenCalled()
    expect(mocks.toast).toHaveBeenCalledWith('Falta la firma del cliente', 'warning')
  })
})
