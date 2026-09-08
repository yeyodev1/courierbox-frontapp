import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import BodegaFacturacionView from '../BodegaFacturacionView.vue'
import type { FacturaEmitida, PaqueteFacturable, ValidacionFactura } from '@/services/facturacion.api'

const mocks = vi.hoisted(() => ({
  routeQuery: {} as Record<string, string>,
  facturables: vi.fn(),
  validar: vi.fn(),
  completarCliente: vi.fn(),
  generar: vi.fn(),
  sincronizarSri: vi.fn(),
  configuracion: vi.fn(),
  guardarIva: vi.fn(),
  notify: vi.fn(),
  userRole: 'admin',
}))

vi.mock('@/services/facturacion.api', async () => {
  const actual = await vi.importActual<any>('@/services/facturacion.api')
  return {
    ...actual,
    facturacionApi: {
      facturables: mocks.facturables,
      validar: mocks.validar,
      completarCliente: mocks.completarCliente,
      generar: mocks.generar,
      sincronizarSri: mocks.sincronizarSri,
      configuracion: mocks.configuracion,
      guardarIva: mocks.guardarIva,
    },
  }
})
vi.mock('@/stores/auth.store', () => ({ useAuthStore: () => ({ get userRole() { return mocks.userRole } }) }))

vi.mock('@/stores/toast.store', () => ({ useToastStore: () => ({ showNotification: mocks.notify }) }))
vi.mock('vue-router', () => ({ useRoute: () => ({ query: mocks.routeQuery }) }))
vi.mock('@/config/contact', () => ({ WHATSAPP_DISPLAY: '+1 347', whatsappUrl: (t: string) => `https://wa.me/?text=${encodeURIComponent(t)}` }))

const AppConfirmModalStub = {
  props: ['open', 'title', 'message', 'confirmLabel', 'confirmLoading', 'variant'],
  emits: ['cancel', 'confirm'],
  template: `<div v-if="open" data-test="confirm"><p data-test="confirm-msg">{{ message }}</p><button data-test="confirm-si" @click="$emit('confirm')">ok</button></div>`,
}

const cliente = { _id: 'c1', nombreOficial: 'Diego Reyes', cedulaRuc: '', email: '', telefono: '099', direccion: '', codigoCasillero: 'CBX9' }
const paquete: PaqueteFacturable = { _id: 'p1', wr: 'WR1', sh: '', trackingOriginal: '', contenido: 'ropa', pesoLb: 10, consigneeNombre: 'Diego', consigneeLimpio: 'Diego', estado: 'validado', masterClienteId: cliente }

function validacion(overrides: Partial<ValidacionFactura> = {}): ValidacionFactura {
  return {
    cliente: { id: 'c1', nombreOficial: 'Diego Reyes', cedulaRuc: '', email: '', telefono: '099', direccion: '', codigoCasillero: 'CBX9' },
    totales: { pesoTotalLb: 10, totalFlete: 65, totalArancel: 19.9, subtotal: 84.9, totalIva: 9.75, totalGeneral: 94.65 },
    faltantes: [
      { campo: 'cedulaRuc', requerido: true, mensaje: 'Sin cédula o RUC. El SRI no admite consumidor final por más de $50.' },
      { campo: 'email', requerido: false, mensaje: 'Sin correo: la factura no le llegará por email.' },
    ],
    consumidorFinalPosible: false,
    listo: false,
    yaFacturados: [],
    ...overrides,
  }
}

const emitida: FacturaEmitida = {
  facturaId: 'f1', numeroFactura: '001-001-000000889', estadoSri: 'enviado', autorizacionSri: '', pdfUrl: 'https://x/ride.pdf', xmlUrl: '', mensajeSri: 'Enviado SRI', totalGeneral: 94.65, clienteNombre: 'Diego Reyes',
}

function mountView() {
  return mount(BodegaFacturacionView, {
    global: { stubs: { AppConfirmModal: AppConfirmModalStub, AppSkeleton: true } },
  })
}

async function buscarYSeleccionar(wrapper: ReturnType<typeof mountView>) {
  await wrapper.get('input[type="search"]').setValue('diego')
  vi.advanceTimersByTime(400)
  await flushPromises()
  await wrapper.get('input[type="checkbox"]').setValue(true)
  vi.advanceTimersByTime(300)
  await flushPromises()
}

describe('BodegaFacturacionView — datos faltantes y SRI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mocks.routeQuery = {}
    mocks.userRole = 'admin'
    mocks.configuracion.mockResolvedValue({ ivaPorcentaje: 15, ivaOpciones: [0, 5, 8, 12, 15], tarifas: { fleteLb: 6.5, arancelLb: 1.99, iva: 0.15, ivaPorcentaje: 15 } })
    mocks.facturables.mockResolvedValue({ paquetes: [paquete], tarifas: { fleteLb: 6.5, arancelLb: 1.99, iva: 0.15, ivaPorcentaje: 15 } })
    mocks.validar.mockResolvedValue(validacion())
    mocks.generar.mockResolvedValue({ message: 'ok', facturaId: 'f1', factura: emitida })
  })

  /** Llegando desde Ingreso de carga con «Facturar»: el cliente ya buscado y la caja marcada. */
  it('con ?q y ?sel busca solo y deja la caja marcada', async () => {
    mocks.routeQuery = { q: 'CBX9', sel: 'WR1' }
    const wrapper = mountView()
    // El watcher de la búsqueda corre en el siguiente tick; recién ahí arma el debounce.
    await flushPromises()
    vi.advanceTimersByTime(400)
    await flushPromises()
    vi.advanceTimersByTime(300)
    await flushPromises()

    expect(mocks.facturables).toHaveBeenCalledWith('CBX9')
    expect((wrapper.get('input[type="checkbox"]').element as HTMLInputElement).checked).toBe(true)
    expect(mocks.validar).toHaveBeenCalledWith(['p1'])
    expect(wrapper.find('[data-test="datos-faltantes"]').exists()).toBe(true)
  })

  /** El pedido: IVA global, 15 % por defecto, elegible, y que los totales se recalculen solos. */
  it('el IVA global arranca en 15 %, se cambia desde la pantalla y recalcula el total', async () => {
    mocks.guardarIva.mockResolvedValue({ ivaPorcentaje: 0, tarifas: { fleteLb: 6.5, arancelLb: 1.99, iva: 0, ivaPorcentaje: 0 } })
    const wrapper = mountView()
    await flushPromises()
    await buscarYSeleccionar(wrapper)

    expect((wrapper.get('[data-test="iva-select"]').element as HTMLSelectElement).value).toBe('15')
    expect(wrapper.text()).toContain('$94.65')

    await wrapper.get('[data-test="iva-select"]').setValue('0')
    await flushPromises()

    expect(mocks.guardarIva).toHaveBeenCalledWith(0)
    expect(wrapper.text()).toContain('IVA 0 %')
    expect(wrapper.text()).toContain('$84.90')
    expect(mocks.notify).toHaveBeenCalledWith(expect.stringContaining('IVA del flete: 0 %'), 'success')
  })

  it('el rol bodega ve el IVA vigente pero no lo cambia', async () => {
    mocks.userRole = 'bodega'
    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.find('[data-test="iva-select"]').exists()).toBe(false)
    expect(wrapper.get('[data-test="iva-valor"]').text()).toBe('15 %')
  })

  it('al entrar lista lo pendiente de facturar sin escribir nada', async () => {
    const wrapper = mountView()
    await flushPromises()

    expect(mocks.facturables).toHaveBeenCalledWith('')
    expect(wrapper.text()).toContain('1 paquete(s) por facturar · los más recientes')
    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(true)
  })

  it('al elegir paquetes revisa al cliente; con datos faltantes el botón dice qué falta y abre el formulario', async () => {
    const wrapper = mountView()
    await buscarYSeleccionar(wrapper)

    expect(mocks.validar).toHaveBeenCalledWith(['p1'])
    const boton = wrapper.get('[data-test="emitir"]')
    expect(boton.text()).toContain('Completar datos y emitir')
    expect((boton.element as HTMLButtonElement).disabled).toBe(false)
    expect(wrapper.get('[data-test="motivo-bloqueo"]').text()).toContain('Sin cédula o RUC')
    expect(wrapper.find('[data-test="completar-modal"]').exists()).toBe(false)

    await boton.trigger('click')

    const modal = wrapper.get('[data-test="completar-modal"]')
    expect(modal.text()).toContain('Datos de Diego Reyes')
    expect(modal.get('[data-test="faltante-cedulaRuc"]').text()).toContain('Sin cédula o RUC')
    expect((modal.get('[data-test="continuar-emitir"]').element as HTMLButtonElement).disabled).toBe(true)
    // Por más de $50 no se ofrece consumidor final.
    expect(modal.find('[data-test="consumidor-final"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="confirm"]').exists()).toBe(false)
  })

  /** El pedido del cliente: completar y guardar desde ahí mismo, y seguir a emitir. */
  it('guardar la cédula desde el formulario la deja en el cliente y pasa solo a la confirmación', async () => {
    mocks.completarCliente.mockResolvedValue({ ...validacion().cliente, cedulaRuc: '0954227641' })
    const wrapper = mountView()
    await buscarYSeleccionar(wrapper)
    await wrapper.get('[data-test="emitir"]').trigger('click')

    mocks.validar.mockResolvedValue(validacion({ cliente: { ...validacion().cliente, cedulaRuc: '0954227641' }, faltantes: [{ campo: 'email', requerido: false, mensaje: 'Sin correo: la factura no le llegará por email.' }], listo: true }))
    const modal = wrapper.get('[data-test="completar-modal"]')
    await modal.get('[data-test="input-cedulaRuc"]').setValue('0954227641')
    await modal.get('[data-test="guardar-cliente"]').trigger('submit')
    await flushPromises()

    expect(mocks.completarCliente).toHaveBeenCalledWith('c1', { cedulaRuc: '0954227641' })
    expect(mocks.validar).toHaveBeenCalledTimes(2)
    expect(wrapper.find('[data-test="completar-modal"]').exists()).toBe(false)
    expect(wrapper.get('[data-test="confirm-msg"]').text()).toContain('a nombre de Diego Reyes')

    await wrapper.get('[data-test="confirm-si"]').trigger('click')
    await flushPromises()
    expect(mocks.generar).toHaveBeenCalledWith(['p1'], { consumidorFinal: false })
  })

  it('hasta $50 sin cédula ofrece consumidor final y con eso deja emitir', async () => {
    mocks.facturables.mockResolvedValue({ paquetes: [{ ...paquete, pesoLb: 2 }], tarifas: { fleteLb: 6.5, arancelLb: 1.99, iva: 0.15 } })
    mocks.validar.mockResolvedValue(validacion({ consumidorFinalPosible: true, totales: { pesoTotalLb: 2, totalFlete: 13, totalArancel: 3.98, subtotal: 16.98, totalIva: 1.95, totalGeneral: 18.93 } }))
    const wrapper = mountView()
    await buscarYSeleccionar(wrapper)

    await wrapper.get('[data-test="emitir"]').trigger('click')
    const modal = wrapper.get('[data-test="completar-modal"]')
    expect((modal.get('[data-test="continuar-emitir"]').element as HTMLButtonElement).disabled).toBe(true)
    await modal.get('[data-test="consumidor-final"] input').setValue(true)

    expect((modal.get('[data-test="continuar-emitir"]').element as HTMLButtonElement).disabled).toBe(false)
    await modal.get('[data-test="continuar-emitir"]').trigger('click')
    expect(wrapper.get('[data-test="confirm-msg"]').text()).toContain('a nombre de Consumidor Final')
    await wrapper.get('[data-test="confirm-si"]').trigger('click')
    await flushPromises()

    expect(mocks.generar).toHaveBeenCalledWith(['p1'], { consumidorFinal: true })
  })

  it('tras emitir muestra el estado del SRI, el RIDE, y permite volver a consultar', async () => {
    mocks.validar.mockResolvedValue(validacion({ cliente: { ...validacion().cliente, cedulaRuc: '0954227641' }, faltantes: [], listo: true }))
    mocks.sincronizarSri.mockResolvedValue({ ...emitida, estadoSri: 'autorizado', autorizacionSri: '0709202601099338854900120010010000008891234567890' })
    const wrapper = mountView()
    await buscarYSeleccionar(wrapper)

    await wrapper.get('[data-test="emitir"]').trigger('click')
    await wrapper.get('[data-test="confirm-si"]').trigger('click')
    await flushPromises()

    expect(mocks.generar).toHaveBeenCalledWith(['p1'], { consumidorFinal: false })
    const recibo = wrapper.get('[data-test="recibo"]')
    expect(recibo.text()).toContain('001-001-000000889')
    expect(recibo.get('[data-test="sri-estado"]').text()).toContain('Enviada al SRI')
    expect(recibo.find('a[href="https://x/ride.pdf"]').exists()).toBe(true)

    await recibo.get('[data-test="actualizar-sri"]').trigger('click')
    await flushPromises()

    expect(mocks.sincronizarSri).toHaveBeenCalledWith('f1')
    expect(wrapper.get('[data-test="sri-estado"]').text()).toContain('Autorizada por el SRI')
    expect(wrapper.get('[data-test="recibo"]').text()).toContain('Autorización 0709202601099338854900120010010000008891234567890')
    expect(wrapper.find('[data-test="actualizar-sri"]').exists()).toBe(false)
  })

  it('si Contifico rechaza, el error llega al counter tal cual', async () => {
    mocks.validar.mockResolvedValue(validacion({ cliente: { ...validacion().cliente, cedulaRuc: '0954227641' }, faltantes: [], listo: true }))
    mocks.generar.mockRejectedValue({ status: 502, message: 'Contifico rechazó la factura: cliente: cedula inválida' })
    const wrapper = mountView()
    await buscarYSeleccionar(wrapper)

    await wrapper.get('[data-test="emitir"]').trigger('click')
    await wrapper.get('[data-test="confirm-si"]').trigger('click')
    await flushPromises()

    expect(mocks.notify).toHaveBeenCalledWith(expect.stringContaining('cedula inválida'), 'error')
    expect(wrapper.find('[data-test="recibo"]').exists()).toBe(false)
  })
})
