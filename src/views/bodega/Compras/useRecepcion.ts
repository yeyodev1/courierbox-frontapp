import { computed, ref } from 'vue'
import { gestionesCompraAPI, type GestionCompra } from '@/services/gestiones_compra.api'
import { useToastStore } from '@/stores/toast.store'
import { useUploadQueue } from '@/composables/useUploadQueue'

/**
 * Warehouse reception. Photos are previewed locally and only uploaded on the
 * final confirmation, so an operator can add and drop shots freely before the
 * client is ever notified.
 */
export function useRecepcion(onDone: () => Promise<void> | void) {
  const toast = useToastStore()
  const queue = useUploadQueue((file) => gestionesCompraAPI.uploadImagen(file))

  const gestion = ref<GestionCompra | null>(null)
  const nota = ref('')
  const eta = ref('')

  const saving = ref(false)
  const notifying = ref(false)
  const error = ref('')

  /** The queue's own words while uploading, ours once the mail goes out. */
  const sendingMsg = computed(() => (notifying.value ? 'Avisando al cliente...' : queue.message.value))

  function open(target: GestionCompra) {
    queue.reset()
    gestion.value = target
    nota.value = ''
    eta.value = ''
    error.value = ''
  }

  function close() {
    queue.reset()
    gestion.value = null
    error.value = ''
  }

  function addFiles(files: File[]) {
    queue.add(files)
    error.value = ''
  }

  /** Returns false when there is nothing to confirm yet. */
  function validate(): boolean {
    if (!queue.total.value) {
      error.value = 'Sube al menos una foto'
      return false
    }
    error.value = ''
    return true
  }

  async function confirmar(): Promise<boolean> {
    if (!gestion.value) return false

    saving.value = true
    error.value = ''

    const uploaded = await queue.run()
    if (!uploaded) {
      // The successful photos keep their URLs, so a retry only redoes the rest.
      saving.value = false
      error.value = `No se pudieron subir ${queue.failedCount.value} imagen(es). Reintenta solo esas.`
      return false
    }

    notifying.value = true
    try {
      await gestionesCompraAPI.recepcionBodega(gestion.value._id, {
        fotos: queue.uploadedUrls.value.map((url) => ({ url, title: 'Recibido en bodega' })),
        notas: nota.value || undefined,
        entregaEstimada: eta.value.trim() || undefined,
        enviarCorreo: true,
      })

      toast.showNotification('Recibido registrado y cliente avisado', 'success')
      close()
      await onDone()
      return true
    } catch (err: unknown) {
      error.value = (err as Error)?.message ?? 'No se pudo registrar'
      return false
    } finally {
      notifying.value = false
      saving.value = false
    }
  }

  /** Runs the queue again; only the failed items are still outstanding. */
  async function reintentar() {
    error.value = (await queue.run()) ? '' : `Aún fallan ${queue.failedCount.value} imagen(es).`
  }

  return {
    queue,
    gestion,
    nota,
    eta,
    saving,
    notifying,
    error,
    sendingMsg,
    open,
    close,
    addFiles,
    validate,
    confirmar,
    reintentar,
  }
}
