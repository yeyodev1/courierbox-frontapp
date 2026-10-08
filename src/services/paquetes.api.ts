import APIBase from './httpBase'

export type EstadoPaquete = 'importado' | 'pendiente_validacion' | 'validado' | 'facturado' | 'pagado' | 'despachado'

/** Una caja ("warehouse") tal como la ve la bodega: datos del manifiesto, su cliente y su factura. */
export interface Warehouse {
  _id: string
  wr: string
  sh: string
  mg: string
  trackingOriginal: string
  pesoLb: number
  contenido: string
  consigneeNombre: string
  consigneeLimpio: string
  fechaIngreso: string | null
  origen: string
  agencia: string
  ciudad: string
  direccion: string
  valorDeclarado: number
  reempaque: boolean | null
  estado: EstadoPaquete
  notas?: string
  createdAt: string
  masterClienteId?: {
    _id: string
    nombreOficial?: string
    codigoCasillero?: string
    cedulaRuc?: string
    telefono?: string
    email?: string
    direccion?: string
  } | null
  facturaId?: {
    _id: string
    numeroFactura: string
    estado: string
    estadoSri: string
    totalGeneral: number
    createdAt: string
  } | null
}

export interface FiltrosWarehouses {
  q?: string
  estado?: string
  agencia?: string
  facturado?: '' | 'si' | 'no'
  desde?: string
  hasta?: string
  page?: number
  limit?: number
}

export interface ListaWarehouses {
  paquetes: Warehouse[]
  total: number
  page: number
  limit: number
  pesoTotalLb: number
  sinFactura: number
  agencias: string[]
}

class PaquetesAPI extends APIBase {
  async listar(f: FiltrosWarehouses) {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(f)) {
      if (v !== undefined && v !== null && String(v) !== '') params.set(k, String(v))
    }
    const res = await this.get<ListaWarehouses>(`v1/paquetes?${params.toString()}`)
    return res.data
  }

  async detalle(id: string) {
    const res = await this.get<{ paquete: Warehouse }>(`v1/paquetes/${id}`)
    return res.data.paquete
  }

  /** Los datos de cada etiqueta, en el mismo orden de `ids`. */
  async etiquetas(ids: string[]) {
    const res = await this.post<{ paquetes: Warehouse[] }>('v1/paquetes/etiquetas', { ids })
    return res.data.paquetes
  }
}

export const paquetesApi = new PaquetesAPI()
