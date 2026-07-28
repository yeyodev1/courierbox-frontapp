import APIBase from './httpBase'

export type NotificacionEstado = 'pendiente' | 'enviando' | 'enviada' | 'fallida'
export type NotificacionEvento =
  | 'gestion_creada'
  | 'pago_confirmado'
  | 'compra_realizada'
  | 'recepcion_bodega'
  | 'envio_en_camino'
  | 'entrega_completada'

export interface Notificacion {
  _id: string
  canal: 'email'
  evento: NotificacionEvento
  destinatario: string
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

  async reintentar(id: string) {
    const response = await this.post<ReintentarResponse>(
      `v1/notificaciones/${encodeURIComponent(id)}/reintentar`,
      {},
    )
    return response.data.notificacion
  }
}

export const notificacionesApi = new NotificacionesAPI()
