import APIBase from './httpBase'

export type NotificacionEstado = 'pendiente' | 'enviando' | 'enviada' | 'parcial' | 'fallida'
export type NotificacionCanal = 'email' | 'whatsapp'
/**
 * `omitida` = nothing to send. `listo` = the message is composed and waiting
 * for an operator to open the WhatsApp link and hit send.
 */
export type EntregaEstado =
  | 'pendiente'
  | 'enviando'
  | 'listo'
  | 'enviada'
  | 'fallida'
  | 'omitida'
export type NotificacionEvento =
  | 'gestion_creada'
  | 'pago_confirmado'
  | 'compra_realizada'
  | 'recepcion_bodega'
  | 'envio_en_camino'
  | 'entrega_completada'
  | 'retiro_counter'

export interface NotificacionEntrega {
  canal: NotificacionCanal
  estado: EntregaEstado
  intentos: number
  providerId?: string
  ultimoError?: string
  enviadaEn?: string
  /** Composed WhatsApp body. */
  mensaje?: string
  /** wa.me link that opens the message against the Courier Box line. */
  enlace?: string
}

export interface Notificacion {
  _id: string
  canal: NotificacionCanal
  canales: NotificacionCanal[]
  entregas: NotificacionEntrega[]
  evento: NotificacionEvento
  destinatario: string
  destinatarioTelefono?: string
  destinatarioNombre?: string
  operacionTipo: 'gestion_compra' | 'envio'
  operacionId: string
  estado: NotificacionEstado
  intentos: number
  providerId?: string
  ultimoError?: string
  enviadaEn?: string
  createdAt: string
  updatedAt: string
}

interface NotificacionesResponse {
  notificaciones: Notificacion[]
}

interface ReintentarResponse {
  notificacion: Notificacion
}

class NotificacionesAPI extends APIBase {
  async listar(estado?: NotificacionEstado) {
    const query = estado ? `?estado=${encodeURIComponent(estado)}` : ''
    const response = await this.get<NotificacionesResponse>(`v1/notificaciones${query}`)
    return response.data.notificaciones
  }

  /** Omit `canal` to retry every channel that has not landed yet. */
  async reintentar(id: string, canal?: NotificacionCanal) {
    const response = await this.post<ReintentarResponse>(
      `v1/notificaciones/${encodeURIComponent(id)}/reintentar`,
      canal ? { canal } : {},
    )
    return response.data.notificacion
  }

  /** Confirms a manual send after the operator used the WhatsApp link. */
  async marcarEnviada(id: string, canal: NotificacionCanal = 'whatsapp') {
    const response = await this.post<ReintentarResponse>(
      `v1/notificaciones/${encodeURIComponent(id)}/marcar-enviada`,
      { canal },
    )
    return response.data.notificacion
  }
}

export const notificacionesApi = new NotificacionesAPI()
