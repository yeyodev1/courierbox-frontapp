import APIBase from './httpBase'

/** Courier Box o un courier aliado: cómo sale su etiqueta y si tiene tarifa propia. */
export interface Aliado {
  _id: string
  codigo: string
  nombre: string
  marca: string
  logoUrl: string
  pie: string[]
  lema: string
  barrasAbajo: boolean
  rotuloTracking: string
  /** Textos de la columna AGENCIA del manifiesto que lo identifican. */
  coincidencias: string[]
  /** null = la tarifa base de Courier Box. */
  tarifaFleteLb: number | null
  tarifaArancelLb: number | null
  principal: boolean
  activo: boolean
  orden: number
}

export type AliadoForm = Partial<Omit<Aliado, '_id' | 'tarifaFleteLb' | 'tarifaArancelLb'>> & {
  /** Texto del input: vacío vuelve a la tarifa base. */
  tarifaFleteLb?: number | string | null
  tarifaArancelLb?: number | string | null
}

class AliadosAPI extends APIBase {
  async listar() {
    const res = await this.get<{ aliados: Aliado[] }>('v1/aliados')
    return res.data.aliados
  }

  async crear(datos: AliadoForm) {
    const res = await this.post<{ aliado: Aliado }>('v1/aliados', datos)
    return res.data.aliado
  }

  async actualizar(id: string, datos: AliadoForm) {
    const res = await this.put<{ aliado: Aliado }>(`v1/aliados/${id}`, datos)
    return res.data.aliado
  }

  async subirLogo(id: string, archivo: File) {
    const fd = new FormData()
    fd.append('logo', archivo)
    const res = await this.post<{ aliado: Aliado }>(`v1/aliados/${id}/logo`, fd)
    return res.data.aliado
  }
}

export const aliadosApi = new AliadosAPI()
