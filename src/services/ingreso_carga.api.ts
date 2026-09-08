import APIBase from './httpBase'

/**
 * Ingreso de carga: el manifiesto por vuelo que la bodega arma en Excel, una
 * fila por caja. Previsualizar y aplicar mandan el mismo archivo; la diferencia
 * es que aplicar escribe clientes y paquetes.
 */

export type AccionFila = 'existente' | 'alias' | 'aproximado' | 'creado' | 'vinculado' | 'sin_cliente' | 'omitido' | 'error'

export interface SugerenciaCliente {
  masterId: string
  nombreOficial: string
  casillero: string
  score: number
}

/** Lo que el operador decide a mano para una caja desde la previsualización. */
export interface Decision {
  masterClienteId?: string
  crearNuevo?: boolean
}
export type Decisiones = Record<string, Decision>

export interface FilaIngreso {
  fila: number
  wr: string
  mg: string
  fechaIngreso: string | null
  /** Tal cual está escrito en el manifiesto. */
  cliente: string
  /** El cliente al que quedó (o quedará) colgada la caja. */
  clienteNombreOficial: string
  casillero: string
  agencia: string
  contenido: string
  pesoLb: number
  tracking: string
  accion: AccionFila
  score?: number
  coincideCon?: string
  paquete?: 'nuevo' | 'actualizado'
  detalle?: string
  /** Parecidos para vincular a mano cuando el nombre no cuadró solo. */
  sugerencias?: SugerenciaCliente[]
}

export interface ResultadoIngreso {
  aplicado: boolean
  totalFilas: number
  clientesExistentes: number
  clientesCreados: number
  aproximados: number
  vinculados: number
  sinCliente: number
  paquetesNuevos: number
  paquetesActualizados: number
  omitidos: number
  errores: string[]
  filas: FilaIngreso[]
}

class IngresoCargaAPI extends APIBase {
  private async enviar(file: File, aplicar: boolean, decisiones: Decisiones = {}): Promise<ResultadoIngreso> {
    const form = new FormData()
    form.append('file', file)
    if (Object.keys(decisiones).length) form.append('decisiones', JSON.stringify(decisiones))
    // Un manifiesto grande resuelve cientos de nombres contra toda la base.
    const res = await this.post<ResultadoIngreso>(
      `v1/etl/ingreso-carga${aplicar ? '?aplicar=1' : ''}`,
      form,
      undefined,
      { timeout: 120000 },
    )
    return res.data
  }

  previsualizar(file: File) {
    return this.enviar(file, false)
  }

  aplicar(file: File, decisiones: Decisiones = {}) {
    return this.enviar(file, true, decisiones)
  }
}

export const ingresoCargaApi = new IngresoCargaAPI()
export default ingresoCargaApi
