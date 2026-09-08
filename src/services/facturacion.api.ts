import APIBase from './httpBase'

export interface PaqueteFacturable {
  _id: string
  wr: string
  sh: string
  trackingOriginal: string
  contenido: string
  pesoLb: number
  consigneeNombre: string
  consigneeLimpio: string
  estado: string
  masterClienteId?: {
    _id: string
    nombreOficial?: string
    cedulaRuc?: string
    email?: string
    telefono?: string
    direccion?: string
    codigoCasillero?: string
  } | null
}

export type EstadoSri = 'sin_enviar' | 'firmado' | 'enviado' | 'autorizado' | 'rechazado' | 'error' | 'simulado'

export interface DatoFaltante {
  campo: 'cedulaRuc' | 'nombreOficial' | 'email' | 'telefono' | 'direccion'
  mensaje: string
  /** Sin esto el SRI rechaza; lo demás sólo mejora la factura. */
  requerido: boolean
}

export interface ClienteFacturable {
  id: string
  nombreOficial: string
  cedulaRuc: string
  email: string
  telefono: string
  direccion: string
  codigoCasillero: string
}

export interface ValidacionFactura {
  cliente: ClienteFacturable
  totales: TotalesFactura
  faltantes: DatoFaltante[]
  consumidorFinalPosible: boolean
  listo: boolean
  yaFacturados: string[]
}

export interface FacturaEmitida {
  facturaId: string
  numeroFactura: string
  estadoSri: EstadoSri
  autorizacionSri: string
  pdfUrl: string
  xmlUrl: string
  mensajeSri: string
  totalGeneral: number
  clienteNombre: string
}

export interface Tarifas {
  fleteLb: number
  arancelLb: number
  iva: number
}

export interface TotalesFactura {
  pesoTotalLb: number
  totalFlete: number
  totalArancel: number
  subtotal: number
  totalIva: number
  totalGeneral: number
}

/**
 * Mirrors the server's tariff maths so the counter sees totals update as it
 * ticks packages. The server recomputes authoritatively on submit — this is
 * only for the live preview.
 */
export function calcularTotalesLocal(pesos: number[], t: Tarifas): TotalesFactura {
  const pesoTotalLb = pesos.reduce((sum, p) => sum + (Number(p) || 0), 0)
  const totalFlete = Number((pesoTotalLb * t.fleteLb).toFixed(2))
  const totalArancel = Number((pesoTotalLb * t.arancelLb).toFixed(2))
  const subtotal = Number((totalFlete + totalArancel).toFixed(2))
  // IVA applies to the freight line only, matching the Contifico item breakdown.
  const totalIva = Number((totalFlete * t.iva).toFixed(2))
  const totalGeneral = Number((subtotal + totalIva).toFixed(2))
  return { pesoTotalLb, totalFlete, totalArancel, subtotal, totalIva, totalGeneral }
}

class FacturacionAPI extends APIBase {
  async facturables(q: string) {
    const res = await this.get<{ paquetes: PaqueteFacturable[]; tarifas: Tarifas }>(
      `v1/facturacion/facturables?q=${encodeURIComponent(q)}`,
    )
    return res.data
  }

  async preview(paqueteIds: string[]) {
    const res = await this.post<{ totales: TotalesFactura }>('v1/facturacion/preview', { paqueteIds })
    return res.data.totales
  }

  /** Cliente, totales y qué falta, calculado en el servidor con los mismos criterios que la emisión. */
  async validar(paqueteIds: string[]) {
    const res = await this.post<ValidacionFactura>('v1/facturacion/validar', { paqueteIds })
    return res.data
  }

  async completarCliente(id: string, datos: Partial<Omit<ClienteFacturable, 'id' | 'codigoCasillero'>>) {
    const res = await this.patch<{ cliente: ClienteFacturable }>(`v1/facturacion/cliente/${id}`, datos)
    return res.data.cliente
  }

  async generar(paqueteIds: string[], opciones: { consumidorFinal?: boolean } = {}) {
    // Contifico firma y manda al SRI en la misma llamada; necesita más que el timeout por defecto.
    const res = await this.post<{ message: string; facturaId: string; factura: FacturaEmitida }>(
      'v1/facturacion/generar',
      { paqueteIds, ...opciones },
      undefined,
      { timeout: 90000 },
    )
    return res.data
  }

  /** Vuelve a preguntar al SRI (y reenvía si quedó sin enviar). */
  async sincronizarSri(facturaId: string) {
    const res = await this.post<{ factura: FacturaEmitida }>(`v1/facturacion/${facturaId}/sri`, {}, undefined, { timeout: 60000 })
    return res.data.factura
  }

  async historial() {
    const res = await this.get<{ facturas: any[] }>('v1/facturacion/historial')
    return res.data.facturas
  }
}

export const facturacionApi = new FacturacionAPI()
