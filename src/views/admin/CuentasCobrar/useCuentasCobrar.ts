import { computed, reactive, ref } from 'vue'
import {
  cuentasCobrarApi,
  type CuentaCobrar,
  type CuentaCobrarForm,
  type EstadoCuentaCobrar,
  type TipoCuentaCobrar,
} from '@/services/cuentas_cobrar.api'
import { useToastStore } from '@/stores/toast.store'

export const TIPOS: { valor: TipoCuentaCobrar; etiqueta: string }[] = [
  { valor: 'courier', etiqueta: 'Courier' },
  { valor: 'venta', etiqueta: 'Venta' },
  { valor: 'gdc', etiqueta: 'GDC' },
  { valor: 'otros', etiqueta: 'Otros' },
]

export const ESTADOS: Record<EstadoCuentaCobrar, string> = {
  pendiente: 'Pendiente',
  abonado: 'Abonado',
  atrasado: 'Atrasado',
  pagado: 'Pagado',
}

export type FiltroEstado = 'porCobrar' | 'atrasado' | 'pagado' | 'todas'

export const hoyEcuador = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' })

export function sumarDias(iso: string, dias: number) {
  const [y, m, d] = iso.split('-').map(Number)
  const f = new Date(Date.UTC(y!, m! - 1, d! + dias))
  return f.toISOString().slice(0, 10)
}

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
export const dinero = (n: number) => usd.format(Number(n) || 0)

/**
 * Lee un monto escrito a mano: "1.500,25", "1,500.25", "1500.5" o "$ 80".
 * El separador decimal es el último punto o coma seguido de 1 o 2 dígitos;
 * los demás son de miles.
 */
export function leerMonto(v: string): number {
  let s = String(v).replace(/[^\d.,-]/g, '')
  if (!s) return NaN
  const dec = Math.max(s.lastIndexOf(','), s.lastIndexOf('.'))
  const decimales = dec >= 0 ? s.length - dec - 1 : 0
  s = decimales >= 1 && decimales <= 2 ? `${s.slice(0, dec).replace(/[.,]/g, '')}.${s.slice(dec + 1)}` : s.replace(/[.,]/g, '')
  return Number(s)
}

export const errorDe = (e: any, fallback: string) => e?.message || e?.data?.error || fallback

/**
 * Estado de la pantalla de cuentas por cobrar general: la lista, los filtros,
 * los totales y el guardado celda por celda (como una hoja de Excel).
 */
export function useCuentasCobrar() {
  const toast = useToastStore()
  const cuentas = ref<CuentaCobrar[]>([])
  const cargando = ref(true)
  const errorCarga = ref('')
  /** Celdas guardándose ahora: `${id}:${campo}`. */
  const guardando = reactive(new Set<string>())
  /** La fila recién creada, para resaltarla un momento. */
  const recien = ref<string | null>(null)

  const filtros = reactive({ texto: '', tipo: '' as TipoCuentaCobrar | '', estado: 'porCobrar' as FiltroEstado, asesor: '' })

  async function cargar() {
    cargando.value = true
    errorCarga.value = ''
    try {
      cuentas.value = await cuentasCobrarApi.listar()
    } catch (e) {
      errorCarga.value = errorDe(e, 'No se pudieron cargar las cuentas.')
    } finally {
      cargando.value = false
    }
  }

  function reemplazar(c: CuentaCobrar) {
    const i = cuentas.value.findIndex((x) => x._id === c._id)
    if (i >= 0) cuentas.value.splice(i, 1, c)
    else cuentas.value.unshift(c)
  }

  async function crear(datos: CuentaCobrarForm) {
    const c = await cuentasCobrarApi.crear(datos)
    cuentas.value.unshift(c)
    recien.value = c._id
    setTimeout(() => recien.value === c._id && (recien.value = null), 2400)
    toast.showNotification(`Cuenta de ${c.cliente} por ${dinero(c.monto)} agregada.`, 'success')
    return c
  }

  /** Guarda una celda. Si el backend la rechaza, la fila vuelve a como estaba. */
  async function guardarCampo<K extends keyof CuentaCobrarForm>(c: CuentaCobrar, campo: K, valor: CuentaCobrarForm[K]) {
    if ((c as any)[campo] === valor) return
    const clave = `${c._id}:${campo}`
    const antes = { ...c }
    ;(c as any)[campo] = valor
    guardando.add(clave)
    try {
      reemplazar(await cuentasCobrarApi.actualizar(c._id, { [campo]: valor }))
    } catch (e) {
      reemplazar(antes)
      toast.showNotification(errorDe(e, 'No se pudo guardar el cambio.'), 'error')
    } finally {
      guardando.delete(clave)
    }
  }

  async function eliminar(c: CuentaCobrar) {
    await cuentasCobrarApi.eliminar(c._id)
    cuentas.value = cuentas.value.filter((x) => x._id !== c._id)
    toast.showNotification(`Se eliminó la cuenta de ${c.cliente}.`, 'success')
  }

  async function abonar(c: CuentaCobrar, datos: { monto: number; fecha: string; nota: string }) {
    const actualizada = await cuentasCobrarApi.abonar(c._id, datos)
    reemplazar(actualizada)
    toast.showNotification(
      actualizada.estado === 'pagado' ? `${c.cliente} quedó pagado.` : `Abono de ${dinero(datos.monto)} registrado. Saldo: ${dinero(actualizada.saldo)}.`,
      'success',
    )
    return actualizada
  }

  async function quitarAbono(c: CuentaCobrar, abonoId: string) {
    const actualizada = await cuentasCobrarApi.eliminarAbono(c._id, abonoId)
    reemplazar(actualizada)
    toast.showNotification('Abono eliminado.', 'success')
    return actualizada
  }

  const asesores = computed(() => [...new Set(cuentas.value.map((c) => c.asesor).filter(Boolean))].sort())
  const clientes = computed(() => [...new Set(cuentas.value.map((c) => c.cliente).filter(Boolean))].sort())

  const visibles = computed(() => {
    const q = filtros.texto.trim().toLowerCase()
    return cuentas.value
      .filter((c) => {
        if (filtros.tipo && c.tipo !== filtros.tipo) return false
        if (filtros.asesor && c.asesor !== filtros.asesor) return false
        if (filtros.estado === 'porCobrar' && c.estado === 'pagado') return false
        if (filtros.estado === 'atrasado' && c.estado !== 'atrasado') return false
        if (filtros.estado === 'pagado' && c.estado !== 'pagado') return false
        if (q && !`${c.cliente} ${c.asesor} ${c.notas}`.toLowerCase().includes(q)) return false
        return true
      })
      .sort((a, b) => {
        // Atrasadas primero, luego por fecha de pago (sin fecha al final), pagadas al fondo.
        const peso = (c: CuentaCobrar) => (c.estado === 'atrasado' ? 0 : c.estado === 'pagado' ? 2 : 1)
        if (peso(a) !== peso(b)) return peso(a) - peso(b)
        return (a.fechaPago || '9999') < (b.fechaPago || '9999') ? -1 : (a.fechaPago || '9999') > (b.fechaPago || '9999') ? 1 : 0
      })
  })

  const totales = computed(() => {
    const hoy = hoyEcuador()
    const en7 = sumarDias(hoy, 7)
    const mes = hoy.slice(0, 7)
    const conSaldo = cuentas.value.filter((c) => c.saldo > 0)
    const atrasadas = conSaldo.filter((c) => c.estado === 'atrasado')
    const semana = conSaldo.filter((c) => {
      const f = c.fechaCobro || c.fechaPago
      return !!f && f >= hoy && f <= en7
    })
    return {
      porCobrar: conSaldo.reduce((s, c) => s + c.saldo, 0),
      cuentasAbiertas: conSaldo.length,
      atrasado: atrasadas.reduce((s, c) => s + c.saldo, 0),
      cuentasAtrasadas: atrasadas.length,
      semana: semana.reduce((s, c) => s + c.saldo, 0),
      cuentasSemana: semana.length,
      cobradoMes: cuentas.value.flatMap((c) => c.abonos).filter((a) => a.fecha.startsWith(mes)).reduce((s, a) => s + a.monto, 0),
      cobrarHoy: conSaldo.filter((c) => c.fechaCobro === hoy).length,
    }
  })

  function exportarCsv() {
    const tipo = (t: string) => TIPOS.find((x) => x.valor === t)?.etiqueta ?? t
    const filas = [
      ['Cliente', 'Tipo', 'Monto', 'Abonado', 'Saldo', 'Fecha de pago', 'Fecha de cobro', 'Estado', 'Asesor', 'Notas'],
      ...visibles.value.map((c) => [
        c.cliente,
        tipo(c.tipo),
        c.monto.toFixed(2),
        c.abonado.toFixed(2),
        c.saldo.toFixed(2),
        c.fechaPago,
        c.fechaCobro,
        ESTADOS[c.estado],
        c.asesor,
        c.notas,
      ]),
    ]
    const csv = filas.map((f) => f.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n')
    // BOM para que Excel abra bien las tildes.
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: `cuentas-por-cobrar-${hoyEcuador()}.csv` })
    a.click()
    URL.revokeObjectURL(url)
  }

  return {
    cuentas,
    cargando,
    errorCarga,
    guardando,
    recien,
    filtros,
    visibles,
    totales,
    asesores,
    clientes,
    cargar,
    crear,
    guardarCampo,
    eliminar,
    abonar,
    quitarAbono,
    exportarCsv,
  }
}
