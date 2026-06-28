import APIBase from './httpBase'

export interface EnvioDomicilio {
  _id: string
  paqueteId: {
    _id: string
    wr: string
    sh: string
    trackingOriginal: string
    contenido: string
  }
  clienteNombre: string
  clienteDireccion: string
  clienteTelefono: string
  tipoTransportista: 'propio' | 'externo'
  transportistaNombre: string
  costoEnvio: number
  trackingLocal: string
  estado: 'pendiente' | 'asignado' | 'en_ruta' | 'entregado' | 'fallido'
  evidenciaUrl: string
  notas: string
  creadoPor: { _id: string; name: string; email: string }
  createdAt: string
  updatedAt: string
}

export interface PaqueteSimple {
  _id: string
  wr: string
  sh: string
  trackingOriginal: string
  contenido: string
}

class EnviosAPI extends APIBase {
  async list(params?: { estado?: string; paqueteId?: string; limit?: number; offset?: number }) {
    const searchParams = new URLSearchParams()
    if (params?.estado) searchParams.set('estado', params.estado)
    if (params?.paqueteId) searchParams.set('paqueteId', params.paqueteId)
    if (params?.limit) searchParams.set('limit', String(params.limit))
    if (params?.offset) searchParams.set('offset', String(params.offset))
    const res = await this.get<{ envios: EnvioDomicilio[]; total: number }>(`v1/envios?${searchParams.toString()}`)
    return res.data
  }

  async create(data: {
    paqueteId: string
    clienteNombre: string
    clienteDireccion: string
    clienteTelefono?: string
    tipoTransportista?: string
    transportistaNombre?: string
    costoEnvio?: number
    trackingLocal?: string
    notas?: string
  }) {
    const res = await this.post<{ envio: EnvioDomicilio }>('v1/envios', data)
    return res.data
  }

  async update(id: string, data: Partial<EnvioDomicilio>) {
    const res = await this.patch<{ envio: EnvioDomicilio }>(`v1/envios/${id}`, data)
    return res.data
  }

  async remove(id: string) {
    const token = localStorage.getItem('admin_token') || localStorage.getItem('access_token')
    const raw = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8101/api'
    const baseUrl = raw.replace(/\/+$/, '')
    const url = (baseUrl.endsWith('/api') || /\/api\//.test(baseUrl) ? baseUrl : `${baseUrl}/api`)
    await fetch(`${url}/v1/envios/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
  }

  async buscarPaquetes(q: string) {
    const res = await this.get<{ paquetes: PaqueteSimple[] }>(`v1/envios/buscar-paquetes?q=${encodeURIComponent(q)}`)
    return res.data
  }
}

export const enviosApi = new EnviosAPI()
