import APIBase from './httpBase'

export interface Gasto {
  _id: string
  tipo: 'operacional' | 'logistico' | 'envio'
  categoria: string
  monto: number
  descripcion: string
  fecha: string
  proveedor: string
  referencia: string
  comprobanteUrl: string
  paqueteId?: string
  creadoPor: { _id: string; name: string; email: string }
  createdAt: string
  updatedAt: string
}

export const CATEGORIAS_POR_TIPO: Record<string, string[]> = {
  operacional: [
    'Renta',
    'Salarios',
    'Servicios Básicos',
    'Marketing',
    'Suministros',
    'Seguros',
    'Impuestos',
  ],
  logistico: [
    'Almacenaje',
    'Reempaque',
    'Embalaje',
    'Flete Internacional',
    'Seguro Carga',
    'Manipuleo',
  ],
  envio: [
    'Combustible',
    'Peajes',
    'Transportista Externo',
    'Mantenimiento Vehículos',
    'Mensajería Local',
  ],
}

class CostosAPI extends APIBase {
  async list(params?: { tipo?: string; categoria?: string; desde?: string; hasta?: string; limit?: number; offset?: number }) {
    const searchParams = new URLSearchParams()
    if (params?.tipo) searchParams.set('tipo', params.tipo)
    if (params?.categoria) searchParams.set('categoria', params.categoria)
    if (params?.desde) searchParams.set('desde', params.desde)
    if (params?.hasta) searchParams.set('hasta', params.hasta)
    if (params?.limit) searchParams.set('limit', String(params.limit))
    if (params?.offset) searchParams.set('offset', String(params.offset))
    const res = await this.get<{ gastos: Gasto[]; total: number }>(`v1/costos?${searchParams.toString()}`)
    return res.data
  }

  async create(data: {
    tipo: string
    categoria: string
    monto: number
    descripcion: string
    fecha?: string
    proveedor?: string
    referencia?: string
    paqueteId?: string
  }) {
    const res = await this.post<{ gasto: Gasto }>('v1/costos', data)
    return res.data
  }

  async update(id: string, data: Partial<Gasto>) {
    const res = await this.patch<{ gasto: Gasto }>(`v1/costos/${id}`, data)
    return res.data
  }

  async remove(id: string) {
    const token = localStorage.getItem('admin_token') || localStorage.getItem('access_token')
    const raw = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8101/api'
    const baseUrl = raw.replace(/\/+$/, '')
    const url = (baseUrl.endsWith('/api') || /\/api\//.test(baseUrl) ? baseUrl : `${baseUrl}/api`)
    await fetch(`${url}/v1/costos/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
  }
}

export const costosApi = new CostosAPI()
