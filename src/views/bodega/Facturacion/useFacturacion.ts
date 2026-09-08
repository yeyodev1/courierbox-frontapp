import { computed, ref, watch } from 'vue'
import {
  calcularTotalesLocal,
  facturacionApi,
  type ClienteFacturable,
  type DatoFaltante,
  type EstadoSri,
  type FacturaEmitida,
  type PaqueteFacturable,
  type Tarifas,
  type TotalesFactura,
  type ValidacionFactura,
} from '@/services/facturacion.api'
import { useToastStore } from '@/stores/toast.store'

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
  const tarifas = ref<Tarifas>({ fleteLb: 0, arancelLb: 0, iva: 0 })
  const selectedIds = ref<Set<string>>(new Set())

  const emitting = ref(false)
  const lastFactura = ref<FacturaEmitida | null>(null)
  const sincronizando = ref(false)

  /** Lo que el servidor dice del cliente elegido: datos, totales y qué falta. */
  const validacion = ref<ValidacionFactura | null>(null)
  const validando = ref(false)
  const guardandoCliente = ref(false)
  const consumidorFinal = ref(false)

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
      validacion.value = await facturacionApi.validar(seleccionados.value.map((p) => p._id))
    } catch (error) {
      validacion.value = null
      fail(error, 'No se pudo revisar los datos del cliente')
    } finally {
      validando.value = false
    }
  }

  /** Guarda lo que el counter completó y vuelve a validar con eso. */
  async function completarCliente(datos: Partial<FormularioCliente>): Promise<boolean> {
    if (!cliente.value.id) return false
    guardandoCliente.value = true
    try {
      const actualizado = await facturacionApi.completarCliente(cliente.value.id, datos)
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
        { consumidorFinal: consumidorFinal.value && sinIdentificacion.value },
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
      paquetes.value = []
      query.value = ''
      searched.value = false
      validacion.value = null
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

  return {
    query,
    cargarPendientes,
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
