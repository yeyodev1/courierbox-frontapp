import APIBase from './httpBase'

export interface SolicitudItemInput {
  url: string
  titulo?: string
  cantidad?: number
  valorProducto?: number
  valorEnvio?: number
  notas?: string
}

export interface Cotizacion {
  subtotal: number
  comisionEstimada: number
  totalEstimado: number
  comisionDetalle: string
  feeConfigId?: string
  configNombre: string
}

export interface SolicitudCreada {
  _id: string
  folio: string
  subtotal: number
  comisionEstimada: number
  totalEstimado: number
  clienteEmail: string
}

export interface Solicitud {
  _id: string
  clienteNombre: string
  clienteEmail: string
  clienteTelefono: string
  clienteCedula: string
  codigoCasillero: string
  items: Array<{
    url: string
    titulo: string
    cantidad: number
    valorProducto: number
    valorEnvio: number
    notas: string
  }>
  subtotal: number
  comisionEstimada: number
  totalEstimado: number
  comisionDetalle: string
  estado: 'nueva' | 'contactada' | 'convertida' | 'descartada'
  notasInternas: string
  createdAt: string
}

class SolicitudesAPI extends APIBase {
  /** Public — no token required. */
  async tiendas() {
    const res = await this.get<{ tiendas: string[] }>('v1/solicitudes-compra/tiendas')
    return res.data.tiendas
  }

  /** Public — quotes a basket without storing anything. */
  async cotizar(items: SolicitudItemInput[]) {
    const res = await this.post<Cotizacion>('v1/solicitudes-compra/cotizar', { items })
    return res.data
  }

  /** Public — submits the request. */
  async crear(payload: {
    clienteNombre: string
    clienteEmail?: string
    clienteTelefono?: string
    clienteCedula?: string
    codigoCasillero?: string
    items: SolicitudItemInput[]
  }) {
    const res = await this.post<{ solicitud: SolicitudCreada }>('v1/solicitudes-compra', payload)
    return res.data.solicitud
  }

  async listar(estado?: string) {
    const query = estado ? `?estado=${encodeURIComponent(estado)}` : ''
    const res = await this.get<{ solicitudes: Solicitud[] }>(`v1/solicitudes-compra${query}`)
    return res.data.solicitudes
  }

  async cambiarEstado(id: string, estado: Solicitud['estado'], notasInternas?: string) {
    const res = await this.patch<{ solicitud: Solicitud }>(
      `v1/solicitudes-compra/${encodeURIComponent(id)}/estado`,
      { estado, notasInternas },
    )
    return res.data.solicitud
  }
}

export const solicitudesApi = new SolicitudesAPI()
