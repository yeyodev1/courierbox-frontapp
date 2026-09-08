import { computed, ref, watch } from 'vue'
import {
  ingresoCargaApi,
  type AccionFila,
  type Decisiones,
  type FilaIngreso,
  type ResultadoIngreso,
  type SugerenciaCliente,
} from '@/services/ingreso_carga.api'
import type { ClienteMaster } from '@/services/homologacion.api'
import { useToastStore } from '@/stores/toast.store'

/** Cómo se ve cada resultado en pantalla: texto y tono. */
export const ACCION_UI: Record<AccionFila, { label: string; tono: 'ok' | 'aviso' | 'nuevo' | 'neutro' | 'error' }> = {
  existente: { label: 'Cliente existente', tono: 'ok' },
  alias: { label: 'Cliente existente', tono: 'ok' },
  aproximado: { label: 'Parecido', tono: 'aviso' },
  creado: { label: 'Cliente nuevo', tono: 'nuevo' },
  vinculado: { label: 'Vinculado a mano', tono: 'ok' },
  sin_cliente: { label: 'Sin cliente', tono: 'neutro' },
  omitido: { label: 'Sin cambios', tono: 'neutro' },
  error: { label: 'Error', tono: 'error' },
}

export function etiquetaAccion(fila: FilaIngreso, aplicado: boolean): string {
  if (fila.accion === 'creado') return aplicado ? 'Cliente creado' : 'Se creará'
  if (fila.accion === 'aproximado' && fila.score !== undefined) return `Parecido ${Math.round(fila.score * 100)}%`
  return ACCION_UI[fila.accion].label
}

/** Las filas donde el operador puede decidir a mano a quién pertenece la caja. */
export function sePuedeVincular(fila: FilaIngreso): boolean {
  return ['creado', 'aproximado', 'vinculado', 'sin_cliente'].includes(fila.accion)
}

export function sugerenciaToCliente(s: SugerenciaCliente): ClienteMaster {
  return { _id: s.masterId, nombreOficial: s.nombreOficial, codigoCasillero: s.casillero }
}

/**
 * Elegir el archivo dispara la previsualización sola: el operador ve qué
 * clientes se van a crear y cuáles ya existen antes de confirmar nada. Lo que
 * decide a mano en una fila se aplica localmente al instante (pill, contadores)
 * y viaja con el archivo al confirmar; el servidor lo honra sobre su propio
 * emparejamiento.
 */
export function useIngresoCarga() {
  const toast = useToastStore()

  const archivo = ref<File | null>(null)
  const previsualizacion = ref<ResultadoIngreso | null>(null)
  const resultado = ref<ResultadoIngreso | null>(null)
  const cargando = ref(false)
  const aplicando = ref(false)
  const errorArchivo = ref('')

  const decisiones = ref<Decisiones>({})
  /** La fila abierta en el modal de vincular. */
  const filaEnEdicion = ref<FilaIngreso | null>(null)
  /** El WR que acaba de cambiar, para resaltarlo un instante. */
  const recienCambiada = ref<string | null>(null)
  const confirmando = ref(false)

  const vista = computed(() => resultado.value ?? previsualizacion.value)
  const aplicado = computed(() => !!resultado.value)
  const puedeAplicar = computed(
    () => !!archivo.value && !!previsualizacion.value && !resultado.value && !cargando.value && !aplicando.value,
  )

  /**
   * Los contadores salen de las filas y no del servidor, para que una decisión
   * a mano se refleje sin volver a subir el archivo. Un mismo nombre nuevo
   * repetido cuenta una vez, igual que en el servidor.
   */
  const resumen = computed(() => {
    const v = vista.value
    const filas = v?.filas ?? []
    const nombresNuevos = new Set<string>()
    let existentes = 0
    let aproximados = 0
    let vinculados = 0
    let sinCliente = 0
    let nuevos = 0
    let actualizados = 0
    for (const f of filas) {
      if (f.accion === 'existente' || f.accion === 'alias') existentes++
      else if (f.accion === 'aproximado') aproximados++
      else if (f.accion === 'vinculado') vinculados++
      else if (f.accion === 'creado') nombresNuevos.add(f.clienteNombreOficial.toUpperCase())
      else if (f.accion === 'sin_cliente') sinCliente++
      if (f.paquete === 'nuevo') nuevos++
      else if (f.paquete === 'actualizado') actualizados++
    }
    return {
      totalFilas: v?.totalFilas ?? 0,
      clientesExistentes: existentes,
      clientesCreados: nombresNuevos.size,
      aproximados,
      vinculados,
      sinCliente,
      paquetesNuevos: nuevos,
      paquetesActualizados: actualizados,
      cajas: nuevos + actualizados,
      errores: v?.errores ?? [],
    }
  })

  function fail(error: unknown, fallback: string) {
    const e = error as { data?: { error?: string }; message?: string }
    const mensaje = e?.data?.error || e?.message || fallback
    toast.showNotification(mensaje, 'error')
    return mensaje
  }

  async function previsualizar() {
    if (!archivo.value) return
    cargando.value = true
    errorArchivo.value = ''
    resultado.value = null
    decisiones.value = {}
    try {
      previsualizacion.value = await ingresoCargaApi.previsualizar(archivo.value)
    } catch (error) {
      previsualizacion.value = null
      errorArchivo.value = fail(error, 'No se pudo leer el archivo')
    } finally {
      cargando.value = false
    }
  }

  let resaltadoTimer: number | undefined
  function resaltar(wr: string) {
    recienCambiada.value = wr
    window.clearTimeout(resaltadoTimer)
    resaltadoTimer = window.setTimeout(() => {
      if (recienCambiada.value === wr) recienCambiada.value = null
    }, 1400)
  }

  function abrirVincular(fila: FilaIngreso) {
    filaEnEdicion.value = fila
  }

  function cerrarVincular() {
    filaEnEdicion.value = null
  }

  /** El operador eligió un cliente para esa caja. */
  function vincular(fila: FilaIngreso, cliente: ClienteMaster) {
    decisiones.value = { ...decisiones.value, [fila.wr]: { masterClienteId: cliente._id } }
    Object.assign(fila, {
      accion: 'vinculado' as AccionFila,
      clienteNombreOficial: cliente.nombreOficial,
      casillero: cliente.codigoCasillero,
      score: undefined,
      coincideCon: undefined,
      detalle: undefined,
    })
    filaEnEdicion.value = null
    resaltar(fila.wr)
  }

  /** El operador prefiere crear un cliente nuevo aunque haya un parecido. */
  function marcarComoNuevo(fila: FilaIngreso) {
    decisiones.value = { ...decisiones.value, [fila.wr]: { crearNuevo: true } }
    Object.assign(fila, {
      accion: 'creado' as AccionFila,
      clienteNombreOficial: fila.clienteNombreOficial || fila.cliente,
      casillero: '(se asignará)',
      score: undefined,
      coincideCon: undefined,
      detalle: undefined,
    })
    filaEnEdicion.value = null
    resaltar(fila.wr)
  }

  async function aplicar(): Promise<boolean> {
    if (!archivo.value || !puedeAplicar.value) return false
    aplicando.value = true
    try {
      resultado.value = await ingresoCargaApi.aplicar(archivo.value, decisiones.value)
      const r = resultado.value
      toast.showNotification(
        `Carga ingresada: ${r.paquetesNuevos + r.paquetesActualizados} cajas, ${r.clientesCreados} clientes nuevos`,
        'success',
      )
      return true
    } catch (error) {
      fail(error, 'No se pudo ingresar la carga')
      return false
    } finally {
      aplicando.value = false
      confirmando.value = false
    }
  }

  function reiniciar() {
    archivo.value = null
    previsualizacion.value = null
    resultado.value = null
    errorArchivo.value = ''
    decisiones.value = {}
    filaEnEdicion.value = null
    confirmando.value = false
  }

  watch(archivo, (file) => {
    previsualizacion.value = null
    resultado.value = null
    errorArchivo.value = ''
    decisiones.value = {}
    if (file) previsualizar()
  })

  return {
    archivo,
    previsualizacion,
    resultado,
    vista,
    resumen,
    aplicado,
    cargando,
    aplicando,
    confirmando,
    errorArchivo,
    puedeAplicar,
    decisiones,
    filaEnEdicion,
    recienCambiada,
    previsualizar,
    abrirVincular,
    cerrarVincular,
    vincular,
    marcarComoNuevo,
    aplicar,
    reiniciar,
  }
}
