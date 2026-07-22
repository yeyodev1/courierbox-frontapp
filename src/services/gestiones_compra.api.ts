import APIBase from './httpBase'
import type { ServiceType } from '@/services/asesoria.api'

export interface Contacto {
  _id: string
  nombre: string
  email?: string
  telefono?: string
  cedula?: string
  notas?: string
}

export interface CuentaBancaria {
  _id: string
  banco: string
  numeroCuenta: string
  titular: string
  tipoCuenta: 'corriente' | 'ahorros'
  activa: boolean
}

export type GestionCompraEstado = 'borrador' | 'activa' | 'completado' | 'cancelado'
export type GestionCompraStage = 'solicitada' | 'revisando' | 'comprada' | 'en_transito' | 'entregada'

export interface GestionCompraFoto {
  url: string
  title?: string
  createdAt: string
}

export interface GestionCompra {
  _id: string
  asesorId: { _id: string; name: string; email: string } | string
  contactoId: Contacto | string
  valorTotal: number
  valorReserva: number
  cuentaBancariaId: CuentaBancaria | string
  reservaConfirmada: boolean
  costoVenta: number
  valorComision: number
  feeConfigId?: string
  paginaCompra: string
  fechaEntregaTentativa: string // ISO date
  imagenCompraUrl?: string
  fotosRelacionadas: GestionCompraFoto[]
  stage: GestionCompraStage
  estado: GestionCompraEstado
  viewToken: string
  notificacionEnviada: boolean
  notas?: string
  auditLog: {
    timestamp: string
    action: string
    userId: string
    userName: string
    notes?: string
  }[]
  createdAt: string
  updatedAt: string
}

export interface CreateGestionCompraInput {
  asesorId?: string
  contactoId: string
  valorTotal: number
  valorReserva: number
  cuentaBancariaId: string
  costoVenta: number
  valorComision: number
  serviceType?: ServiceType
  feeConfigId?: string
  paginaCompra: string
  fechaEntregaTentativa: string
  imagenCompraUrl?: string
  fotosRelacionadas?: { url: string; title?: string; createdAt?: string }[]
  stage?: GestionCompraStage
  notas?: string
}

export interface GestionesStats {
  totalGestiones: number
  sumaValorTotal: number
  sumaComision: number
  sumaCostoVenta: number
  porEstado: Record<string, number>
}

export interface GestionesListResult {
  gestiones: GestionCompra[]
  total: number
  page: number
  limit: number
  pages: number
}

class GestionesCompraAPI extends APIBase {
  private readonly base = 'v1/gestiones-compra'

  async list(params?: {
    page?: number
    limit?: number
    estado?: string
    asesorId?: string
    mes?: number
    año?: number
  }): Promise<GestionesListResult> {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.limit) query.set('limit', String(params.limit))
    if (params?.estado) query.set('estado', params.estado)
    if (params?.asesorId) query.set('asesorId', params.asesorId)
    if (params?.mes) query.set('mes', String(params.mes))
    if (params?.año) query.set('año', String(params.año))

    const qs = query.toString()
    const res = await this.get<GestionesListResult>(`${this.base}${qs ? `?${qs}` : ''}`)
    return res.data
  }

  async create(input: CreateGestionCompraInput): Promise<GestionCompra> {
    const res = await this.post<{ gestion: GestionCompra }>(this.base, input)
    return res.data.gestion
  }

  async getById(id: string): Promise<GestionCompra> {
    const res = await this.get<{ gestion: GestionCompra }>(`${this.base}/${id}`)
    return res.data.gestion
  }

  async getByToken(token: string): Promise<GestionCompra> {
    const res = await this.get<{ gestion: GestionCompra }>(`${this.base}/view/${token}`)
    return res.data.gestion
  }

  async update(id: string, data: Partial<CreateGestionCompraInput> & { estado?: GestionCompraEstado }): Promise<GestionCompra> {
    const res = await this.patch<{ gestion: GestionCompra }>(`${this.base}/${id}`, data)
    return res.data.gestion
  }

  async confirmarReserva(id: string): Promise<GestionCompra> {
    const res = await this.post<{ gestion: GestionCompra }>(`${this.base}/${id}/confirmar-reserva`, {})
    return res.data.gestion
  }

  async reNotificar(id: string): Promise<void> {
    await this.post(`${this.base}/${id}/notificar`, {})
  }

  async getStatsMensuales(params?: { año?: number; mes?: number; asesorId?: string }): Promise<GestionesStats> {
    const query = new URLSearchParams()
    if (params?.año) query.set('año', String(params.año))
    if (params?.mes) query.set('mes', String(params.mes))
    if (params?.asesorId) query.set('asesorId', params.asesorId)

    const qs = query.toString()
    const res = await this.get<GestionesStats>(`${this.base}/stats/mensual${qs ? `?${qs}` : ''}`)
    return res.data
  }

  async getComisionPreview(valorTotal: number, feeConfigId?: string): Promise<{ valorComision: number; feeConfigNombre: string }> {
    const query = new URLSearchParams({ valorTotal: String(valorTotal) })
    if (feeConfigId) query.set('feeConfigId', feeConfigId)
    const res = await this.get<{ valorComision: number; feeConfigNombre: string }>(
      `${this.base}/comision-preview?${query.toString()}`
    )
    return res.data
  }

  async uploadImagen(file: File): Promise<string> {
    const form = new FormData()
    form.append('imagen', file)
    const res = await this.post<{ url: string }>(`${this.base}/upload-imagen`, form)
    return res.data.url
  }

  async recepcionBodega(
    id: string,
    data: { fotos: { url: string; title?: string }[]; notas?: string; enviarCorreo?: boolean; entregaEstimada?: string }
  ): Promise<GestionCompra> {
    const res = await this.post<{ gestion: GestionCompra }>(`${this.base}/${id}/recepcion-bodega`, data)
    return res.data.gestion
  }
}

export const gestionesCompraAPI = new GestionesCompraAPI()
