import APIBase from './httpBase'
import type { Contacto } from './gestiones_compra.api'

export interface ContactoCbResult {
  contacto: Contacto
  created: boolean
  matchedOn: string[]
}

export interface ContactoCbCreateInput {
  nombre: string
  email?: string
  telefono?: string
  phoneCountryCode?: string
  cedula?: string
  notas?: string
}

class ContactosCbAPI extends APIBase {
  private readonly base = 'v1/contactos-cb'

  async search(q: string, limit = 20): Promise<Contacto[]> {
    const res = await this.get<{ contactos: Contacto[] }>(
      `${this.base}/search?q=${encodeURIComponent(q)}&limit=${limit}`
    )
    return res.data.contactos
  }

  async list(limit = 50, offset = 0): Promise<{ contactos: Contacto[]; total: number }> {
    const res = await this.get<{ contactos: Contacto[]; total: number }>(
      `${this.base}/list?limit=${limit}&offset=${offset}`
    )
    return res.data
  }

  async create(data: ContactoCbCreateInput): Promise<ContactoCbResult> {
    const res = await this.post<ContactoCbResult>(this.base, data)
    return res.data
  }

  async update(id: string, data: Partial<{ nombre: string; email: string; telefono: string; cedula: string; notas: string }>): Promise<Contacto> {
    const res = await this.patch<{ contacto: Contacto }>(`${this.base}/${id}`, data)
    return res.data.contacto
  }
}

export const contactosCbAPI = new ContactosCbAPI()
