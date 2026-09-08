import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminIngresoCargaView from '../../AdminIngresoCargaView.vue'
import type { ResultadoIngreso } from '@/services/ingreso_carga.api'

const mocks = vi.hoisted(() => ({
  previsualizar: vi.fn(),
  aplicar: vi.fn(),
  notify: vi.fn(),
}))

vi.mock('@/services/ingreso_carga.api', () => ({
  ingresoCargaApi: { previsualizar: mocks.previsualizar, aplicar: mocks.aplicar },
}))

vi.mock('@/stores/toast.store', () => ({
  useToastStore: () => ({ showNotification: mocks.notify }),
}))

const AppFileUploadStub = {
  props: ['modelValue', 'label', 'hint', 'accept', 'disabled', 'error'],
  emits: ['update:modelValue'],
  template: `
    <div>
      <input type="file" data-test="file" :disabled="disabled" @change="$emit('update:modelValue', $event.target.files?.[0] || null)" />
      <p v-if="error" data-test="error-archivo">{{ error }}</p>
    </div>
  `,
}

/** El resultado con el que el backend describe el archivo real de Oscar (recortado). */
function resultado(overrides: Partial<ResultadoIngreso> = {}): ResultadoIngreso {
  return {
    aplicado: false,
    totalFilas: 3,
    clientesExistentes: 1,
    clientesCreados: 1,
    aproximados: 1,
    sinCliente: 0,
    paquetesNuevos: 3,
    paquetesActualizados: 0,
    omitidos: 0,
    errores: [],
    filas: [
      { fila: 2, wr: 'WR839943', mg: 'MG002516', fechaIngreso: '2026-08-25', cliente: 'MARIA ELIZABETH GILER', clienteNombreOficial: 'MARIA ELIZABETH GILER', casillero: '(se asignará)', agencia: 'COURIER BOX', contenido: '5 suplementos', pesoLb: 8, tracking: 'EC-22855505', accion: 'creado', paquete: 'nuevo' },
      { fila: 6, wr: 'WR874096', mg: 'MG002516', fechaIngreso: '2026-08-25', cliente: 'ANDREA MALDONADO', clienteNombreOficial: 'Andrea Maldonado', casillero: 'CBX111111', agencia: 'CBOX EXPRESS', contenido: '1 cosmetico', pesoLb: 1, tracking: 'tba333667816882', accion: 'existente', paquete: 'nuevo' },
      { fila: 8, wr: 'WR874259', mg: 'MG002516', fechaIngreso: '2026-08-25', cliente: 'YAMILA PLUA', clienteNombreOficial: 'Yamila Plúa Cedeño', casillero: 'CBX333333', agencia: 'CBOX EXPRESS', contenido: '1 pack alimento', pesoLb: 5.1, tracking: 'tba333739706539', accion: 'aproximado', score: 0.91, coincideCon: 'Yamila Plúa Cedeño', paquete: 'nuevo' },
    ],
    ...overrides,
  }
}

function mountView() {
  return mount(AdminIngresoCargaView, {
    global: {
      stubs: {
        AppFileUpload: AppFileUploadStub,
        AppSkeleton: { template: '<div data-test="skeleton" />' },
        RouterLink: { template: '<a><slot /></a>' },
      },
    },
  })
}

async function elegirArchivo(wrapper: ReturnType<typeof mountView>) {
  const file = new File(['x'], 'INGRESO DE CARGA.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const input = wrapper.get('[data-test="file"]')
  Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
  await input.trigger('change')
  await flushPromises()
  return file
}

describe('AdminIngresoCargaView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.previsualizar.mockResolvedValue(resultado())
    mocks.aplicar.mockResolvedValue(resultado({ aplicado: true }))
  })

  it('elegir el archivo previsualiza sola, sin escribir nada', async () => {
    const wrapper = mountView()
    const file = await elegirArchivo(wrapper)

    expect(mocks.previsualizar).toHaveBeenCalledWith(file)
    expect(mocks.aplicar).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Clientes a crear')
    expect(wrapper.get('[data-test="accion-creado"]').text()).toBe('Se creará')
    expect(wrapper.get('[data-test="accion-existente"]').text()).toBe('Cliente existente')
    expect(wrapper.get('[data-test="accion-aproximado"]').text()).toBe('Parecido 91%')
    expect(wrapper.text()).toContain('con Yamila Plúa Cedeño')
  })

  it('el botón de confirmar dice cuánto va a crear y sólo se habilita con previsualización', async () => {
    const wrapper = mountView()
    expect(wrapper.find('[data-test="confirmar"]').exists()).toBe(false)

    await elegirArchivo(wrapper)

    const boton = wrapper.get('[data-test="confirmar"]')
    expect((boton.element as HTMLButtonElement).disabled).toBe(false)
    expect(wrapper.text()).toContain('se crean 1 clientes y se registran 3 cajas')
  })

  it('confirmar aplica el mismo archivo y muestra el resultado', async () => {
    const wrapper = mountView()
    const file = await elegirArchivo(wrapper)

    await wrapper.get('[data-test="confirmar"]').trigger('click')
    await flushPromises()

    expect(mocks.aplicar).toHaveBeenCalledWith(file)
    expect(wrapper.get('[data-test="banner-aplicado"]').text()).toContain('3 cajas registradas y 1 clientes nuevos')
    expect(wrapper.find('[data-test="confirmar"]').exists()).toBe(false)
    expect(wrapper.get('[data-test="accion-creado"]').text()).toBe('Cliente creado')
    expect(mocks.notify).toHaveBeenCalledWith(expect.stringContaining('Carga ingresada'), 'success')
  })

  it('avisa cuando hay cajas sin cliente y las manda a Homologación', async () => {
    mocks.aplicar.mockResolvedValue(resultado({ aplicado: true, sinCliente: 2 }))
    const wrapper = mountView()
    await elegirArchivo(wrapper)
    await wrapper.get('[data-test="confirmar"]').trigger('click')
    await flushPromises()

    const banner = wrapper.get('[data-test="banner-aplicado"]')
    expect(banner.text()).toContain('2 cajas venían sin nombre de cliente')
    expect(banner.text()).toContain('Homologación')
  })

  it('un archivo equivocado muestra el motivo del backend junto al campo', async () => {
    mocks.previsualizar.mockRejectedValue({ status: 400, message: 'No encontré las columnas "BOX ID" y "CLIENTE"' })
    const wrapper = mountView()
    await elegirArchivo(wrapper)

    expect(wrapper.get('[data-test="error-archivo"]').text()).toContain('BOX ID')
    expect(wrapper.find('[data-test="confirmar"]').exists()).toBe(false)
  })

  it('lista los errores por fila que el backend reporta', async () => {
    mocks.previsualizar.mockResolvedValue(resultado({ errores: ['Fila 9: sin BOX ID (WR); se omitió.'] }))
    const wrapper = mountView()
    await elegirArchivo(wrapper)

    expect(wrapper.get('[data-test="errores"]').text()).toContain('Fila 9: sin BOX ID')
  })
})
