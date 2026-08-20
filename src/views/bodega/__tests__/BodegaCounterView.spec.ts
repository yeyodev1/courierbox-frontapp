import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
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

/** Stands in for the canvas pad: a button that reports a signature was drawn. */
const SignaturePadStub = defineComponent({
  emits: ['change'],
  setup(_, { emit }) {
    return () =>
      h('button', { class: 'stub-sign', onClick: () => emit('change', 'data:image/png;base64,AAAA') }, 'firmar')
  },
})

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
    vi.useFakeTimers()
    mocks.listar.mockResolvedValue([])
    mocks.disponibles.mockResolvedValue([])
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  async function mountView() {
    const wrapper = mount(BodegaCounterView, {
      global: { stubs: { AppSignaturePad: SignaturePadStub } },
    })
    await flushPromises()
    return wrapper
  }

  /** Types a query and lets the 350ms debounce fire, the way an operator would. */
  async function search(wrapper: Awaited<ReturnType<typeof mountView>>) {
    await wrapper.find('input[type="search"]').setValue('ana')
    await vi.advanceTimersByTimeAsync(400)
    await flushPromises()
  }

  const signButton = (wrapper: Awaited<ReturnType<typeof mountView>>) =>
    wrapper.findAll('button').find((b) => b.text().includes('Firmar y entregar'))

  it('renders the counter shell and loads the history', async () => {
    const wrapper = await mountView()
    expect(wrapper.text()).toContain('Counter digital')
    expect(mocks.listar).toHaveBeenCalled()
    expect(wrapper.text()).toContain('Todavía no hay retiros registrados')
  })

  it('lets the operator select packages and enables signing', async () => {
    mocks.disponibles.mockResolvedValue([paquete('p1', 'c1', 'Ana Pérez'), paquete('p2', 'c1', 'Ana Pérez')])
    const wrapper = await mountView()
    await search(wrapper)

    const boxes = wrapper.findAll('input[type="checkbox"]')
    expect(boxes.length).toBe(2)

    await boxes[0]!.setValue(true)
    await boxes[1]!.setValue(true)
    await flushPromises()

    expect(wrapper.text()).toContain('2')
    expect(signButton(wrapper)?.attributes('disabled')).toBeUndefined()
  })

  it('blocks signing when the selection mixes two clients', async () => {
    mocks.disponibles.mockResolvedValue([paquete('p1', 'c1', 'Ana Pérez'), paquete('p2', 'c2', 'Luis Mora')])
    const wrapper = await mountView()
    await search(wrapper)

    const boxes = wrapper.findAll('input[type="checkbox"]')
    await boxes[0]!.setValue(true)
    await boxes[1]!.setValue(true)
    await flushPromises()

    expect(wrapper.text()).toContain('clientes distintos')
    expect(signButton(wrapper)?.attributes('disabled')).toBeDefined()
  })

  it('sends one retiro carrying every selected package', async () => {
    mocks.disponibles.mockResolvedValue([paquete('p1', 'c1', 'Ana Pérez'), paquete('p2', 'c1', 'Ana Pérez')])
    mocks.crear.mockResolvedValue({
      _id: 'r1',
      totalPaquetes: 2,
      retiradoPorNombre: 'Ana Pérez',
      clienteEmail: 'c1@mail.com',
      comprobanteUrl: 'https://cdn/retiro.pdf',
    })

    const wrapper = await mountView()
    await search(wrapper)

    const boxes = wrapper.findAll('input[type="checkbox"]')
    await boxes[0]!.setValue(true)
    await boxes[1]!.setValue(true)
    await flushPromises()

    await signButton(wrapper)!.trigger('click')
    await flushPromises()

    await wrapper.find('.stub-sign').trigger('click')
    await flushPromises()

    const confirm = wrapper.findAll('button').find((b) => b.text().includes('Confirmar y enviar'))
    await confirm!.trigger('click')
    await flushPromises()

    expect(mocks.crear).toHaveBeenCalledTimes(1)
    const payload = mocks.crear.mock.calls[0]![0]
    expect(payload.items).toHaveLength(2)
    expect(payload.items.map((i: { paqueteId: string }) => i.paqueteId)).toEqual(['p1', 'p2'])
    expect(payload.clienteNombre).toBe('Ana Pérez')
    expect(payload.firmaDataUrl).toBe('data:image/png;base64,AAAA')
  })

  it('keeps the confirm button disabled until a signature is drawn', async () => {
    mocks.disponibles.mockResolvedValue([paquete('p1', 'c1', 'Ana Pérez')])
    const wrapper = await mountView()
    await search(wrapper)

    await wrapper.findAll('input[type="checkbox"]')[0]!.setValue(true)
    await flushPromises()

    await signButton(wrapper)!.trigger('click')
    await flushPromises()

    const confirm = wrapper.findAll('button').find((b) => b.text().includes('Confirmar y enviar'))
    expect(confirm!.attributes('disabled')).toBeDefined()

    await confirm!.trigger('click')
    await flushPromises()
    expect(mocks.crear).not.toHaveBeenCalled()
  })
})
