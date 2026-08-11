import APIBase from './httpBase'

export interface PaqueteMuestra {
  _id: string
  wr: string
  sh: string
  trackingOriginal: string
  contenido: string
  pesoLb: number
  consigneeNombre: string
  createdAt: string
}

export interface SugerenciaCliente {
  masterId: string
  nombreOficial: string
  codigoCasillero: string
  cedulaRuc: string
  score: number
}

export interface PendienteGrupo {
  nombre: string
  paquetes: PaqueteMuestra[]
  /** Real total across the whole collection, not just the sample. */
  totalPaquetes: number
  totalPesoLb: number
  sugerencias: SugerenciaCliente[]
}

export interface ClienteMaster {
  _id: string
  nombreOficial: string
  codigoCasillero: string
  cedulaRuc?: string
  email?: string
  telefono?: string
}

export interface HomologarPayload {
  nombre?: string
  paqueteIds?: string[]
  masterClienteId?: string
  nuevoCliente?: {
    codigoCasillero: string
    nombreOficial: string
    cedulaRuc?: string
    email?: string
    telefono?: string
  }
}

class HomologacionAPI extends APIBase {
  async pendientes(limite = 40) {
    const res = await this.get<{
      grupos: PendienteGrupo[]
      totalPendientes: number
      totalClientes: number
    }>(`v1/etl/homologacion?limite=${limite}`)
    return res.data
  }

  async buscarClientes(q: string) {
    const res = await this.get<{ clientes: ClienteMaster[] }>(
      `v1/etl/clientes-master?q=${encodeURIComponent(q)}`,
    )
    return res.data.clientes
  }

  async homologar(payload: HomologarPayload) {
    // Can touch hundreds of packages in one call.
    const res = await this.post<{ homologados: number; cliente: ClienteMaster }>(
      'v1/etl/homologar',
      payload,
      undefined,
      { timeout: 60000 },
    )
    return res.data
  }
}

export const homologacionApi = new HomologacionAPI()
