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

const AppConfirmModalStub = {
  props: ['open', 'title', 'message', 'confirmLabel', 'confirmLoading', 'variant'],
  emits: ['cancel', 'confirm'],
  template: `
    <div v-if="open" data-test="confirm-modal">
      <p data-test="confirm-mensaje">{{ message }}</p>
      <button type="button" data-test="confirm-si" @click="$emit('confirm')">{{ confirmLabel }}</button>
      <button type="button" data-test="confirm-no" @click="$emit('cancel')">Cancelar</button>
    </div>
  `,
}

/** El modal real se prueba aparte; aquí sólo importa qué emite. */
const VincularClienteModalStub = {
  props: ['fila'],
  emits: ['close', 'vincular', 'crear'],
  template: `
    <div v-if="fila" data-test="vincular-modal">
      <span data-test="vincular-nombre">{{ fila.cliente }}</span>
      <button type="button" data-test="emitir-vincular" @click="$emit('vincular', { _id: 'm1', nombreOficial: 'MARIA ELIZABETH GILER TORRES', codigoCasillero: 'CBX444444' })">vincular</button>
      <button type="button" data-test="emitir-crear" @click="$emit('crear')">crear</button>
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
    vinculados: 0,
    sinCliente: 0,
    paquetesNuevos: 3,
    paquetesActualizados: 0,
    omitidos: 0,
    errores: [],
    filas: [
      { fila: 2, wr: 'WR839943', mg: 'MG002516', fechaIngreso: '2026-08-25', cliente: 'MARIA ELIZABETH GILER', clienteNombreOficial: 'MARIA ELIZABETH GILER', casillero: '(se asignará)', agencia: 'COURIER BOX', contenido: '5 suplementos', pesoLb: 8, tracking: 'EC-22855505', accion: 'creado', paquete: 'nuevo', sugerencias: [{ masterId: 'm1', nombreOficial: 'MARIA ELIZABETH GILER TORRES', casillero: 'CBX444444', score: 0.78 }] },
      { fila: 6, wr: 'WR874096', mg: 'MG002516', fechaIngreso: '2026-08-25', cliente: 'ANDREA MALDONADO', clienteNombreOficial: 'Andrea Maldonado', casillero: 'CBX111111', agencia: 'CBOX EXPRESS', contenido: '1 cosmetico', pesoLb: 1, tracking: 'tba333667816882', accion: 'existente', paquete: 'nuevo' },
      { fila: 8, wr: 'WR874259', mg: 'MG002516', fechaIngreso: '2026-08-25', cliente: 'YAMILA PLUA', clienteNombreOficial: 'Yamila Plúa Cedeño', casillero: 'CBX333333', agencia: 'CBOX EXPRESS', contenido: '1 pack alimento', pesoLb: 5.1, tracking: 'tba333739706539', accion: 'aproximado', score: 0.91, coincideCon: 'Yamila Plúa Cedeño', paquete: 'nuevo', sugerencias: [{ masterId: 'y1', nombreOficial: 'Yamila Plúa Cedeño', casillero: 'CBX333333', score: 0.91 }] },
    ],
    ...overrides,
  }
}

function mountView() {
  return mount(AdminIngresoCargaView, {
    global: {
      stubs: {
        AppFileUpload: AppFileUploadStub,
        AppConfirmModal: AppConfirmModalStub,
        VincularClienteModal: VincularClienteModalStub,
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

async function confirmar(wrapper: ReturnType<typeof mountView>) {
  await wrapper.get('[data-test="confirmar"]').trigger('click')
  await wrapper.get('[data-test="confirm-si"]').trigger('click')
  await flushPromises()
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

  it('confirmar pide confirmación antes de escribir, con el resumen de lo que va a pasar', async () => {
    const wrapper = mountView()
    expect(wrapper.find('[data-test="confirmar"]').exists()).toBe(false)
    await elegirArchivo(wrapper)

    await wrapper.get('[data-test="confirmar"]').trigger('click')

    expect(mocks.aplicar).not.toHaveBeenCalled()
    expect(wrapper.get('[data-test="confirm-mensaje"]').text()).toContain('Se registran 3 cajas, se crean 1 clientes nuevos')

    await wrapper.get('[data-test="confirm-no"]').trigger('click')
    expect(wrapper.find('[data-test="confirm-modal"]').exists()).toBe(false)
    expect(mocks.aplicar).not.toHaveBeenCalled()
  })

  it('al confirmar aplica el mismo archivo y muestra el resultado', async () => {
    const wrapper = mountView()
    const file = await elegirArchivo(wrapper)

    await confirmar(wrapper)

    expect(mocks.aplicar).toHaveBeenCalledWith(file, {})
    expect(wrapper.get('[data-test="banner-aplicado"]').text()).toContain('3 cajas registradas y 1 clientes nuevos')
    expect(wrapper.find('[data-test="confirmar"]').exists()).toBe(false)
    expect(wrapper.get('[data-test="accion-creado"]').text()).toBe('Cliente creado')
    expect(mocks.notify).toHaveBeenCalledWith(expect.stringContaining('Carga ingresada'), 'success')
  })

  /**
   * El pedido del cliente: cuando no cuadra pero hay un parecido, poder
   * vincularlo a mano desde la pantalla. La decisión se ve al instante y viaja
   * con el archivo al confirmar.
   */
  it('vincular a mano cambia la fila y los contadores al instante, y viaja al confirmar', async () => {
    const wrapper = mountView()
    const file = await elegirArchivo(wrapper)
    expect(wrapper.get('[data-test="stat-crear"]').text()).toBe('1')
    expect(wrapper.get('[data-test="stat-vinculados"]').text()).toBe('0')

    await wrapper.get('[data-test="vincular-WR839943"]').trigger('click')
    expect(wrapper.get('[data-test="vincular-nombre"]').text()).toBe('MARIA ELIZABETH GILER')

    await wrapper.get('[data-test="emitir-vincular"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="vincular-modal"]').exists()).toBe(false)
    const fila = wrapper.get('[data-test="fila-WR839943"]')
    expect(fila.get('[data-test="accion-vinculado"]').text()).toBe('Vinculado a mano')
    expect(fila.text()).toContain('MARIA ELIZABETH GILER TORRES')
    expect(fila.text()).toContain('CBX444444')
    expect(fila.classes()).toContain('is-recien')
    expect(fila.get('[data-test="vincular-WR839943"]').text()).toContain('Cambiar')
    expect(wrapper.get('[data-test="stat-crear"]').text()).toBe('0')
    expect(wrapper.get('[data-test="stat-vinculados"]').text()).toBe('1')

    await confirmar(wrapper)
    expect(mocks.aplicar).toHaveBeenCalledWith(file, { WR839943: { masterClienteId: 'm1' } })
  })

  it('insistir en crear nuevo sobre un parecido también viaja como decisión', async () => {
    const wrapper = mountView()
    const file = await elegirArchivo(wrapper)

    await wrapper.get('[data-test="vincular-WR874259"]').trigger('click')
    await wrapper.get('[data-test="emitir-crear"]').trigger('click')
    await flushPromises()

    const fila = wrapper.get('[data-test="fila-WR874259"]')
    expect(fila.get('[data-test="accion-creado"]').text()).toBe('Se creará')
    expect(wrapper.get('[data-test="stat-crear"]').text()).toBe('2')

    await confirmar(wrapper)
    expect(mocks.aplicar).toHaveBeenCalledWith(file, { WR874259: { crearNuevo: true } })
  })

  it('las filas ya resueltas no ofrecen vincular, y ninguna lo ofrece después de aplicar', async () => {
    const wrapper = mountView()
    await elegirArchivo(wrapper)
    expect(wrapper.find('[data-test="vincular-WR874096"]').exists()).toBe(false)

    await confirmar(wrapper)
    expect(wrapper.find('[data-test="vincular-WR839943"]').exists()).toBe(false)
  })

  it('avisa cuando hay cajas sin cliente y las manda a Homologación', async () => {
    mocks.previsualizar.mockResolvedValue(resultado({ sinCliente: 1, filas: [...resultado().filas, { fila: 9, wr: 'WR900', mg: 'MG002516', fechaIngreso: null, cliente: '', clienteNombreOficial: '', casillero: '', agencia: '', contenido: '', pesoLb: 0, tracking: '', accion: 'sin_cliente', paquete: 'nuevo' }] }))
    mocks.aplicar.mockImplementation(async () => ({ ...(await mocks.previsualizar()), aplicado: true }))
    const wrapper = mountView()
    await elegirArchivo(wrapper)
    await confirmar(wrapper)

    const banner = wrapper.get('[data-test="banner-aplicado"]')
    expect(banner.text()).toContain('1 cajas venían sin nombre de cliente')
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
