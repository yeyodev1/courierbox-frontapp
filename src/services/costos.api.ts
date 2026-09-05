import APIBase from './httpBase'

export interface GastoAuditUser {
  _id: string
  name: string
  email: string
}

export interface Gasto {
  _id: string
  tipo: GastoTipo
  categoria: string
  monto: number
  descripcion: string
  fecha: string
  proveedor: string
  referencia: string
  comprobanteUrl: string
  comprobantePublicId?: string
  comprobanteResourceType?: string
  numeroFactura: string
  fechaFactura?: string
  libras: number
  valorPorLibra: number
  numeroPaquetes: number
  valorTotal: number
  valorPagado: number
  paqueteId?: string
  creadoPor: GastoAuditUser | string
  updatedBy?: GastoAuditUser | string | null
  createdAt: string
  updatedAt: string
}

/**
 * Cost Centre reads the ledger in three sections. The split is by weight rather
 * than by `tipo`, so an expense filed before the sections existed still lands in
 * the one it belongs to — see the server's `sectionFilter`.
 */
export type CostoSeccion = 'generales' | 'envios' | 'recepciones'

/** `logistico` predates Cost Centre; it has no tab, and is read as a general expense. */
export type GastoTipo = 'operacional' | 'logistico' | 'envio' | 'recepcion'

export interface CostosResumen {
  total: {
    total: number
    pagado: number
    pendiente: number
    conSaldo: number
    facturas: number
    libras: number
    paquetes: number
    costoPorLibra: number
  }
  porTipo: Array<{ _id: string; total: number; facturas: number; libras: number }>
  porMes: Array<{ _id: string; total: number; facturas: number; libras: number }>
  porCategoria: Array<{ _id: string; total: number; facturas: number }>
  porProveedor: Array<{ _id: string; total: number; pendiente: number; facturas: number }>
}

/** Totals for the whole filtered set, so the debt does not shrink with the page. */
export interface CostosSaldos {
  monto: number
  pagado: number
  pendiente: number
  conSaldo: number
}

/**
 * What a record still owes. `valorPagado` was captured from day one and never
 * read back, so the detail card printed "Valor pagado $0.00" and left the
 * subtraction to the operator.
 */
export function saldoPendienteDe(gasto: Pick<Gasto, 'monto' | 'valorTotal' | 'valorPagado'>): number {
  const total = Number(gasto.valorTotal) > 0 ? Number(gasto.valorTotal) : Number(gasto.monto) || 0
  return Math.max(Math.round((total - (Number(gasto.valorPagado) || 0)) * 100) / 100, 0)
}

export const CATEGORIAS_POR_TIPO: Record<string, string[]> = {
  recepcion: [
    'IMPORTACIONES',
    'EXPORTACIONES',
    'CARGA AEREA',
    'CARGA MARITIMA',
  ],
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
  async list(params?: { seccion?: CostoSeccion; tipo?: string; categoria?: string; proveedor?: string; desde?: string; hasta?: string; limit?: number; offset?: number; soloPendientes?: boolean }) {
    const searchParams = new URLSearchParams()
    if (params?.seccion) searchParams.set('seccion', params.seccion)
    if (params?.tipo) searchParams.set('tipo', params.tipo)
    if (params?.categoria) searchParams.set('categoria', params.categoria)
    if (params?.proveedor) searchParams.set('proveedor', params.proveedor)
    if (params?.desde) searchParams.set('desde', params.desde)
    if (params?.hasta) searchParams.set('hasta', params.hasta)
    if (params?.limit) searchParams.set('limit', String(params.limit))
    if (params?.offset) searchParams.set('offset', String(params.offset))
    if (params?.soloPendientes) searchParams.set('soloPendientes', 'true')
    const res = await this.get<{ gastos: Gasto[]; total: number; saldos: CostosSaldos }>(
      `v1/costos?${searchParams.toString()}`,
    )
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
    numeroPaquetes?: number
    valorTotal?: number
    valorPagado?: number
    idempotencyKey?: string
  }) {
    const res = await this.post<{ gasto: Gasto }>('v1/costos', data)
    return res.data
  }

  async uploadFactura(id: string, file: File) {
    const form = new FormData()
    form.append('file', file)
    const res = await this.post<{ gasto: Gasto; upload: { url: string; publicId: string; resourceType: string } }>(`v1/costos/${id}/upload`, form)
    return res.data
  }

  async resumen(params?: { seccion?: CostoSeccion; tipo?: string; categoria?: string; proveedor?: string; desde?: string; hasta?: string }): Promise<{ resumen: CostosResumen }> {
    const searchParams = new URLSearchParams()
    if (params?.seccion) searchParams.set('seccion', params.seccion)
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
