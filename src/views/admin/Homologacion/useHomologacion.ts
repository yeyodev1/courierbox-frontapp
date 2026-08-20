import { computed, ref, watch } from 'vue'
import { homologacionApi, type ClienteMaster, type PendienteGrupo } from '@/services/homologacion.api'
import { useToastStore } from '@/stores/toast.store'

export type Sugerencia = PendienteGrupo['sugerencias'][number]

export interface NuevoClienteForm {
  codigoCasillero: string
  nombreOficial: string
  cedulaRuc: string
  email: string
  telefono: string
}

export function emptyNuevoCliente(): NuevoClienteForm {
  return { codigoCasillero: '', nombreOficial: '', cedulaRuc: '', email: '', telefono: '' }
}

export function sugerenciaToCliente(s: Sugerencia): ClienteMaster {
  return {
    _id: s.masterId,
    nombreOficial: s.nombreOficial,
    codigoCasillero: s.codigoCasillero,
    cedulaRuc: s.cedulaRuc,
  }
}

export function pct(score: number) {
  return `${Math.round(score * 100)}%`
}

/** The homologation queue: pending name groups and the resolution itself. */
export function useHomologacion() {
  const toast = useToastStore()

  const grupos = ref<PendienteGrupo[]>([])
  const totalPendientes = ref(0)
  const totalClientes = ref(0)
  const loading = ref(true)
  const guardando = ref(false)

  function fail(error: unknown, fallback: string) {
    const e = error as { data?: { error?: string }; message?: string }
    toast.showNotification(e?.data?.error || e?.message || fallback, 'error')
  }

  async function cargar() {
    loading.value = true
    try {
      const data = await homologacionApi.pendientes(40)
      grupos.value = data.grupos
      totalPendientes.value = data.totalPendientes
      totalClientes.value = data.totalClientes
    } catch (error) {
      fail(error, 'No se pudo cargar la cola')
    } finally {
      loading.value = false
    }
  }

  /** Returns true when the whole group was linked to an owner. */
  async function homologar(
    nombre: string,
    target: { masterClienteId: string } | { nuevoCliente: NuevoClienteForm },
  ): Promise<boolean> {
    guardando.value = true
    try {
      const res = await homologacionApi.homologar({ nombre, ...target })
      toast.showNotification(
        `${res.homologados} paquete(s) vinculados a ${res.cliente?.nombreOficial ?? 'el cliente'}.`,
        'success',
      )
      await cargar()
      return true
    } catch (error) {
      fail(error, 'No se pudo homologar')
      return false
    } finally {
      guardando.value = false
    }
  }

  return { grupos, totalPendientes, totalClientes, loading, guardando, cargar, homologar }
}

/** Debounced lookup of an existing master client to link a group to. */
export function useBusquedaClientes() {
  const toast = useToastStore()

  const busqueda = ref('')
  const buscando = ref(false)
  const resultados = ref<ClienteMaster[]>([])

  const hasQuery = computed(() => busqueda.value.trim().length >= 2)

  let timer: number | undefined

  watch(busqueda, (value) => {
    window.clearTimeout(timer)
    if (value.trim().length < 2) {
      resultados.value = []
      return
    }
    timer = window.setTimeout(async () => {
      buscando.value = true
      try {
        resultados.value = await homologacionApi.buscarClientes(value.trim())
      } catch (error: unknown) {
        toast.showNotification((error as Error)?.message || 'No se pudo buscar clientes', 'error')
      } finally {
        buscando.value = false
      }
    }, 300)
  })

  function reset() {
    window.clearTimeout(timer)
    busqueda.value = ''
    resultados.value = []
  }

  return { busqueda, buscando, resultados, hasQuery, reset }
}
