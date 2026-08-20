import { computed, ref } from 'vue'
import {
  notificacionesApi,
  type Notificacion,
  type NotificacionCanal,
  type NotificacionEntrega,
  type NotificacionEstado,
  type NotificacionEvento,
} from '@/services/notificaciones.api'
import { useToastStore } from '@/stores/toast.store'

export type FiltroEstado = NotificacionEstado | ''

export const FILTROS: Array<{ value: FiltroEstado; label: string }> = [
  { value: '', label: 'Todos' },
  { value: 'fallida', label: 'Fallidos' },
  { value: 'parcial', label: 'Parciales' },
  { value: 'enviada', label: 'Enviados' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'enviando', label: 'En proceso' },
]

export const ESTADO_LABELS: Record<NotificacionEstado, string> = {
  pendiente: 'Pendiente',
  enviando: 'En proceso',
  enviada: 'Enviado',
  parcial: 'Parcial',
  fallida: 'Fallido',
}

export const CANAL_LABELS: Record<NotificacionCanal, string> = {
  email: 'Correo',
  whatsapp: 'WhatsApp',
}

export const CANAL_ICONOS: Record<NotificacionCanal, string> = {
  email: 'fa-solid fa-envelope',
  whatsapp: 'fa-brands fa-whatsapp',
}

export const ENTREGA_LABELS: Record<NotificacionEntrega['estado'], string> = {
  pendiente: 'Pendiente',
  enviando: 'Enviando',
  listo: 'Listo para enviar',
  enviada: 'Entregado',
  fallida: 'Fallido',
  omitida: 'Omitido',
}

export const EVENTO_LABELS: Record<NotificacionEvento, string> = {
  gestion_creada: 'Gestión creada',
  pago_confirmado: 'Pago confirmado',
  compra_realizada: 'Compra realizada',
  recepcion_bodega: 'Recepción en bodega',
  envio_en_camino: 'Envío en camino',
  entrega_completada: 'Entrega completada',
  retiro_counter: 'Retiro en counter',
}

/** Older documents predate per-channel tracking; show them as a single email row. */
export function entregasDe(notificacion: Notificacion): NotificacionEntrega[] {
  if (notificacion.entregas?.length) return notificacion.entregas
  return [
    {
      canal: notificacion.canal ?? 'email',
      estado: notificacion.estado === 'parcial' ? 'enviada' : notificacion.estado,
      intentos: notificacion.intentos,
      providerId: notificacion.providerId,
      ultimoError: notificacion.ultimoError,
      enviadaEn: notificacion.enviadaEn,
    },
  ]
}

export function destinoDe(notificacion: Notificacion, canal: NotificacionCanal): string {
  if (canal === 'whatsapp') {
    // The link always targets the Courier Box line; the client's own number is
    // shown only as reference for the operator.
    return notificacion.destinatarioTelefono
      ? `Cliente: ${notificacion.destinatarioTelefono}`
      : 'Mensaje listo para enviar'
  }
  return notificacion.destinatario || 'Sin correo'
}

export function operacionLabel(tipo: Notificacion['operacionTipo']) {
  return tipo === 'gestion_compra' ? 'Gestión de compra' : 'Envío'
}

export function formatDate(value?: string) {
  if (!value) return 'Sin registro'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Sin registro'
  return new Intl.DateTimeFormat('es-EC', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message) return message
  }
  return fallback
}

/** The delivery ledger: listing, filtering, retrying and the manual WhatsApp flow. */
export function useNotificaciones() {
  const toast = useToastStore()

  const notificaciones = ref<Notificacion[]>([])
  const filtroEstado = ref<FiltroEstado>('')
  const cargando = ref(true)
  const errorCarga = ref('')
  const reintentandoId = ref<string | null>(null)
  const marcandoId = ref<string | null>(null)

  const resumen = computed(() => {
    const count = (estado: NotificacionEstado) => notificaciones.value.filter((n) => n.estado === estado).length
    return {
      total: notificaciones.value.length,
      fallidas: count('fallida'),
      parciales: count('parcial'),
      enviadas: count('enviada'),
    }
  })

  function replace(actualizada: Notificacion) {
    const index = notificaciones.value.findIndex((item) => item._id === actualizada._id)
    if (index < 0) return
    // A retry can move the record out of the active filter; drop it in that case.
    if (filtroEstado.value && actualizada.estado !== filtroEstado.value) {
      notificaciones.value.splice(index, 1)
    } else {
      notificaciones.value.splice(index, 1, actualizada)
    }
  }

  async function cargar() {
    cargando.value = true
    errorCarga.value = ''
    try {
      notificaciones.value = await notificacionesApi.listar(filtroEstado.value || undefined)
    } catch (error: unknown) {
      errorCarga.value = getErrorMessage(error, 'No se pudieron cargar las notificaciones.')
    } finally {
      cargando.value = false
    }
  }

  async function seleccionarFiltro(estado: FiltroEstado) {
    if (estado === filtroEstado.value) return
    filtroEstado.value = estado
    await cargar()
  }

  async function reintentar(notificacion: Notificacion, canal?: NotificacionCanal) {
    if (reintentandoId.value) return
    reintentandoId.value = notificacion._id
    try {
      const actualizada = await notificacionesApi.reintentar(notificacion._id, canal)
      replace(actualizada)

      if (actualizada.estado === 'enviada') {
        toast.showNotification('Notificación reenviada correctamente.', 'success')
      } else if (actualizada.estado === 'parcial') {
        toast.showNotification('Se entregó por algunos canales; revisa el detalle.', 'warning')
      } else {
        toast.showNotification('El reintento terminó con un error.', 'error')
      }
    } catch (error: unknown) {
      toast.showNotification(getErrorMessage(error, 'No se pudo reintentar la notificación.'), 'error')
    } finally {
      reintentandoId.value = null
    }
  }

  async function marcarEnviada(notificacion: Notificacion) {
    if (marcandoId.value) return
    marcandoId.value = notificacion._id
    try {
      replace(await notificacionesApi.marcarEnviada(notificacion._id, 'whatsapp'))
      toast.showNotification('WhatsApp marcado como enviado.', 'success')
    } catch (error: unknown) {
      toast.showNotification(getErrorMessage(error, 'No se pudo marcar el envío.'), 'error')
    } finally {
      marcandoId.value = null
    }
  }

  /**
   * There is no WhatsApp API here: the operator opens the prefilled chat on the
   * Courier Box line, sends it, and confirms so the ledger stops flagging it.
   */
  async function abrirWhatsapp(notificacion: Notificacion, entrega: NotificacionEntrega) {
    if (!entrega.enlace) return
    window.open(entrega.enlace, '_blank', 'noopener,noreferrer')
    await marcarEnviada(notificacion)
  }

  return {
    notificaciones,
    filtroEstado,
    cargando,
    errorCarga,
    reintentandoId,
    marcandoId,
    resumen,
    cargar,
    seleccionarFiltro,
    reintentar,
    abrirWhatsapp,
  }
}
