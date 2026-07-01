import APIBase from './httpBase'

export interface TrayectoPago {
  proveedorId?: string
  proveedorNombre: string
  tracking: string
  costo: number
  pagado: boolean
  fechaPago?: string
  comprobanteUrl: string
  notas: string
}

export interface EnvioDomicilio {
  _id: string
  modo: 'local' | 'interprovincial'
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
  numeroInvoice: string
  ciudadDestino: string
  proveedorUtilizado: string
  valorCobrado: number
  valorPagadoProveedor: number
  guiaUrl: string
  fotoEntregaUrl: string
  firmaUrl: string
  novedad: string
  trayectoUsa: TrayectoPago
  trayectoLocal: TrayectoPago
  estado: 'pendiente' | 'asignado' | 'en_ruta' | 'entregado' | 'fallido'
  evidenciaUrl: string
  notas: string
  creadoPor: { _id: string; name: string; email: string }
  entregadoEn?: string
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
    modo?: 'local' | 'interprovincial'
    clienteNombre: string
    clienteDireccion: string
    clienteTelefono?: string
    numeroInvoice?: string
    ciudadDestino?: string
    proveedorUtilizado?: string
    valorCobrado?: number
    valorPagadoProveedor?: number
    trayectoUsa?: { proveedorId?: string; proveedorNombre?: string; tracking?: string; costo?: number; notas?: string }
    trayectoLocal?: { proveedorId?: string; proveedorNombre?: string; tracking?: string; costo?: number; notas?: string }
    notas?: string
  }) {
    const res = await this.post<{ envio: EnvioDomicilio }>('v1/envios', data)
    return res.data
  }

  async update(id: string, data: Partial<EnvioDomicilio>) {
    const res = await this.patch<{ envio: EnvioDomicilio }>(`v1/envios/${id}`, data)
    return res.data
  }

  async marcarPago(id: string, trayecto: 'trayectoUsa' | 'trayectoLocal', pagado: boolean, comprobanteUrl?: string) {
    const res = await this.patch<{ envio: EnvioDomicilio }>(`v1/envios/${id}/pago`, { trayecto, pagado, comprobanteUrl })
    return res.data
  }

  async uploadArchivo(id: string, tipo: 'foto' | 'firma' | 'guia', file: File) {
    const form = new FormData()
    form.append('tipo', tipo)
    form.append('file', file)
    const res = await this.post<{ envio: EnvioDomicilio; upload: { url: string; publicId: string } }>(`v1/envios/${id}/upload`, form)
    return res.data
  }

  async remove(id: string) {
    await this.delete(`v1/envios/${id}`)
  }

  async buscarPaquetes(q: string) {
    const res = await this.get<{ paquetes: PaqueteSimple[] }>(`v1/envios/buscar-paquetes?q=${encodeURIComponent(q)}`)
    return res.data
  }

  async buscarClientes(q: string): Promise<{ clientes: { clientName: string; clientEmail?: string; clientPhone?: string; lastOrderDate: string }[] }> {
    const res = await this.get<{ clientes: { clientName: string; clientEmail?: string; clientPhone?: string; lastOrderDate: string }[] }>(`v1/envios/buscar-clientes?q=${encodeURIComponent(q)}`)
    return res.data
  }
}

export const enviosApi = new EnviosAPI()
