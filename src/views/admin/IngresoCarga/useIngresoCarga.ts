import { computed, ref, watch } from 'vue'
import { ingresoCargaApi, type AccionFila, type FilaIngreso, type ResultadoIngreso } from '@/services/ingreso_carga.api'
import { useToastStore } from '@/stores/toast.store'

/** Cómo se ve cada resultado en pantalla: texto y tono. */
export const ACCION_UI: Record<AccionFila, { label: string; tono: 'ok' | 'aviso' | 'nuevo' | 'neutro' | 'error' }> = {
  existente: { label: 'Cliente existente', tono: 'ok' },
  alias: { label: 'Cliente existente', tono: 'ok' },
  aproximado: { label: 'Parecido', tono: 'aviso' },
  creado: { label: 'Cliente nuevo', tono: 'nuevo' },
  sin_cliente: { label: 'Sin cliente', tono: 'neutro' },
  omitido: { label: 'Sin cambios', tono: 'neutro' },
  error: { label: 'Error', tono: 'error' },
}

export function etiquetaAccion(fila: FilaIngreso, aplicado: boolean): string {
  if (fila.accion === 'creado') return aplicado ? 'Cliente creado' : 'Se creará'
  if (fila.accion === 'aproximado' && fila.score !== undefined) return `Parecido ${Math.round(fila.score * 100)}%`
  return ACCION_UI[fila.accion].label
}

/**
 * Elegir el archivo dispara la previsualización sola: el operador ve qué
 * clientes se van a crear y cuáles ya existen antes de confirmar nada.
 */
export function useIngresoCarga() {
  const toast = useToastStore()

  const archivo = ref<File | null>(null)
  const previsualizacion = ref<ResultadoIngreso | null>(null)
  const resultado = ref<ResultadoIngreso | null>(null)
  const cargando = ref(false)
  const aplicando = ref(false)
  const errorArchivo = ref('')

  const vista = computed(() => resultado.value ?? previsualizacion.value)
  const aplicado = computed(() => !!resultado.value)
  const puedeAplicar = computed(
    () => !!archivo.value && !!previsualizacion.value && !resultado.value && !cargando.value && !aplicando.value,
  )

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
    try {
      previsualizacion.value = await ingresoCargaApi.previsualizar(archivo.value)
    } catch (error) {
      previsualizacion.value = null
      errorArchivo.value = fail(error, 'No se pudo leer el archivo')
    } finally {
      cargando.value = false
    }
  }

  async function aplicar(): Promise<boolean> {
    if (!archivo.value || !puedeAplicar.value) return false
    aplicando.value = true
    try {
      resultado.value = await ingresoCargaApi.aplicar(archivo.value)
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
    }
  }

  function reiniciar() {
    archivo.value = null
    previsualizacion.value = null
    resultado.value = null
    errorArchivo.value = ''
  }

  watch(archivo, (file) => {
    previsualizacion.value = null
    resultado.value = null
    errorArchivo.value = ''
    if (file) previsualizar()
  })

  return {
    archivo,
    previsualizacion,
    resultado,
    vista,
    aplicado,
    cargando,
    aplicando,
    errorArchivo,
    puedeAplicar,
    previsualizar,
    aplicar,
    reiniciar,
  }
}
