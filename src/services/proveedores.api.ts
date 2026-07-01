import APIBase from './httpBase'

export interface Proveedor {
  _id: string
  nombre: string
  tipo: string
  pais: string
  ciudad: string
  contacto: string
  telefono: string
  email: string
  notas: string
  activo: boolean
  createdAt: string
  updatedAt: string
}

export interface ProviderTypesResponse {
  defaultTypes: string[]
  customTypes: string[]
  providerTypes: string[]
}

class ProveedoresAPI extends APIBase {
  async list(params?: { q?: string; limit?: number }): Promise<{ proveedores: Proveedor[]; total: number }> {
    const searchParams = new URLSearchParams()
    if (params?.q) searchParams.set('q', params.q)
    if (params?.limit) searchParams.set('limit', String(params.limit))
    const res = await this.get<{ proveedores: Proveedor[]; total: number }>(`v1/proveedores?${searchParams.toString()}`)
    return res.data
  }

  async create(data: { nombre: string; tipo?: string; pais?: string; ciudad?: string; contacto?: string; telefono?: string; email?: string; notas?: string; activo?: boolean }) {
    const res = await this.post<{ proveedor: Proveedor }>('v1/proveedores', data)
    return res.data
  }

  async update(id: string, data: Partial<Proveedor>) {
    const res = await this.patch<{ proveedor: Proveedor }>(`v1/proveedores/${id}`, data)
    return res.data
  }

  async remove(id: string) {
    await this.delete(`v1/proveedores/${id}`)
  }

  async listTypes(): Promise<ProviderTypesResponse> {
    const res = await this.get<ProviderTypesResponse>('v1/proveedores/tipos')
    return res.data
  }

  async addType(type: string): Promise<ProviderTypesResponse> {
    const res = await this.post<ProviderTypesResponse>('v1/proveedores/tipos', { type })
    return res.data
  }

  async removeType(type: string): Promise<ProviderTypesResponse> {
    const res = await this.delete<ProviderTypesResponse>(`v1/proveedores/tipos/${encodeURIComponent(type)}`)
    return res.data
  }
}

export const proveedoresApi = new ProveedoresAPI()
