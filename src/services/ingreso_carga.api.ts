import APIBase from './httpBase'

/**
 * Ingreso de carga: el manifiesto por vuelo que la bodega arma en Excel, una
 * fila por caja. Previsualizar y aplicar mandan el mismo archivo; la diferencia
 * es que aplicar escribe clientes y paquetes.
 */

export type AccionFila = 'existente' | 'alias' | 'aproximado' | 'creado' | 'sin_cliente' | 'omitido' | 'error'

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
}

export interface ResultadoIngreso {
  aplicado: boolean
  totalFilas: number
  clientesExistentes: number
  clientesCreados: number
  aproximados: number
  sinCliente: number
  paquetesNuevos: number
  paquetesActualizados: number
  omitidos: number
  errores: string[]
  filas: FilaIngreso[]
}

class IngresoCargaAPI extends APIBase {
  private async enviar(file: File, aplicar: boolean): Promise<ResultadoIngreso> {
    const form = new FormData()
    form.append('file', file)
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

  aplicar(file: File) {
    return this.enviar(file, true)
  }
}

export const ingresoCargaApi = new IngresoCargaAPI()
export default ingresoCargaApi
