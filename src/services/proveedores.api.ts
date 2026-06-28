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

class ProveedoresAPI extends APIBase {
  async list(params?: { q?: string; limit?: number }): Promise<{ proveedores: Proveedor[]; total: number }> {
    const searchParams = new URLSearchParams()
    if (params?.q) searchParams.set('q', params.q)
    if (params?.limit) searchParams.set('limit', String(params.limit))
    const res = await this.get<{ proveedores: Proveedor[]; total: number }>(`v1/proveedores?${searchParams.toString()}`)
    return res.data
  }

  async create(data: { nombre: string; tipo?: string; pais?: string; ciudad?: string; contacto?: string; telefono?: string; email?: string; notas?: string }) {
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
}

export const proveedoresApi = new ProveedoresAPI()
