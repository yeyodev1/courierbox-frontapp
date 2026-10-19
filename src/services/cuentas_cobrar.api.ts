import APIBase from './httpBase'

export type TipoCuentaCobrar = 'courier' | 'venta' | 'gdc' | 'otros'
export type EstadoCuentaCobrar = 'pendiente' | 'abonado' | 'atrasado' | 'pagado'

export interface AbonoCuentaCobrar {
  _id: string
  fecha: string
  monto: number
  nota: string
  registradoPor: string
  createdAt: string
}

/** Una línea de la libreta de cuentas por cobrar general. Saldo y estado los calcula el backend. */
export interface CuentaCobrar {
  _id: string
  cliente: string
  tipo: TipoCuentaCobrar
  monto: number
  fechaPago: string
  fechaCobro: string
  asesor: string
  notas: string
  abonos: AbonoCuentaCobrar[]
  abonado: number
  saldo: number
  estado: EstadoCuentaCobrar
  creadoPor: string
  actualizadoPor: string
  createdAt: string
  updatedAt: string
}

export type CuentaCobrarForm = Partial<Pick<CuentaCobrar, 'cliente' | 'tipo' | 'monto' | 'fechaPago' | 'fechaCobro' | 'asesor' | 'notas'>>

export interface AlertasCobro {
  activo: boolean
  destinatarios: string[]
}

class CuentasCobrarAPI extends APIBase {
  async listar() {
    const res = await this.get<{ cuentas: CuentaCobrar[] }>('v1/cuentas-cobrar')
    return res.data.cuentas
  }

  async crear(datos: CuentaCobrarForm) {
    const res = await this.post<{ cuenta: CuentaCobrar }>('v1/cuentas-cobrar', datos)
    return res.data.cuenta
  }

  async actualizar(id: string, datos: CuentaCobrarForm) {
    const res = await this.put<{ cuenta: CuentaCobrar }>(`v1/cuentas-cobrar/${id}`, datos)
    return res.data.cuenta
  }

  async eliminar(id: string) {
    await this.delete(`v1/cuentas-cobrar/${id}`)
  }

  async abonar(id: string, datos: { monto: number; fecha: string; nota: string }) {
    const res = await this.post<{ cuenta: CuentaCobrar }>(`v1/cuentas-cobrar/${id}/abonos`, datos)
    return res.data.cuenta
  }

  async eliminarAbono(id: string, abonoId: string) {
    const res = await this.delete<{ cuenta: CuentaCobrar }>(`v1/cuentas-cobrar/${id}/abonos/${abonoId}`)
    return res.data.cuenta
  }

  async alertas() {
    const res = await this.get<{ alertas: AlertasCobro }>('v1/cuentas-cobrar/alertas')
    return res.data.alertas
  }

  async guardarAlertas(datos: AlertasCobro) {
    const res = await this.put<{ alertas: AlertasCobro }>('v1/cuentas-cobrar/alertas', datos)
    return res.data.alertas
  }

  async enviarResumen() {
    const res = await this.post<{ enviado: boolean; destinatarios?: string[]; cuentas?: number }>('v1/cuentas-cobrar/alertas/enviar', {})
    return res.data
  }
}

export const cuentasCobrarApi = new CuentasCobrarAPI()
