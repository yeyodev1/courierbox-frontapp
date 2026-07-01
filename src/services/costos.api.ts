import APIBase from './httpBase'

export interface GastoAuditUser {
  _id: string
  name: string
  email: string
}

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
  numeroFactura: string
  fechaFactura?: string
  libras: number
  valorPorLibra: number
  valorTotal: number
  valorPagado: number
  paqueteId?: string
  creadoPor: GastoAuditUser | string
  updatedBy?: GastoAuditUser | string | null
  createdAt: string
  updatedAt: string
}

export interface CostosResumen {
  total: { total: number; facturas: number; libras: number }
  porTipo: Array<{ _id: string; total: number; facturas: number; libras: number }>
  porMes: Array<{ _id: string; total: number; facturas: number; libras: number }>
  porCategoria: Array<{ _id: string; total: number; facturas: number }>
  porProveedor: Array<{ _id: string; total: number; facturas: number }>
}

export const CATEGORIAS_POR_TIPO: Record<string, string[]> = {
  operacional: [
    'IMPORTACIONES',
    'EXPORTACIONES',
    'TRANSPORTE',
    'COMBUSTIBLE',
    'GASTOS FIJOS',
    'GASTOS VARIABLES',
    'GASTOS EVENTUALES',
    'ADELANTOS',
    'ALIMENTOS',
    'INSUMOS BASICOS',
  ],
  logistico: [
    'IMPORTACIONES',
    'EXPORTACIONES',
    'TRANSPORTE',
    'COMBUSTIBLE',
    'GASTOS FIJOS',
    'GASTOS VARIABLES',
    'GASTOS EVENTUALES',
    'ADELANTOS',
    'ALIMENTOS',
    'INSUMOS BASICOS',
  ],
  envio: [
    'TRANSPORTE',
    'COMBUSTIBLE',
    'GASTOS FIJOS',
    'GASTOS VARIABLES',
    'GASTOS EVENTUALES',
    'ADELANTOS',
    'ALIMENTOS',
    'INSUMOS BASICOS',
    'DEVOLUCIONES',
  ],
}

class CostosAPI extends APIBase {
  async list(params?: { tipo?: string; categoria?: string; proveedor?: string; desde?: string; hasta?: string; limit?: number; offset?: number }) {
    const searchParams = new URLSearchParams()
    if (params?.tipo) searchParams.set('tipo', params.tipo)
    if (params?.categoria) searchParams.set('categoria', params.categoria)
    if (params?.proveedor) searchParams.set('proveedor', params.proveedor)
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
    numeroFactura?: string
    fechaFactura?: string
    libras?: number
    valorPorLibra?: number
    valorTotal?: number
    valorPagado?: number
  }) {
    const res = await this.post<{ gasto: Gasto }>('v1/costos', data)
    return res.data
  }

  async uploadFactura(id: string, file: File) {
    const form = new FormData()
    form.append('file', file)
    const res = await this.post<{ gasto: Gasto; upload: { url: string; publicId: string } }>(`v1/costos/${id}/upload`, form)
    return res.data
  }

  async resumen(params?: { tipo?: string; categoria?: string; proveedor?: string; desde?: string; hasta?: string }): Promise<{ resumen: CostosResumen }> {
    const searchParams = new URLSearchParams()
    if (params?.tipo) searchParams.set('tipo', params.tipo)
    if (params?.categoria) searchParams.set('categoria', params.categoria)
    if (params?.proveedor) searchParams.set('proveedor', params.proveedor)
    if (params?.desde) searchParams.set('desde', params.desde)
    if (params?.hasta) searchParams.set('hasta', params.hasta)
    const res = await this.get<{ resumen: CostosResumen }>(`v1/costos/resumen?${searchParams.toString()}`)
    return res.data
  }

  async update(id: string, data: Partial<Gasto>) {
    const res = await this.patch<{ gasto: Gasto }>(`v1/costos/${id}`, data)
    return res.data
  }

  async remove(id: string) {
    await this.delete(`v1/costos/${id}`)
  }
}

export const costosApi = new CostosAPI()
