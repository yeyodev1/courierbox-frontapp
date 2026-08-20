import { computed, ref } from 'vue'
import { gestionesCompraAPI } from '@/services/gestiones_compra.api'
import { useUploadQueue } from '@/composables/useUploadQueue'

export const ETA_CHIPS = ['Hoy mismo', '24 horas', '1 a 2 días', '3 a 5 días', '1 semana']

/** Warehouse reception of a purchase: photos, ETA and the client notification. */
export function useRegistrarEnvio(gestionId: string, clienteEmail: () => string) {
  const queue = useUploadQueue((file) => gestionesCompraAPI.uploadImagen(file))

  const showPreview = ref(false)
  const sending = ref(false)
  const done = ref(false)
  const notifying = ref(false)
  const error = ref('')
  const eta = ref('')
  const nota = ref('')

  const canConfirm = computed(() => Boolean(queue.total.value && eta.value.trim()))

  /** The queue's own words while uploading, ours once the mail goes out. */
  const statusMessage = computed(() =>
    notifying.value ? 'Avisando al cliente...' : queue.message.value,
  )

  function reset() {
    queue.reset()
    eta.value = ''
    nota.value = ''
    error.value = ''
    showPreview.value = false
    done.value = false
    sending.value = false
    notifying.value = false
  }

  function addFiles(files: File[]) {
    queue.add(files)
    error.value = ''
  }

  /** Uploads whatever is left, then relates the photos and mails the client. */
  async function confirmar(): Promise<boolean> {
    if (!canConfirm.value) return false
    if (!clienteEmail()) {
      error.value = 'Este cliente no tiene correo; no se puede notificar.'
      return false
    }

    sending.value = true
    error.value = ''

    const uploaded = await queue.run()
    if (!uploaded) {
      // The successful photos keep their URLs, so a retry only redoes the rest.
      sending.value = false
      error.value = `No se pudieron subir ${queue.failedCount.value} imagen(es). Reintenta solo esas.`
      return false
    }

    notifying.value = true
    try {
      await gestionesCompraAPI.recepcionBodega(gestionId, {
        fotos: queue.uploadedUrls.value.map((url) => ({ url, title: 'Recibido en bodega' })),
        notas: nota.value || undefined,
        entregaEstimada: eta.value.trim(),
        enviarCorreo: true,
      })

      done.value = true
      // Let the success state land before the caller navigates away.
      await new Promise((r) => setTimeout(r, 1100))
      return true
    } catch (err: unknown) {
      sending.value = false
      error.value = (err as Error)?.message ?? 'No se pudo avisar al cliente. Reintenta.'
      return false
    } finally {
      notifying.value = false
    }
  }

  /** Runs the queue again; only the failed items are still outstanding. */
  async function reintentar() {
    error.value = ''
    if (await queue.run()) error.value = ''
    else error.value = `Aún fallan ${queue.failedCount.value} imagen(es).`
  }

  return {
    queue,
    showPreview,
    sending,
    done,
    notifying,
    statusMessage,
    error,
    eta,
    nota,
    canConfirm,
    reset,
    addFiles,
    confirmar,
    reintentar,
  }
}
