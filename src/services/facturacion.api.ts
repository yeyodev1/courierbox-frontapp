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

/** A quién se factura: los datos del cliente o un alterno (empresa, familiar…). */
export interface PerfilFacturacion {
  id: string
  etiqueta: string
  identificacion: string
  razonSocial: string
  email: string
  telefono: string
  direccion: string
  principal: boolean
}

export type DatosPerfil = Omit<PerfilFacturacion, 'id' | 'principal'>

export interface FacturaHistorial {
  _id: string
  numeroFactura: string
  estadoSri: EstadoSri
  autorizacionSri: string
  mensajeSri: string
  pdfUrl: string
  xmlUrl: string
  totalGeneral: number
  pesoTotalLb: number
  estado: 'pendiente' | 'verificando' | 'pagada' | 'cancelada'
  facturadoA?: { perfilId: string; identificacion: string; razonSocial: string; email: string }
  masterClienteId?: { _id: string; nombreOficial: string; codigoCasillero: string } | null
  paquetes: Array<{ _id: string; wr: string; sh: string; contenido: string; pesoLb: number }>
  createdAt: string
}

export interface ValidacionFactura {
  cliente: ClienteFacturable
  perfilId: string
  perfiles: PerfilFacturacion[]
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
  /** Fracción (0.15) para las cuentas. */
  iva: number
  /** Porcentaje (15) para mostrar; el que se guarda de forma global. */
  ivaPorcentaje?: number
}

export interface ConfiguracionFacturacion {
  ivaPorcentaje: number
  ivaOpciones: number[]
  tarifas: Tarifas
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
  async validar(paqueteIds: string[], perfilId?: string) {
    const res = await this.post<ValidacionFactura>('v1/facturacion/validar', { paqueteIds, perfilId })
    return res.data
  }

  async perfiles(clienteId: string) {
    const res = await this.get<{ perfiles: PerfilFacturacion[] }>(`v1/facturacion/cliente/${clienteId}/perfiles`)
    return res.data.perfiles
  }

  /** `perfilId` vacío crea uno nuevo; 'principal' edita los datos del cliente. */
  async guardarPerfil(clienteId: string, perfilId: string | null, datos: Partial<DatosPerfil>) {
    const res = perfilId
      ? await this.put<{ perfil: PerfilFacturacion; perfiles: PerfilFacturacion[] }>(`v1/facturacion/cliente/${clienteId}/perfiles/${perfilId}`, datos)
      : await this.post<{ perfil: PerfilFacturacion; perfiles: PerfilFacturacion[] }>(`v1/facturacion/cliente/${clienteId}/perfiles`, datos)
    return res.data
  }

  async eliminarPerfil(clienteId: string, perfilId: string) {
    const res = await this.delete<{ perfiles: PerfilFacturacion[] }>(`v1/facturacion/cliente/${clienteId}/perfiles/${perfilId}`)
    return res.data.perfiles
  }

  async completarCliente(id: string, datos: Partial<Omit<ClienteFacturable, 'id' | 'codigoCasillero'>>) {
    const res = await this.patch<{ cliente: ClienteFacturable }>(`v1/facturacion/cliente/${id}`, datos)
    return res.data.cliente
  }

  async generar(paqueteIds: string[], opciones: { consumidorFinal?: boolean; perfilId?: string } = {}) {
    // Contifico firma y manda al SRI en la misma llamada; necesita más que el timeout por defecto.
    const res = await this.post<{ message: string; facturaId: string; factura: FacturaEmitida }>(
      'v1/facturacion/generar',
      { paqueteIds, ...opciones },
      undefined,
      { timeout: 90000 },
    )
    return res.data
  }

  async configuracion() {
    const res = await this.get<ConfiguracionFacturacion>('v1/facturacion/configuracion')
    return res.data
  }

  /** Cambia el IVA global del flete; aplica a todos y a la próxima factura. */
  async guardarIva(ivaPorcentaje: number) {
    const res = await this.put<{ ivaPorcentaje: number; tarifas: Tarifas }>('v1/facturacion/configuracion', { ivaPorcentaje })
    return res.data
  }

  /** Vuelve a preguntar al SRI (y reenvía si quedó sin enviar). */
  async sincronizarSri(facturaId: string) {
    const res = await this.post<{ factura: FacturaEmitida }>(`v1/facturacion/${facturaId}/sri`, {}, undefined, { timeout: 60000 })
    return res.data.factura
  }

  async historial(q = '', limit = 50) {
    const res = await this.get<{ facturas: FacturaHistorial[] }>(`v1/facturacion/historial?q=${encodeURIComponent(q)}&limit=${limit}`)
    return res.data.facturas
  }
}

export const facturacionApi = new FacturacionAPI()
