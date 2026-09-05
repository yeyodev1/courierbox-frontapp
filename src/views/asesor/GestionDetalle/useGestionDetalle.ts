import { computed, ref } from 'vue'
import {
  gestionesCompraAPI,
  type GestionCompra,
  type GestionCompraFoto,
  type GestionCompraStage,
} from '@/services/gestiones_compra.api'
import { useToastStore } from '@/stores/toast.store'
import { useUploadQueue } from '@/composables/useUploadQueue'
import { formatDate as formatCalendarDate, formatDateTime as formatInstant } from '@/utils/format'

export interface StageStep {
  value: GestionCompraStage
  label: string
  desc: string
  icon: string
}

export const STAGE_STEPS: StageStep[] = [
  { value: 'solicitada', label: 'Solicitada', desc: 'Recibida por el equipo', icon: 'fa-regular fa-circle-dot' },
  { value: 'revisando', label: 'Revisando', desc: 'Validando la compra', icon: 'fa-solid fa-magnifying-glass' },
  { value: 'comprada', label: 'Comprada', desc: 'Pedido confirmado', icon: 'fa-solid fa-cart-shopping' },
  { value: 'en_transito', label: 'En tránsito', desc: 'En camino al país', icon: 'fa-solid fa-truck-fast' },
  { value: 'entregada', label: 'Entregada', desc: 'Finalizada', icon: 'fa-solid fa-circle-check' },
]

const ESTADO_LABELS: Record<string, string> = {
  borrador: 'Borrador',
  activa: 'Activa',
  completado: 'Completado',
  cancelado: 'Cancelado',
}

export const estadoLabel = (estado: string) => ESTADO_LABELS[estado] ?? estado
export const stageIndex = (stage: GestionCompraStage) => STAGE_STEPS.findIndex((s) => s.value === stage)

export const formatDate = (iso: string) =>
  formatCalendarDate(iso, { day: '2-digit', month: 'long', year: 'numeric' })

export const formatDateTime = (iso: string) =>
  formatInstant(iso, { dateStyle: 'short', timeStyle: 'short' })

/** One gestión as the asesor sees it: photos, stage and the public link. */
export function useGestionDetalle(id: () => string) {
  const toast = useToastStore()

  const gestion = ref<GestionCompra | null>(null)
  const loading = ref(true)
  const saving = ref(false)
  const uploadingPhotos = ref(false)
  const photoError = ref('')
  const photoQueue = useUploadQueue((file) => gestionesCompraAPI.uploadImagen(file))

  const editForm = ref({ paginaCompra: '', fechaEntregaTentativa: '', notas: '' })

  const contacto = computed(() =>
    typeof gestion.value?.contactoId === 'object' ? gestion.value.contactoId : null,
  )

  const stage = computed<GestionCompraStage>(() => gestion.value?.stage ?? 'solicitada')

  const currentStageLabel = computed(
    () => STAGE_STEPS.find((s) => s.value === stage.value)?.label ?? 'Solicitada',
  )

  const stageProgress = computed(() =>
    Math.round(((stageIndex(stage.value) + 1) / STAGE_STEPS.length) * 100),
  )

  const viewUrl = computed(() => `${window.location.origin}/compra/${gestion.value?.viewToken ?? ''}`)

  /** The main image leads the gallery; related photos follow without duplicating it. */
  const galleryPhotos = computed<GestionCompraFoto[]>(() => {
    const related = gestion.value?.fotosRelacionadas ?? []
    const main = gestion.value?.imagenCompraUrl
      ? [{ url: gestion.value.imagenCompraUrl, title: 'Imagen principal', createdAt: gestion.value.updatedAt }]
      : []
    return [...main, ...related.filter((photo) => photo.url !== gestion.value?.imagenCompraUrl)]
  })

  function fail(error: unknown, fallback: string) {
    toast.showNotification((error as Error)?.message ?? fallback, 'error')
  }

  async function load() {
    loading.value = true
    try {
      gestion.value = await gestionesCompraAPI.getById(id())
      editForm.value = {
        paginaCompra: gestion.value.paginaCompra,
        fechaEntregaTentativa: (gestion.value.fechaEntregaTentativa ?? '').split('T')[0] ?? '',
        notas: gestion.value.notas ?? '',
      }
    } finally {
      loading.value = false
    }
  }

  async function saveEdits(nextStage: GestionCompraStage) {
    if (!gestion.value) return
    saving.value = true
    try {
      gestion.value = await gestionesCompraAPI.update(id(), {
        ...editForm.value,
        stage: nextStage,
        fotosRelacionadas: gestion.value.fotosRelacionadas,
      })
      toast.showNotification('Cambios guardados', 'success')
    } catch (error) {
      fail(error, 'Error')
    } finally {
      saving.value = false
    }
  }

  async function setStage(next: GestionCompraStage) {
    if (!gestion.value || next === gestion.value.stage) return
    try {
      gestion.value = await gestionesCompraAPI.update(id(), {
        stage: next,
        fotosRelacionadas: gestion.value.fotosRelacionadas,
      })
      toast.showNotification('Stage actualizado', 'success')
    } catch (error) {
      fail(error, 'Error')
    }
  }

  /**
   * Uploads through the shared queue so the asesor sees how many are stored and
   * how many are left instead of a bare "Subiendo...".
   */
  async function addPhotos(files: File[], title: string) {
    if (!files.length || !gestion.value) return

    uploadingPhotos.value = true
    photoError.value = ''
    photoQueue.reset()
    photoQueue.add(files)

    try {
      await photoQueue.run()
      if (!photoQueue.uploadedUrls.value.length) {
        photoError.value = 'No se pudo subir ninguna foto. Reintenta.'
        return
      }

      const current = [...(gestion.value.fotosRelacionadas ?? [])]
      photoQueue.uploadedUrls.value.forEach((url) => {
        current.push({
          url,
          title: title.trim() || `Foto ${current.length + 1}`,
          createdAt: new Date().toISOString(),
        })
      })

      gestion.value = await gestionesCompraAPI.update(id(), {
        fotosRelacionadas: current,
        stage: stage.value,
      })

      // Partial success is still success: say plainly what did not make it.
      photoError.value = photoQueue.failedCount.value
        ? `${photoQueue.failedCount.value} foto(s) no se pudieron subir.`
        : ''
      toast.showNotification('Fotos agregadas', 'success')
      photoQueue.reset()
    } catch (error) {
      photoError.value = (error as Error)?.message ?? 'Error al subir fotos'
    } finally {
      uploadingPhotos.value = false
    }
  }

  function copyLink() {
    navigator.clipboard?.writeText(viewUrl.value)
    toast.showNotification('Enlace copiado', 'success')
  }

  const openPublicLink = () => window.open(viewUrl.value, '_blank', 'noopener,noreferrer')

  return {
    gestion,
    loading,
    saving,
    uploadingPhotos,
    photoError,
    photoQueue,
    editForm,
    contacto,
    stage,
    currentStageLabel,
    stageProgress,
    viewUrl,
    galleryPhotos,
    load,
    saveEdits,
    setStage,
    addPhotos,
    copyLink,
    openPublicLink,
  }
}
