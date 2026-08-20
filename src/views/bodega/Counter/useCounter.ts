import { computed, ref, watch } from 'vue'
import { retirosCounterApi, type PaqueteDisponible, type RetiroCounter } from '@/services/retiros_counter.api'
import { useToastStore } from '@/stores/toast.store'
import { whatsappUrl } from '@/config/contact'

export interface RetiroForm {
  retiradoPorNombre: string
  retiradoPorCedula: string
  retiradoPorParentesco: string
  observaciones: string
}

export function emptyRetiroForm(): RetiroForm {
  return { retiradoPorNombre: '', retiradoPorCedula: '', retiradoPorParentesco: '', observaciones: '' }
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' })
}

export function folio(id: string) {
  return id.slice(-8).toUpperCase()
}

/**
 * No CRM and no WhatsApp API: we compose the message and open a chat on the
 * Courier Box line so the operator sends it in one tap.
 */
export function whatsappRetiroUrl(retiro: RetiroCounter) {
  const texto =
    `Hola Courier Box, soy ${retiro.clienteNombre}. ` +
    `Retiré ${retiro.totalPaquetes} paquete(s) en counter (comprobante #${folio(retiro._id)}).` +
    (retiro.comprobanteUrl ? ` Comprobante: ${retiro.comprobanteUrl}` : '')
  return whatsappUrl(texto)
}

/**
 * Counter pickup: search the client's packages, select everything they are
 * taking, capture one signature, and release the whole batch at once.
 */
export function useCounter() {
  const toast = useToastStore()

  const query = ref('')
  const searching = ref(false)
  const searched = ref(false)
  const disponibles = ref<PaqueteDisponible[]>([])
  const selectedIds = ref<Set<string>>(new Set())

  const historial = ref<RetiroCounter[]>([])
  const loadingHistorial = ref(true)
  const lastRetiro = ref<RetiroCounter | null>(null)
  const saving = ref(false)
  const anulando = ref(false)

  const seleccionados = computed(() => disponibles.value.filter((p) => selectedIds.value.has(p._id)))

  const cliente = computed(() => {
    const first = seleccionados.value[0]
    const master = first?.masterClienteId
    return {
      masterClienteId: master?._id,
      nombre: master?.nombre || first?.consigneeLimpio || first?.consigneeNombre || '',
      identificacion: master?.identificacion || '',
      email: master?.email || '',
      telefono: master?.telefono || '',
      codigoCasillero: master?.codigoCasillero || '',
    }
  })

  /** Guard rail: one signature must cover one client, never a mixed batch. */
  const clientesDistintos = computed(() => {
    const keys = new Set(
      seleccionados.value.map((p) => p.masterClienteId?._id || p.consigneeLimpio || p.consigneeNombre || ''),
    )
    return keys.size > 1
  })

  const totales = computed(() => ({
    paquetes: seleccionados.value.length,
    peso: seleccionados.value.reduce((sum, p) => sum + (Number(p.pesoLb) || 0), 0),
  }))

  const puedeFirmar = computed(
    () => seleccionados.value.length > 0 && !clientesDistintos.value && Boolean(cliente.value.nombre),
  )

  let searchTimer: number | undefined

  watch(query, (value) => {
    window.clearTimeout(searchTimer)
    if (value.trim().length < 2) {
      disponibles.value = []
      searched.value = false
      return
    }
    searchTimer = window.setTimeout(buscar, 350)
  })

  function fail(error: unknown, fallback: string) {
    const e = error as { data?: { error?: string }; message?: string }
    toast.showNotification(e?.data?.error || e?.message || fallback, 'error')
  }

  async function buscar() {
    searching.value = true
    try {
      disponibles.value = await retirosCounterApi.disponibles(query.value.trim())
      searched.value = true
    } catch (error) {
      fail(error, 'No se pudo buscar paquetes')
    } finally {
      searching.value = false
    }
  }

  function toggle(id: string) {
    const next = new Set(selectedIds.value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    selectedIds.value = next
  }

  const seleccionarTodos = () => {
    selectedIds.value = new Set(disponibles.value.map((p) => p._id))
  }

  const limpiarSeleccion = () => {
    selectedIds.value = new Set()
  }

  async function cargarHistorial() {
    loadingHistorial.value = true
    try {
      historial.value = await retirosCounterApi.listar({ limit: 40 })
    } catch (error) {
      fail(error, 'No se pudo cargar el historial')
    } finally {
      loadingHistorial.value = false
    }
  }

  /** Returns true when the batch was released and the receipt was generated. */
  async function confirmarRetiro(form: RetiroForm, firmaDataUrl: string, otroRetira: boolean): Promise<boolean> {
    if (!firmaDataUrl) {
      toast.showNotification('Falta la firma del cliente', 'warning')
      return false
    }
    saving.value = true
    try {
      const retiro = await retirosCounterApi.crear({
        masterClienteId: cliente.value.masterClienteId,
        clienteNombre: cliente.value.nombre,
        clienteIdentificacion: cliente.value.identificacion,
        clienteEmail: cliente.value.email,
        clienteTelefono: cliente.value.telefono,
        codigoCasillero: cliente.value.codigoCasillero,
        items: seleccionados.value.map((p) => ({
          paqueteId: p._id,
          referencia: p.wr || p.sh || p.trackingOriginal,
          descripcion: p.contenido,
          pesoLb: Number(p.pesoLb) || 0,
          valor: 0,
        })),
        firmaDataUrl,
        retiradoPorNombre: otroRetira ? form.retiradoPorNombre : cliente.value.nombre,
        retiradoPorCedula: otroRetira ? form.retiradoPorCedula : cliente.value.identificacion,
        retiradoPorParentesco: otroRetira ? form.retiradoPorParentesco : '',
        observaciones: form.observaciones,
      })

      lastRetiro.value = retiro
      limpiarSeleccion()
      disponibles.value = []
      query.value = ''
      searched.value = false
      await cargarHistorial()
      toast.showNotification(
        `Retiro firmado · ${retiro.totalPaquetes} paquete(s). Comprobante enviado al cliente.`,
        'success',
      )
      return true
    } catch (error) {
      fail(error, 'No se pudo registrar el retiro')
      return false
    } finally {
      saving.value = false
    }
  }

  async function anular(retiro: RetiroCounter): Promise<boolean> {
    anulando.value = true
    try {
      await retirosCounterApi.anular(retiro._id, 'Anulado desde counter')
      toast.showNotification('Retiro anulado. Los paquetes vuelven a estar disponibles.', 'success')
      await cargarHistorial()
      return true
    } catch (error) {
      fail(error, 'No se pudo anular')
      return false
    } finally {
      anulando.value = false
    }
  }

  return {
    query,
    searching,
    searched,
    disponibles,
    selectedIds,
    historial,
    loadingHistorial,
    lastRetiro,
    saving,
    anulando,
    seleccionados,
    cliente,
    clientesDistintos,
    totales,
    puedeFirmar,
    toggle,
    seleccionarTodos,
    limpiarSeleccion,
    cargarHistorial,
    confirmarRetiro,
    anular,
  }
}
