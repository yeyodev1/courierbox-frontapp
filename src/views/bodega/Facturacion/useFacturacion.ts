import { computed, ref, watch } from 'vue'
import {
  calcularTotalesLocal,
  facturacionApi,
  type ClienteFacturable,
  type DatoFaltante,
  type DatosPerfil,
  type EstadoSri,
  type FacturaDetalle,
  type FacturaEmitida,
  type FacturaHistorial,
  type PerfilFacturacion,
  type PaqueteFacturable,
  type Tarifas,
  type TotalesFactura,
  type ValidacionFactura,
} from '@/services/facturacion.api'
import { useToastStore } from '@/stores/toast.store'

/** Valor centinela de `perfilId` mientras el counter escribe un perfil nuevo. */
export const NUEVO_PERFIL = '__nuevo__'

export function money(value: number) {
  return `$${(Number(value) || 0).toFixed(2)}`
}

/** Cómo se lee cada estado del SRI en pantalla. */
export const SRI_UI: Record<EstadoSri, { label: string; tono: 'ok' | 'proceso' | 'error' | 'neutro' }> = {
  autorizado: { label: 'Autorizada por el SRI', tono: 'ok' },
  enviado: { label: 'Enviada al SRI, esperando autorización', tono: 'proceso' },
  firmado: { label: 'Firmada, pendiente de envío', tono: 'proceso' },
  sin_enviar: { label: 'Registrada, sin enviar al SRI', tono: 'proceso' },
  rechazado: { label: 'Rechazada por el SRI', tono: 'error' },
  error: { label: 'No se pudo consultar el SRI', tono: 'error' },
  simulado: { label: 'Simulada: Contifico no está configurado', tono: 'neutro' },
}

export type FormularioCliente = Pick<ClienteFacturable, 'nombreOficial' | 'cedulaRuc' | 'email' | 'telefono' | 'direccion'>

/**
 * Counter invoicing. Search a client's packages, tick what goes on the invoice,
 * see the total build up, complete whatever the client is missing, and emit the
 * electronic invoice through Contifico — then watch it get authorized by SRI.
 */
export function useFacturacion() {
  const toast = useToastStore()

  const query = ref('')
  const searching = ref(false)
  const searched = ref(false)
  const paquetes = ref<PaqueteFacturable[]>([])
  const tarifas = ref<Tarifas>({ fleteLb: 0, arancelLb: 0, iva: 0.15, ivaPorcentaje: 15 })
  const ivaOpciones = ref<number[]>([0, 5, 8, 12, 15])
  const guardandoIva = ref(false)
  const selectedIds = ref<Set<string>>(new Set())

  const emitting = ref(false)
  const lastFactura = ref<FacturaEmitida | null>(null)
  const sincronizando = ref(false)

  /** Lo que el servidor dice del cliente elegido: datos, totales y qué falta. */
  const validacion = ref<ValidacionFactura | null>(null)
  const validando = ref(false)
  const guardandoCliente = ref(false)
  const consumidorFinal = ref(false)

  /** A quién se factura: 'principal' (los datos del cliente), un perfil alterno, o NUEVO_PERFIL mientras se crea uno. */
  const perfilId = ref('principal')
  const perfiles = ref<PerfilFacturacion[]>([])

  /** Facturas ya emitidas, para que el counter vea número, estado SRI y PDF sin salir. */
  const facturas = ref<FacturaHistorial[]>([])
  const cargandoHistorial = ref(false)
  const filtroHistorial = ref('')
  const sincronizandoId = ref<string | null>(null)
  /** La factura abierta en detalle y la caja abierta en detalle. */
  const facturaAbierta = ref<FacturaDetalle | null>(null)
  const cargandoDetalle = ref(false)
  const paqueteAbierto = ref<PaqueteFacturable | null>(null)

  async function abrirFactura(facturaId: string) {
    cargandoDetalle.value = true
    facturaAbierta.value = null
    try {
      facturaAbierta.value = await facturacionApi.detalle(facturaId)
    } catch (error) {
      fail(error, 'No se pudo abrir la factura')
    } finally {
      cargandoDetalle.value = false
    }
  }

  /** Qué se ve: las cajas por facturar o las facturas ya emitidas. */
  const vista = ref<'pendientes' | 'facturadas'>('pendientes')
  /** Filtro por estado en el SRI dentro de «Facturadas». */
  const filtroSri = ref<'todas' | 'autorizadas' | 'proceso' | 'rechazadas'>('todas')

  const facturasFiltradas = computed(() => {
    const f = filtroSri.value
    if (f === 'todas') return facturas.value
    return facturas.value.filter((x) => {
      const t = SRI_UI[x.estadoSri]?.tono
      if (f === 'autorizadas') return x.estadoSri === 'autorizado'
      if (f === 'rechazadas') return t === 'error'
      return t === 'proceso'
    })
  })
  const conteoSri = computed(() => ({
    todas: facturas.value.length,
    autorizadas: facturas.value.filter((x) => x.estadoSri === 'autorizado').length,
    proceso: facturas.value.filter((x) => SRI_UI[x.estadoSri]?.tono === 'proceso').length,
    rechazadas: facturas.value.filter((x) => SRI_UI[x.estadoSri]?.tono === 'error').length,
  }))

  const seleccionados = computed(() => paquetes.value.filter((p) => selectedIds.value.has(p._id)))

  const cliente = computed(() => {
    const v = validacion.value?.cliente
    const master = seleccionados.value[0]?.masterClienteId
    return {
      id: v?.id || master?._id,
      nombre: v?.nombreOficial || master?.nombreOficial || seleccionados.value[0]?.consigneeLimpio || '',
      identificacion: v?.cedulaRuc ?? master?.cedulaRuc ?? '',
      email: v?.email ?? master?.email ?? '',
      telefono: v?.telefono ?? master?.telefono ?? '',
      direccion: v?.direccion ?? master?.direccion ?? '',
      casillero: v?.codigoCasillero || master?.codigoCasillero || '',
    }
  })

  /** One invoice belongs to one client — the API rejects a mixed selection too. */
  const clientesDistintos = computed(
    () => new Set(seleccionados.value.map((p) => p.masterClienteId?._id ?? '')).size > 1,
  )

  /** El IVA vigente en porcentaje, para mostrarlo y elegirlo. */
  const ivaPorcentaje = computed(() => tarifas.value.ivaPorcentaje ?? Math.round(tarifas.value.iva * 100))

  const totales = computed<TotalesFactura>(() =>
    calcularTotalesLocal(
      seleccionados.value.map((p) => Number(p.pesoLb) || 0),
      tarifas.value,
    ),
  )

  const faltantes = computed<DatoFaltante[]>(() => validacion.value?.faltantes ?? [])
  const faltantesRequeridos = computed(() =>
    faltantes.value.filter((f) => f.requerido && !(consumidorFinal.value && f.campo === 'cedulaRuc')),
  )
  const consumidorFinalPosible = computed(() => Boolean(validacion.value?.consumidorFinalPosible))
  const sinIdentificacion = computed(() => !cliente.value.identificacion.replace(/\D+/g, ''))

  const puedeFacturar = computed(
    () =>
      seleccionados.value.length > 0 &&
      !clientesDistintos.value &&
      Boolean(cliente.value.id) &&
      !validando.value &&
      !!validacion.value &&
      faltantesRequeridos.value.length === 0 &&
      (validacion.value?.yaFacturados.length ?? 0) === 0,
  )

  /** WR que deben quedar marcados en cuanto lleguen los resultados (viene de Ingreso de carga). */
  let preseleccion: Set<string> | null = null

  /** Arranca con una búsqueda y, si viene, con cajas ya marcadas. */
  function iniciarDesde(params: { q?: string; sel?: string }) {
    const wrs = String(params.sel ?? '').split(',').map((s) => s.trim().toUpperCase()).filter(Boolean)
    preseleccion = wrs.length ? new Set(wrs) : null
    if (params.q) query.value = String(params.q)
  }

  let timer: number | undefined

  // Con la caja de búsqueda vacía se lista lo pendiente de facturar; con dos
  // letras o más, se filtra. Así el counter ve las cajas sin saber qué escribir.
  watch(query, (value) => {
    window.clearTimeout(timer)
    if (value.trim().length === 1) return
    timer = window.setTimeout(buscar, 350)
  })

  // Cada cambio en la selección vuelve a preguntar al servidor qué falta, con
  // un pequeño respiro para no disparar una consulta por cada clic seguido.
  let validarTimer: number | undefined
  watch(seleccionados, (sel) => {
    window.clearTimeout(validarTimer)
    consumidorFinal.value = false
    if (!sel.length || clientesDistintos.value) {
      validacion.value = null
      return
    }
    validarTimer = window.setTimeout(validar, 250)
  })

  function fail(error: unknown, fallback: string) {
    const e = error as { data?: { error?: string }; message?: string }
    toast.showNotification(e?.data?.error || e?.message || fallback, 'error')
  }

  async function cargarConfiguracion() {
    try {
      const c = await facturacionApi.configuracion()
      tarifas.value = c.tarifas
      ivaOpciones.value = c.ivaOpciones
    } catch {
      // Las tarifas también llegan con cada búsqueda; no vale la pena molestar.
    }
  }

  /** Cambia el IVA para todos. Los totales en pantalla se recalculan solos. */
  async function cambiarIva(pct: number): Promise<boolean> {
    guardandoIva.value = true
    try {
      const r = await facturacionApi.guardarIva(pct)
      tarifas.value = r.tarifas
      toast.showNotification(`IVA del flete: ${r.ivaPorcentaje} %. Aplica a todas las facturas desde ahora.`, 'success')
      if (seleccionados.value.length) await validar()
      return true
    } catch (error) {
      fail(error, 'No se pudo cambiar el IVA')
      return false
    } finally {
      guardandoIva.value = false
    }
  }

  async function buscar() {
    searching.value = true
    try {
      const data = await facturacionApi.facturables(query.value.trim())
      paquetes.value = data.paquetes
      tarifas.value = data.tarifas
      searched.value = true
      if (preseleccion) {
        const ids = data.paquetes.filter((p) => preseleccion!.has(String(p.wr ?? '').toUpperCase())).map((p) => p._id)
        if (ids.length) selectedIds.value = new Set(ids)
        preseleccion = null
      }
    } catch (error) {
      fail(error, 'No se pudo buscar paquetes')
    } finally {
      searching.value = false
    }
  }

  async function validar() {
    if (!seleccionados.value.length) return
    validando.value = true
    try {
      const creando = perfilId.value === NUEVO_PERFIL
      validacion.value = await facturacionApi.validar(seleccionados.value.map((p) => p._id), creando ? 'principal' : perfilId.value)
      perfiles.value = validacion.value.perfiles
      if (!creando) perfilId.value = validacion.value.perfilId
    } catch (error) {
      validacion.value = null
      fail(error, 'No se pudo revisar los datos del cliente')
    } finally {
      validando.value = false
    }
  }

  /** Guarda lo que el counter completó (en el perfil elegido) y vuelve a validar con eso. */
  async function completarCliente(datos: Partial<FormularioCliente>): Promise<boolean> {
    if (perfilId.value !== 'principal' && perfilId.value !== NUEVO_PERFIL) {
      const actual = perfiles.value.find((p) => p.id === perfilId.value)
      return guardarPerfil(perfilId.value, {
        etiqueta: actual?.etiqueta ?? '',
        razonSocial: datos.nombreOficial ?? actual?.razonSocial ?? '',
        identificacion: datos.cedulaRuc ?? actual?.identificacion ?? '',
        email: datos.email ?? actual?.email ?? '',
        telefono: datos.telefono ?? actual?.telefono ?? '',
        direccion: datos.direccion ?? actual?.direccion ?? '',
      })
    }
    const clienteId = validacion.value?.cliente.id || seleccionados.value[0]?.masterClienteId?._id
    if (!clienteId) return false
    guardandoCliente.value = true
    try {
      const actualizado = await facturacionApi.completarCliente(clienteId, datos)
      // Que la lista también muestre el dato nuevo, sin volver a buscar.
      for (const p of paquetes.value) {
        if (p.masterClienteId?._id === actualizado.id) Object.assign(p.masterClienteId, actualizado)
      }
      toast.showNotification('Datos del cliente guardados', 'success')
      await validar()
      return true
    } catch (error) {
      fail(error, 'No se pudieron guardar los datos')
      return false
    } finally {
      guardandoCliente.value = false
    }
  }

  /** Cambia a quién se factura y vuelve a revisar qué falta con esos datos. */
  async function elegirPerfil(id: string) {
    perfilId.value = id
    consumidorFinal.value = false
    // Mientras se escribe un perfil nuevo no hay nada que validar todavía.
    if (id !== NUEVO_PERFIL) await validar()
  }

  /** Crea (perfilId vacío) o edita un perfil de facturación, y lo deja elegido. */
  async function guardarPerfil(id: string | null, datos: Partial<DatosPerfil>): Promise<boolean> {
    const clienteId = validacion.value?.cliente.id || seleccionados.value[0]?.masterClienteId?._id
    if (!clienteId) return false
    guardandoCliente.value = true
    try {
      const r = await facturacionApi.guardarPerfil(clienteId, id, datos)
      perfiles.value = r.perfiles
      perfilId.value = r.perfil.id
      if (r.perfil.principal) {
        for (const p of paquetes.value) {
          if (p.masterClienteId?._id === clienteId) Object.assign(p.masterClienteId, { nombreOficial: r.perfil.razonSocial, cedulaRuc: r.perfil.identificacion, email: r.perfil.email, telefono: r.perfil.telefono, direccion: r.perfil.direccion })
        }
      }
      toast.showNotification(id ? 'Datos de facturación guardados' : 'Datos de facturación agregados', 'success')
      await validar()
      return true
    } catch (error) {
      fail(error, 'No se pudieron guardar los datos de facturación')
      return false
    } finally {
      guardandoCliente.value = false
    }
  }

  async function eliminarPerfil(id: string): Promise<boolean> {
    const clienteId = validacion.value?.cliente.id
    if (!clienteId || id === 'principal') return false
    try {
      perfiles.value = await facturacionApi.eliminarPerfil(clienteId, id)
      if (perfilId.value === id) perfilId.value = 'principal'
      await validar()
      return true
    } catch (error) {
      fail(error, 'No se pudo eliminar')
      return false
    }
  }

  async function cargarHistorial() {
    cargandoHistorial.value = true
    try {
      facturas.value = await facturacionApi.historial(filtroHistorial.value.trim())
    } catch {
      // El counter sigue pudiendo facturar aunque el historial no cargue.
    } finally {
      cargandoHistorial.value = false
    }
  }

  /** Vuelve a preguntar al SRI por una factura del historial. */
  async function actualizarSriDe(facturaId: string) {
    sincronizandoId.value = facturaId
    try {
      const f = await facturacionApi.sincronizarSri(facturaId)
      facturas.value = facturas.value.map((x) => (x._id === facturaId ? { ...x, estadoSri: f.estadoSri, autorizacionSri: f.autorizacionSri, pdfUrl: f.pdfUrl, xmlUrl: f.xmlUrl, mensajeSri: f.mensajeSri, numeroFactura: f.numeroFactura } : x))
      if (lastFactura.value?.facturaId === facturaId) lastFactura.value = f
      if (facturaAbierta.value?._id === facturaId) facturaAbierta.value = { ...facturaAbierta.value, estadoSri: f.estadoSri, autorizacionSri: f.autorizacionSri, pdfUrl: f.pdfUrl, xmlUrl: f.xmlUrl, mensajeSri: f.mensajeSri, numeroFactura: f.numeroFactura }
    } catch (error) {
      fail(error, 'No se pudo consultar el SRI')
    } finally {
      sincronizandoId.value = null
    }
  }

  function toggle(id: string) {
    const next = new Set(selectedIds.value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    selectedIds.value = next
  }

  const seleccionarTodos = () => {
    selectedIds.value = new Set(paquetes.value.map((p) => p._id))
  }

  const limpiar = () => {
    selectedIds.value = new Set()
  }

  /** Returns true once Contifico accepted the invoice. */
  async function emitir(): Promise<boolean> {
    emitting.value = true
    try {
      const res = await facturacionApi.generar(
        seleccionados.value.map((p) => p._id),
        { consumidorFinal: consumidorFinal.value && sinIdentificacion.value, perfilId: perfilId.value === NUEVO_PERFIL ? 'principal' : perfilId.value },
      )
      lastFactura.value = res.factura
      const estado = SRI_UI[res.factura.estadoSri]
      toast.showNotification(
        res.factura.estadoSri === 'autorizado'
          ? `Factura ${res.factura.numeroFactura} autorizada por el SRI.`
          : `Factura ${res.factura.numeroFactura} emitida. ${estado.label}.`,
        res.factura.estadoSri === 'rechazado' || res.factura.estadoSri === 'error' ? 'error' : 'success',
      )
      limpiar()
      validacion.value = null
      perfilId.value = 'principal'
      // La lista de pendientes y el historial se refrescan solos: la caja ya no está, la factura sí.
      await Promise.all([buscar(), cargarHistorial()])
      return true
    } catch (error) {
      const e = error as { status?: number; data?: { error?: string; faltantes?: DatoFaltante[] } }
      // El servidor detectó datos faltantes al emitir: los mostramos en vez de un toast seco.
      if (e?.status === 422 && e.data?.faltantes && validacion.value) {
        validacion.value = { ...validacion.value, faltantes: e.data.faltantes, listo: false }
      }
      fail(error, 'No se pudo emitir la factura')
      return false
    } finally {
      emitting.value = false
    }
  }

  /** Vuelve a preguntar al SRI por la última factura emitida. */
  async function actualizarSri(): Promise<void> {
    if (!lastFactura.value) return
    sincronizando.value = true
    try {
      lastFactura.value = await facturacionApi.sincronizarSri(lastFactura.value.facturaId)
    } catch (error) {
      fail(error, 'No se pudo consultar el SRI')
    } finally {
      sincronizando.value = false
    }
  }

  /** Primera carga: lo pendiente de facturar, sin filtro. */
  function cargarPendientes() {
    return buscar()
  }

  cargarConfiguracion()

  let historialTimer: number | undefined
  watch(filtroHistorial, () => {
    window.clearTimeout(historialTimer)
    historialTimer = window.setTimeout(cargarHistorial, 350)
  })

  return {
    perfilId,
    perfiles,
    elegirPerfil,
    guardarPerfil,
    eliminarPerfil,
    facturas,
    facturaAbierta,
    cargandoDetalle,
    abrirFactura,
    paqueteAbierto,
    facturasFiltradas,
    conteoSri,
    vista,
    filtroSri,
    cargandoHistorial,
    filtroHistorial,
    sincronizandoId,
    cargarHistorial,
    actualizarSriDe,
    query,
    cargarPendientes,
    tarifas,
    ivaPorcentaje,
    ivaOpciones,
    guardandoIva,
    cambiarIva,
    searching,
    searched,
    paquetes,
    selectedIds,
    emitting,
    lastFactura,
    sincronizando,
    validacion,
    validando,
    guardandoCliente,
    consumidorFinal,
    consumidorFinalPosible,
    sinIdentificacion,
    faltantes,
    faltantesRequeridos,
    seleccionados,
    cliente,
    clientesDistintos,
    totales,
    puedeFacturar,
    toggle,
    seleccionarTodos,
    limpiar,
    iniciarDesde,
    validar,
    completarCliente,
    emitir,
    actualizarSri,
  }
}
