import { computed, ref, watch } from 'vue'
import { solicitudesApi, type Cotizacion, type SolicitudCreada } from '@/services/solicitudes.api'

export interface ItemForm {
  id: number
  url: string
  titulo: string
  cantidad: number
  valorProducto: number | null
  valorEnvio: number | null
  notas: string
}

export interface ClienteForm {
  clienteNombre: string
  clienteEmail: string
  clienteTelefono: string
  clienteCedula: string
  codigoCasillero: string
}

export function money(value: number) {
  return `$${(Number(value) || 0).toFixed(2)}`
}

/**
 * Public self-service purchase form — Module 4 of the proposal.
 *
 * A client pastes Amazon/eBay links, fills in the price, and sees the
 * commission update as they type. No login: this is the front door, and the
 * request lands in the advisors' queue rather than becoming a half-formed sale.
 */
export function usePersonalShopper() {
  let nextId = 1
  const nuevoItem = (): ItemForm => ({
    id: nextId++,
    url: '',
    titulo: '',
    cantidad: 1,
    valorProducto: null,
    valorEnvio: null,
    notas: '',
  })

  const items = ref<ItemForm[]>([nuevoItem()])
  const cliente = ref<ClienteForm>({
    clienteNombre: '',
    clienteEmail: '',
    clienteTelefono: '',
    clienteCedula: '',
    codigoCasillero: '',
  })

  const tiendas = ref<string[]>([])
  const cotizacion = ref<Cotizacion | null>(null)
  const cotizando = ref(false)
  const enviando = ref(false)
  const error = ref('')
  const enviada = ref<SolicitudCreada | null>(null)

  const itemsValidos = computed(() =>
    items.value.filter((i) => i.url.trim() && (Number(i.valorProducto) || 0) > 0),
  )

  const contactoOk = computed(() =>
    Boolean(cliente.value.clienteEmail.trim() || cliente.value.clienteTelefono.trim()),
  )

  const puedeEnviar = computed(
    () => Boolean(cliente.value.clienteNombre.trim()) && contactoOk.value && itemsValidos.value.length > 0,
  )

  /** Local mirror of the quote so the totals move without a round trip. */
  const totalLocal = computed(() =>
    itemsValidos.value.reduce(
      (sum, i) =>
        sum + ((Number(i.valorProducto) || 0) + (Number(i.valorEnvio) || 0)) * Math.max(1, i.cantidad),
      0,
    ),
  )

  /** An empty URL is not an error yet — only a link outside the allowed stores is. */
  function urlValida(url: string): boolean {
    if (!url.trim()) return true
    try {
      const host = new URL(url.trim()).hostname.replace(/^www\./i, '').toLowerCase()
      return tiendas.value.some((t) => host === t || host.endsWith(`.${t}`))
    } catch {
      return false
    }
  }

  let timer: number | undefined

  watch(
    () => itemsValidos.value.map((i) => `${i.cantidad}:${i.valorProducto}:${i.valorEnvio}`).join('|'),
    () => {
      window.clearTimeout(timer)
      if (!itemsValidos.value.length) {
        cotizacion.value = null
        return
      }
      timer = window.setTimeout(cotizar, 400)
    },
  )

  async function cotizar() {
    cotizando.value = true
    try {
      cotizacion.value = await solicitudesApi.cotizar(
        itemsValidos.value.map((i) => ({
          url: i.url,
          cantidad: i.cantidad,
          valorProducto: Number(i.valorProducto) || 0,
          valorEnvio: Number(i.valorEnvio) || 0,
        })),
      )
    } catch {
      // A failed quote must not block the form; the server quotes again on submit.
      cotizacion.value = null
    } finally {
      cotizando.value = false
    }
  }

  const agregar = () => items.value.push(nuevoItem())

  function quitar(id: number) {
    items.value = items.value.filter((i) => i.id !== id)
    if (!items.value.length) items.value = [nuevoItem()]
  }

  async function enviar() {
    error.value = ''
    enviando.value = true
    try {
      enviada.value = await solicitudesApi.crear({
        ...cliente.value,
        items: itemsValidos.value.map((i) => ({
          url: i.url.trim(),
          titulo: i.titulo.trim(),
          cantidad: i.cantidad,
          valorProducto: Number(i.valorProducto) || 0,
          valorEnvio: Number(i.valorEnvio) || 0,
          notas: i.notas.trim(),
        })),
      })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e: unknown) {
      const err = e as { data?: { error?: string }; message?: string }
      error.value = err?.data?.error || err?.message || 'No pudimos enviar tu solicitud. Intenta de nuevo.'
    } finally {
      enviando.value = false
    }
  }

  function otraSolicitud() {
    enviada.value = null
    items.value = [nuevoItem()]
    cotizacion.value = null
  }

  async function loadTiendas() {
    try {
      tiendas.value = await solicitudesApi.tiendas()
    } catch {
      tiendas.value = []
    }
  }

  return {
    items,
    cliente,
    tiendas,
    cotizacion,
    cotizando,
    enviando,
    error,
    enviada,
    itemsValidos,
    contactoOk,
    puedeEnviar,
    totalLocal,
    urlValida,
    agregar,
    quitar,
    enviar,
    otraSolicitud,
    loadTiendas,
  }
}
