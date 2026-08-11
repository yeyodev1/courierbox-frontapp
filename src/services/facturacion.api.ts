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
    codigoCasillero?: string
  } | null
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

  async generar(paqueteIds: string[]) {
    // Contifico is a third-party call; give it room beyond the default timeout.
    const res = await this.post<{ message: string; facturaId: string }>(
      'v1/facturacion/generar',
      { paqueteIds },
      undefined,
      { timeout: 60000 },
    )
    return res.data
  }

  async historial() {
    const res = await this.get<{ facturas: any[] }>('v1/facturacion/historial')
    return res.data.facturas
  }
}

export const facturacionApi = new FacturacionAPI()
