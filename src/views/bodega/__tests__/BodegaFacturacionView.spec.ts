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
  historial: vi.fn(),
  detalle: vi.fn(),
  perfiles: vi.fn(),
  guardarPerfil: vi.fn(),
  eliminarPerfil: vi.fn(),
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
      historial: mocks.historial,
      detalle: mocks.detalle,
      perfiles: mocks.perfiles,
      guardarPerfil: mocks.guardarPerfil,
      eliminarPerfil: mocks.eliminarPerfil,
    },
  }
})
vi.mock('@/stores/auth.store', () => ({ useAuthStore: () => ({ get userRole() { return mocks.userRole } }) }))

vi.mock('@/stores/toast.store', () => ({ useToastStore: () => ({ showNotification: mocks.notify }) }))
vi.mock('vue-router', () => ({ useRoute: () => ({ query: mocks.routeQuery }) }))
vi.mock('@/config/contact', () => ({ WHATSAPP_DISPLAY: '+1 347', whatsappUrl: (t: string) => `https://wa.me/?text=${encodeURIComponent(t)}` }))

const AppSelectStub = {
  props: ['modelValue', 'options', 'label', 'disabled'],
  emits: ['update:modelValue'],
  template: `<select :value="modelValue" :disabled="disabled" @change="$emit('update:modelValue', $event.target.value)"><option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option></select>`,
}

const AppConfirmModalStub = {
  props: ['open', 'title', 'message', 'confirmLabel', 'confirmLoading', 'variant'],
  emits: ['cancel', 'confirm'],
  template: `<div v-if="open" data-test="confirm"><p data-test="confirm-msg">{{ message }}</p><button data-test="confirm-si" @click="$emit('confirm')">ok</button></div>`,
}

const cliente = { _id: 'c1', nombreOficial: 'Diego Reyes', cedulaRuc: '', email: '', telefono: '099', direccion: '', codigoCasillero: 'CBX9' }
const paquete: PaqueteFacturable = { _id: 'p1', wr: 'WR1', sh: '', trackingOriginal: '', contenido: 'ropa', pesoLb: 10, consigneeNombre: 'Diego', consigneeLimpio: 'Diego', estado: 'validado', masterClienteId: cliente }

const perfilPrincipal = { id: 'principal', etiqueta: 'Datos del cliente', razonSocial: 'Diego Reyes', identificacion: '', email: '', telefono: '099', direccion: '', principal: true }
const perfilEmpresa = { id: 'p2', etiqueta: 'Mi empresa', razonSocial: 'Courier Box S.A.S.', identificacion: '0993388549001', email: 'f@cb.com', telefono: '', direccion: 'Gye', principal: false }

function validacion(overrides: Partial<ValidacionFactura> = {}): ValidacionFactura {
  return {
    cliente: { id: 'c1', nombreOficial: 'Diego Reyes', cedulaRuc: '', email: '', telefono: '099', direccion: '', codigoCasillero: 'CBX9' },
    perfilId: 'principal',
    perfiles: [perfilPrincipal, perfilEmpresa],
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
    global: { stubs: { AppConfirmModal: AppConfirmModalStub, AppSelect: AppSelectStub, AppSkeleton: true } },
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
    mocks.historial.mockResolvedValue([])
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
    expect(mocks.validar).toHaveBeenCalledWith(['p1'], 'principal')
    expect(wrapper.get('[data-test="emitir"]').text()).toContain('Completar datos y emitir')
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

  it('cada caja por facturar se abre con sus detalles y se factura desde ahí', async () => {
    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('[data-test="detalle-p1"]').trigger('click')
    const d = wrapper.get('[data-test="paquete-detalle"]')
    expect(d.text()).toContain('WR1')
    expect(d.text()).toContain('Diego Reyes')
    expect(d.text()).toContain('Sin cédula (se pide al facturar)')

    await d.get('[data-test="facturar-esta"]').trigger('click')
    vi.advanceTimersByTime(300)
    await flushPromises()
    expect(wrapper.find('[data-test="paquete-detalle"]').exists()).toBe(false)
    expect((wrapper.get('input[type="checkbox"]').element as HTMLInputElement).checked).toBe(true)
    expect(mocks.validar).toHaveBeenCalledWith(['p1'], 'principal')
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

    expect(mocks.validar).toHaveBeenCalledWith(['p1'], 'principal')
    const boton = wrapper.get('[data-test="emitir"]')
    expect(boton.text()).toContain('Completar datos y emitir')
    expect((boton.element as HTMLButtonElement).disabled).toBe(false)
    expect(wrapper.get('[data-test="motivo-bloqueo"]').text()).toContain('Sin cédula o RUC')
    expect(wrapper.find('[data-test="completar-modal"]').exists()).toBe(false)

    await boton.trigger('click')

    const modal = wrapper.get('[data-test="completar-modal"]')
    expect(modal.text()).toContain('¿A nombre de quién sale la factura?')
    expect(modal.get('[data-test="perfil-principal"]').classes()).toContain('selected')
    expect(modal.get('[data-test="faltante-cedulaRuc"]').text()).toContain('Sin cédula o RUC')
    expect((modal.get('[data-test="continuar-emitir"]').element as HTMLButtonElement).disabled).toBe(true)
    // Por más de $50 no se ofrece consumidor final.
    expect(modal.find('[data-test="consumidor-final"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="confirm"]').exists()).toBe(false)
  })

  /** El pedido del cliente: completar y guardar desde ahí mismo, y seguir a emitir. */
  it('guardar la cédula desde el formulario la deja en el cliente y pasa solo a la confirmación', async () => {
    mocks.guardarPerfil.mockResolvedValue({ perfil: { ...perfilPrincipal, identificacion: '0954227641' }, perfiles: [{ ...perfilPrincipal, identificacion: '0954227641' }, perfilEmpresa] })
    const wrapper = mountView()
    await buscarYSeleccionar(wrapper)
    await wrapper.get('[data-test="emitir"]').trigger('click')

    mocks.validar.mockResolvedValue(validacion({ cliente: { ...validacion().cliente, cedulaRuc: '0954227641' }, faltantes: [{ campo: 'email', requerido: false, mensaje: 'Sin correo: la factura no le llegará por email.' }], listo: true }))
    const modal = wrapper.get('[data-test="completar-modal"]')
    await modal.get('[data-test="input-cedulaRuc"]').setValue('0954227641')
    await modal.get('[data-test="guardar-cliente"]').trigger('submit')
    await flushPromises()

    expect(mocks.guardarPerfil).toHaveBeenCalledWith('c1', 'principal', expect.objectContaining({ identificacion: '0954227641', razonSocial: 'Diego Reyes' }))
    expect(mocks.validar).toHaveBeenCalledTimes(2)
    expect(wrapper.find('[data-test="completar-modal"]').exists()).toBe(false)
    expect(wrapper.get('[data-test="confirm-msg"]').text()).toContain('a nombre de Diego Reyes')

    await wrapper.get('[data-test="confirm-si"]').trigger('click')
    await flushPromises()
    expect(mocks.generar).toHaveBeenCalledWith(['p1'], { consumidorFinal: false, perfilId: 'principal' })
  })

  /** El pedido: elegir a nombre de quién sale (p. ej. la empresa del cliente) y agregar otros datos. */
  it('se puede facturar a un perfil alterno del cliente y agregar uno nuevo', async () => {
    mocks.validar.mockImplementation(async (_ids: string[], perfilId?: string) =>
      perfilId === 'p2'
        ? validacion({ perfilId: 'p2', cliente: { ...validacion().cliente, nombreOficial: 'Courier Box S.A.S.', cedulaRuc: '0993388549001', email: 'f@cb.com' }, faltantes: [], listo: true })
        : validacion(),
    )
    const wrapper = mountView()
    await buscarYSeleccionar(wrapper)

    await wrapper.get('[data-test="datos-facturacion"]').trigger('click')
    await wrapper.get('[data-test="perfil-p2"]').trigger('click')
    await flushPromises()

    expect(mocks.validar).toHaveBeenLastCalledWith(['p1'], 'p2')
    expect(wrapper.text()).toContain('Courier Box S.A.S.')
    expect((wrapper.get('[data-test="continuar-emitir"]').element as HTMLButtonElement).disabled).toBe(false)

    await wrapper.get('[data-test="continuar-emitir"]').trigger('click')
    expect(wrapper.get('[data-test="confirm-msg"]').text()).toContain('a nombre de Courier Box S.A.S.')
    await wrapper.get('[data-test="confirm-si"]').trigger('click')
    await flushPromises()
    expect(mocks.generar).toHaveBeenCalledWith(['p1'], { consumidorFinal: false, perfilId: 'p2' })
  })

  it('agregar otros datos de facturación los crea y los deja elegidos', async () => {
    const nuevo = { id: 'p3', etiqueta: 'Mi mamá', razonSocial: 'Rosa Lema', identificacion: '1710034065', email: '', telefono: '', direccion: '', principal: false }
    mocks.guardarPerfil.mockResolvedValue({ perfil: nuevo, perfiles: [perfilPrincipal, perfilEmpresa, nuevo] })
    const wrapper = mountView()
    await buscarYSeleccionar(wrapper)
    await wrapper.get('[data-test="datos-facturacion"]').trigger('click')
    await wrapper.get('[data-test="perfil-nuevo"]').trigger('click')

    const modal = wrapper.get('[data-test="completar-modal"]')
    await modal.get('[data-test="input-etiqueta"]').setValue('Mi mamá')
    await modal.get('[data-test="input-nombreOficial"]').setValue('Rosa Lema')
    await modal.get('[data-test="input-cedulaRuc"]').setValue('1710034065')
    await modal.get('[data-test="guardar-cliente"]').trigger('submit')
    await flushPromises()

    expect(mocks.guardarPerfil).toHaveBeenCalledWith('c1', null, expect.objectContaining({ etiqueta: 'Mi mamá', razonSocial: 'Rosa Lema', identificacion: '1710034065' }))
    expect(mocks.validar).toHaveBeenLastCalledWith(['p1'], 'p3')
  })

  it('muestra las facturas emitidas con su estado SRI y sus cajas', async () => {
    mocks.historial.mockResolvedValue([{ _id: 'f9', numeroFactura: '001-001-000000889', estadoSri: 'autorizado', autorizacionSri: '', mensajeSri: '', pdfUrl: 'https://x/r.pdf', xmlUrl: '', totalGeneral: 14.67, pesoTotalLb: 1.55, estado: 'pendiente', facturadoA: { perfilId: 'principal', identificacion: '9999999999999', razonSocial: 'Consumidor Final', email: '' }, masterClienteId: { _id: 'c1', nombreOficial: 'Lady Vera', codigoCasillero: 'CBX237935' }, paquetes: [{ _id: 'p1', wr: 'WR875181', sh: '', contenido: '', pesoLb: 1.55 }], createdAt: '2026-09-08T03:00:00.000Z' }])
    const wrapper = mountView()
    await flushPromises()

    // Está en su pestaña, con el conteo, y se filtra por estado.
    expect(wrapper.get('[data-test="tab-facturadas"]').text()).toContain('1')
    await wrapper.get('[data-test="tab-facturadas"]').trigger('click')
    const h = wrapper.get('[data-test="historial"]')
    expect(wrapper.get('[data-test="chip-autorizadas"]').text()).toContain('1')
    await wrapper.get('[data-test="chip-rechazadas"]').trigger('click')
    expect(h.text()).toContain('Ninguna factura con ese estado')
    await wrapper.get('[data-test="chip-todas"]').trigger('click')
    expect(h.text()).toContain('001-001-000000889')

    // Abrir la factura muestra todo: a nombre de quién, cajas, desglose, SRI, pago.
    mocks.detalle.mockResolvedValue({ _id: 'f9', numeroFactura: '001-001-000000889', estadoSri: 'autorizado', autorizacionSri: '0709…', mensajeSri: '', pdfUrl: 'https://x/r.pdf', xmlUrl: '', totalGeneral: 14.67, pesoTotalLb: 1.55, totalFlete: 10.08, totalArancel: 3.08, iva: 1.51, estado: 'pendiente', referenciaPago: '', comprobanteUrl: '', contificoId: 'c', facturadoA: { perfilId: 'principal', identificacion: '9999999999999', razonSocial: 'Consumidor Final', email: '' }, masterClienteId: { _id: 'c1', nombreOficial: 'Lady Vera', codigoCasillero: 'CBX237935' }, paquetes: [{ ...paquete, wr: 'WR875181', pesoLb: 1.55 }], createdAt: '2026-09-08T03:00:00.000Z' })
    await wrapper.get('[data-test="abrir-f9"]').trigger('click')
    await flushPromises()
    const d = wrapper.get('[data-test="factura-detalle"]')
    expect(d.text()).toContain('Consumidor Final')
    expect(d.text()).toContain('WR875181')
    expect(d.text()).toContain('$10.08')
    expect(d.text()).toContain('Pendiente de pago')
    expect(d.find('[data-test="detalle-pdf"]').exists()).toBe(true)
    expect(h.text()).toContain('WR875181')
    expect(h.text()).toContain('Consumidor Final')
    expect(h.text()).toContain('Autorizada por el SRI')
    expect(h.find('a[href="https://x/r.pdf"]').exists()).toBe(true)
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

    expect(mocks.generar).toHaveBeenCalledWith(['p1'], { consumidorFinal: true, perfilId: 'principal' })
  })

  it('tras emitir muestra el estado del SRI, el RIDE, y permite volver a consultar', async () => {
    mocks.validar.mockResolvedValue(validacion({ cliente: { ...validacion().cliente, cedulaRuc: '0954227641' }, faltantes: [], listo: true }))
    mocks.sincronizarSri.mockResolvedValue({ ...emitida, estadoSri: 'autorizado', autorizacionSri: '0709202601099338854900120010010000008891234567890' })
    const wrapper = mountView()
    await buscarYSeleccionar(wrapper)

    await wrapper.get('[data-test="emitir"]').trigger('click')
    await wrapper.get('[data-test="confirm-si"]').trigger('click')
    await flushPromises()

    expect(mocks.generar).toHaveBeenCalledWith(['p1'], { consumidorFinal: false, perfilId: 'principal' })
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
