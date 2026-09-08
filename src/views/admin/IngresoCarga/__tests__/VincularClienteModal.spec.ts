import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import VincularClienteModal from '../VincularClienteModal.vue'
import type { FilaIngreso } from '@/services/ingreso_carga.api'

const mocks = vi.hoisted(() => ({ buscarClientes: vi.fn() }))

vi.mock('@/services/homologacion.api', () => ({
  homologacionApi: { buscarClientes: mocks.buscarClientes },
}))

vi.mock('@/stores/toast.store', () => ({
  useToastStore: () => ({ showNotification: vi.fn() }),
}))

const AppOverlayStub = {
  props: ['open', 'label', 'layer'],
  emits: ['close'],
  template: '<div v-if="open"><slot /></div>',
}

function fila(overrides: Partial<FilaIngreso> = {}): FilaIngreso {
  return {
    fila: 2, wr: 'WR839943', mg: 'MG002516', fechaIngreso: '2026-08-25',
    cliente: 'MARIA ELIZABETH GILER', clienteNombreOficial: 'MARIA ELIZABETH GILER', casillero: '(se asignará)',
    agencia: 'COURIER BOX', contenido: '5 suplementos', pesoLb: 8, tracking: '', accion: 'creado', paquete: 'nuevo',
    sugerencias: [
      { masterId: 'm1', nombreOficial: 'MARIA ELIZABETH GILER TORRES', casillero: 'CBX444444', score: 0.78 },
      { masterId: 'm2', nombreOficial: 'MARIA GILER', casillero: 'CBX555555', score: 0.6 },
    ],
    ...overrides,
  }
}

function mountModal(f: FilaIngreso | null = fila()) {
  return mount(VincularClienteModal, {
    props: { fila: f },
    global: { stubs: { AppOverlay: AppOverlayStub, AppSkeleton: true } },
  })
}

describe('VincularClienteModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  it('muestra los parecidos con su porcentaje y no deja confirmar sin elegir', () => {
    const wrapper = mountModal()

    expect(wrapper.text()).toContain('¿A quién pertenece «MARIA ELIZABETH GILER»?')
    expect(wrapper.get('[data-test="sugerencia-m1"]').text()).toContain('78%')
    expect(wrapper.get('[data-test="sugerencia-m1"]').text()).toContain('CBX444444')
    expect((wrapper.get('[data-test="confirmar-vinculo"]').element as HTMLButtonElement).disabled).toBe(true)
  })

  it('elegir un parecido y vincular emite ese cliente', async () => {
    const wrapper = mountModal()

    await wrapper.get('[data-test="sugerencia-m1"]').trigger('click')
    expect(wrapper.get('[data-test="eleccion"]').text()).toContain('MARIA ELIZABETH GILER TORRES')
    await wrapper.get('[data-test="confirmar-vinculo"]').trigger('click')

    expect(wrapper.emitted('vincular')?.[0]).toEqual([{ _id: 'm1', nombreOficial: 'MARIA ELIZABETH GILER TORRES', codigoCasillero: 'CBX444444' }])
  })

  it('un parecido alto arranca preseleccionado, así confirmar es un clic', () => {
    const wrapper = mountModal(fila({ accion: 'aproximado', score: 0.91, coincideCon: 'MARIA ELIZABETH GILER TORRES' }))

    expect(wrapper.get('[data-test="sugerencia-m1"]').classes()).toContain('selected')
    expect((wrapper.get('[data-test="confirmar-vinculo"]').element as HTMLButtonElement).disabled).toBe(false)
  })

  it('crear como nuevo emite crear', async () => {
    const wrapper = mountModal()

    await wrapper.get('[data-test="crear-nuevo"]').trigger('click')
    expect(wrapper.get('[data-test="confirmar-vinculo"]').text()).toContain('Crear nuevo')
    await wrapper.get('[data-test="confirmar-vinculo"]').trigger('click')

    expect(wrapper.emitted('crear')).toHaveLength(1)
    expect(wrapper.emitted('vincular')).toBeUndefined()
  })

  it('buscar otro cliente consulta al backend y permite elegirlo', async () => {
    mocks.buscarClientes.mockResolvedValue([{ _id: 'z9', nombreOficial: 'Zoila Perez', codigoCasillero: 'CBX999999' }])
    const wrapper = mountModal()

    await wrapper.get('[data-test="buscar"]').setValue('zoila')
    vi.advanceTimersByTime(350)
    await flushPromises()

    expect(mocks.buscarClientes).toHaveBeenCalledWith('zoila')
    await wrapper.get('[data-test="resultado-z9"]').trigger('click')
    await wrapper.get('[data-test="confirmar-vinculo"]').trigger('click')

    expect(wrapper.emitted('vincular')?.[0]).toEqual([{ _id: 'z9', nombreOficial: 'Zoila Perez', codigoCasillero: 'CBX999999' }])
  })
})
