import APIBase from './httpBase'

export interface RetiroItem {
  paqueteId?: string
  gestionCompraId?: string
  envioDomicilioId?: string
  referencia: string
  descripcion: string
  pesoLb: number
  valor: number
}

export interface RetiroCounter {
  _id: string
  masterClienteId?: string
  contactoId?: string
  clienteNombre: string
  clienteIdentificacion: string
  clienteEmail: string
  clienteTelefono: string
  codigoCasillero: string
  items: RetiroItem[]
  totalPaquetes: number
  totalPesoLb: number
  totalValor: number
  retiradoPorNombre: string
  retiradoPorCedula: string
  retiradoPorParentesco: string
  firmaUrl: string
  comprobanteUrl: string
  observaciones: string
  estado: 'firmado' | 'anulado'
  anuladoMotivo?: string
  anuladoEn?: string
  atendidoPorNombre: string
  firmadoEn: string
  createdAt: string
  updatedAt: string
}

export interface CrearRetiroPayload {
  masterClienteId?: string
  contactoId?: string
  clienteNombre: string
  clienteIdentificacion?: string
  clienteEmail?: string
  clienteTelefono?: string
  codigoCasillero?: string
  items: Array<Partial<RetiroItem>>
  /** PNG data URL produced by AppSignaturePad. */
  firmaDataUrl: string
  retiradoPorNombre?: string
  retiradoPorCedula?: string
  retiradoPorParentesco?: string
  observaciones?: string
}

export interface ListarRetirosParams {
  q?: string
  desde?: string
  hasta?: string
  estado?: 'firmado' | 'anulado'
  limit?: number
}

export interface PaqueteDisponible {
  _id: string
  wr: string
  sh: string
  trackingOriginal: string
  contenido: string
  pesoLb: number
  consigneeNombre: string
  consigneeLimpio: string
  estado: string
  masterClienteId?: {
    _id: string
    nombre?: string
    identificacion?: string
    email?: string
    telefono?: string
    codigoCasillero?: string
  } | null
}

class RetirosCounterAPI extends APIBase {
  /** Packages in the warehouse that no signed retiro has released yet. */
  async disponibles(q: string) {
    const response = await this.get<{ paquetes: PaqueteDisponible[] }>(
      `v1/retiros-counter/disponibles?q=${encodeURIComponent(q)}`,
    )
    return response.data.paquetes
  }

  async listar(params: ListarRetirosParams = {}) {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') query.set(key, String(value))
    })
    const suffix = query.toString() ? `?${query.toString()}` : ''
    const response = await this.get<{ retiros: RetiroCounter[] }>(`v1/retiros-counter${suffix}`)
    return response.data.retiros
  }

  async detalle(id: string) {
    const response = await this.get<{ retiro: RetiroCounter }>(
      `v1/retiros-counter/${encodeURIComponent(id)}`,
    )
    return response.data.retiro
  }

  async crear(payload: CrearRetiroPayload) {
    // The base64 signature makes this request heavier and the API renders a PDF
    // before responding, so the default 15s timeout is not enough.
    const response = await this.post<{ retiro: RetiroCounter }>(
      'v1/retiros-counter',
      payload,
      undefined,
      { timeout: 60000 },
    )
    return response.data.retiro
  }

  async anular(id: string, motivo: string) {
    const response = await this.post<{ retiro: RetiroCounter }>(
      `v1/retiros-counter/${encodeURIComponent(id)}/anular`,
      { motivo },
    )
    return response.data.retiro
  }
}

export const retirosCounterApi = new RetirosCounterAPI()
