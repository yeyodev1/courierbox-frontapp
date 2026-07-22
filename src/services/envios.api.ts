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

export interface Motorizado {
  _id: string
  name: string
  email: string
}

export interface EnvioDomicilio {
  _id: string
  modo: 'local' | 'interprovincial'
  paqueteId?: {
    _id: string
    wr: string
    sh: string
    trackingOriginal: string
    contenido: string
  } | null
  clienteNombre: string
  clienteDireccion: string
  clienteTelefono: string
  clienteEmail: string
  asignadoA?: { _id: string; name: string; email: string } | string | null
  asignadoNombre: string
  numeroInvoice: string
  ciudadDestino: string
  proveedorUtilizado: string
  valorCobrado: number
  valorPagadoProveedor: number
  guiaUrl: string
  fotoEntregaUrl: string
  firmaUrl: string
  novedad: string
  recibidoPorNombre: string
  recibidoPorApellido: string
  recibidoPorCedula: string
  recibidoPorContacto: string
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
  async list(params?: { estado?: string; paqueteId?: string; asignadoA?: string; desde?: string; hasta?: string; limit?: number; offset?: number }) {
    const searchParams = new URLSearchParams()
    if (params?.estado) searchParams.set('estado', params.estado)
    if (params?.paqueteId) searchParams.set('paqueteId', params.paqueteId)
    if (params?.asignadoA) searchParams.set('asignadoA', params.asignadoA)
    if (params?.desde) searchParams.set('desde', params.desde)
    if (params?.hasta) searchParams.set('hasta', params.hasta)
    if (params?.limit) searchParams.set('limit', String(params.limit))
    if (params?.offset) searchParams.set('offset', String(params.offset))
    const res = await this.get<{ envios: EnvioDomicilio[]; total: number }>(`v1/envios?${searchParams.toString()}`)
    return res.data
  }

  async getById(id: string) {
    const res = await this.get<{ envio: EnvioDomicilio }>(`v1/envios/${id}`)
    return res.data
  }

  async create(data: {
    paqueteId?: string
    modo?: 'local' | 'interprovincial'
    clienteNombre: string
    clienteDireccion: string
    clienteTelefono?: string
    clienteEmail?: string
    asignadoA?: string
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

  async asignar(id: string, asignadoA: string) {
    const res = await this.patch<{ envio: EnvioDomicilio }>(`v1/envios/${id}/asignar`, { asignadoA })
    return res.data
  }

  async marcarEntregado(id: string, data: { fotoEntregaUrl?: string; firmaUrl?: string; novedad?: string; recibidoPorNombre?: string; recibidoPorApellido?: string; recibidoPorCedula?: string; recibidoPorContacto?: string }) {
    const res = await this.patch<{ envio: EnvioDomicilio }>(`v1/envios/${id}/entregado`, data)
    return res.data
  }

  async listMotorizados() {
    const res = await this.get<{ motorizados: Motorizado[] }>('v1/envios/motorizados')
    return res.data
  }

  async createMotorizado(data: { name: string; email: string; password?: string; sendEmail?: boolean; loginUrl?: string }) {
    const res = await this.post<{ motorizado: Motorizado; password?: string }>('v1/envios/motorizados', data)
    return res.data
  }

  async deleteMotorizado(id: string) {
    await this.delete(`v1/envios/motorizados/${id}`)
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

  async buscarClientes(q: string): Promise<{ clientes: { clientId: string; clientName: string; clientEmail?: string; clientPhone?: string; lastOrderDate: string }[] }> {
    const res = await this.get<{ clientes: { clientId: string; clientName: string; clientEmail?: string; clientPhone?: string; lastOrderDate: string }[] }>(`v1/envios/buscar-clientes?q=${encodeURIComponent(q)}`)
    return res.data
  }

  async resumen(params?: { desde?: string; hasta?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.desde) searchParams.set('desde', params.desde)
    if (params?.hasta) searchParams.set('hasta', params.hasta)
    const res = await this.get<{ locales: { total: number; cobrados: number; costo?: number; novedades?: number }, interprovinciales: { total: number; cobrados: number; pagados: number; costo?: number; novedades?: number }, porEstado: Array<{ _id: string; total: number }>, saldo: number }>(`v1/envios/resumen?${searchParams.toString()}`)
    return res.data
  }
}

export const enviosApi = new EnviosAPI()
