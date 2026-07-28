import APIBase from './httpBase'

interface AsesorInfo {
  _id: string
  name: string
  email: string
}

export interface Contacto {
  _id: string
  clientName: string
  clientEmail?: string
  clientPhone?: string
  totalOrders: number
  totalAmount: number
  lastOrderDate: string
  firstOrderDate: string
  asesores: AsesorInfo[]
  sources?: Array<'legacy' | 'gestion'>
}

export interface ContactoOrder {
  _id: string
  source: 'legacy' | 'gestion'
  historical: boolean
  asesorId?: AsesorInfo | string
  storeName: string
  description: string
  totalAmount: number
  serviceType: string
  status: string
  paymentStatus?: string
  auditLog?: Array<{ timestamp: string; action: string; userName: string; notes?: string }>
  createdAt: string
}

export interface ContactoDetail {
  contacto: {
    clientName: string
    clientEmail?: string
    clientPhone?: string
    totalOrders: number
    firstOrderDate: string
    lastOrderDate: string
    asesores?: AsesorInfo[]
  }
  orders: ContactoOrder[]
}

class ContactosAPI extends APIBase {
  async list(params: { q?: string; limit?: number; offset?: number }): Promise<{ contactos: Contacto[]; total: number }> {
    const query = new URLSearchParams()
    if (params.q) query.set('q', params.q)
    if (params.limit) query.set('limit', String(params.limit))
    if (params.offset) query.set('offset', String(params.offset))
    const res = await this.get<{ contactos: Contacto[]; total: number }>(`v1/contactos?${query.toString()}`)
    return res.data
  }

  async getDetail(name: string, email?: string, phone?: string): Promise<ContactoDetail> {
    const query = new URLSearchParams({ name })
    if (email) query.set('email', email)
    if (phone) query.set('phone', phone)
    const res = await this.get<ContactoDetail>(`v1/contactos/detail?${query.toString()}`)
    return res.data
  }
}

export const contactosApi = new ContactosAPI()
