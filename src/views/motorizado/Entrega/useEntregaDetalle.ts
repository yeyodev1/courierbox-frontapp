import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { enviosApi, type EnvioDomicilio } from '@/services/envios.api'
import { useToastStore } from '@/stores/toast.store'

const ESTADO_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  asignado: 'Asignado',
  en_ruta: 'En ruta',
  entregado: 'Entregado',
  fallido: 'Fallido',
  reprogramado: 'Reprogramado',
}

export const estadoLabel = (estado: string) => ESTADO_LABELS[estado] ?? estado

export function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' })
}

/** The signature pad hands back a data URL; the upload endpoint wants a file. */
async function dataUrlToFile(dataUrl: string, name: string): Promise<File | null> {
  if (!dataUrl) return null
  const blob = await (await fetch(dataUrl)).blob()
  return new File([blob], name, { type: 'image/png' })
}

/** One delivery seen by the motorizado, from starting the route to closing it. */
export function useEntregaDetalle(id: string) {
  const router = useRouter()
  const toast = useToastStore()

  const envio = ref<EnvioDomicilio | null>(null)
  const loading = ref(true)
  const saving = ref(false)
  const uploadingFoto = ref(false)
  const error = ref('')

  const fotoPreview = ref('')
  const fotoUrl = ref('')
  const firmaUrl = ref('')
  const firmaDataUrl = ref('')

  const novedad = ref('')
  const motivoFallido = ref('')
  const recibe = ref({ nombre: '', apellido: '', cedula: '', contacto: '' })

  const puedeEntregar = computed(
    () =>
      envio.value?.estado === 'en_ruta' &&
      !!fotoUrl.value &&
      (!!firmaUrl.value || !!firmaDataUrl.value) &&
      !!recibe.value.nombre.trim() &&
      !!recibe.value.apellido.trim() &&
      recibe.value.cedula.replace(/\D+/g, '').length >= 6,
  )

  const recibidoPorTexto = computed(() => {
    const e = envio.value
    if (!e) return ''
    const nombre = [e.recibidoPorNombre, e.recibidoPorApellido].filter(Boolean).join(' ')
    if (!nombre) return ''
    return e.recibidoPorCedula ? `${nombre} · CI ${e.recibidoPorCedula}` : nombre
  })

  /** An address may already be a maps link; otherwise search for the text. */
  const mapsUrl = computed(() => {
    const dir = envio.value?.clienteDireccion ?? ''
    const urlMatch = dir.match(/https?:\/\/\S+/)
    if (urlMatch) return urlMatch[0]
    if (!dir) return ''
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dir)}`
  })

  const fail = (err: unknown, fallback: string) => {
    error.value = (err as Error)?.message ?? fallback
  }

  async function subirFoto(file: File) {
    fotoPreview.value = URL.createObjectURL(file)
    uploadingFoto.value = true
    error.value = ''
    try {
      const res = await enviosApi.uploadArchivo(id, 'foto', file)
      fotoUrl.value = res.envio.fotoEntregaUrl || res.upload.url || ''
      if (!fotoUrl.value) error.value = 'La foto no se subió (revisa Cloudinary). Intenta de nuevo.'
    } catch (err) {
      fail(err, 'No se pudo subir la foto')
      fotoPreview.value = ''
    } finally {
      uploadingFoto.value = false
    }
  }

  async function entregar() {
    if (!fotoUrl.value) {
      error.value = 'Toma la foto de la entrega primero'
      return
    }
    if (!recibe.value.nombre.trim() || !recibe.value.apellido.trim() || !recibe.value.cedula.trim()) {
      error.value = 'Completa nombre, apellido y cédula de quien recibe'
      return
    }
    if (!firmaDataUrl.value && !firmaUrl.value) {
      error.value = 'La firma de quien recibe es obligatoria'
      return
    }

    saving.value = true
    error.value = ''
    try {
      const firmaFile = await dataUrlToFile(firmaDataUrl.value, `firma-${id}.png`)
      if (firmaFile) {
        const uploaded = await enviosApi.uploadArchivo(id, 'firma', firmaFile)
        firmaUrl.value = uploaded.envio.firmaUrl || uploaded.upload.url || ''
      }
      if (!firmaUrl.value) throw new Error('No se pudo guardar la firma')

      const result = await enviosApi.marcarEntregado(id, {
        novedad: novedad.value,
        recibidoPorNombre: recibe.value.nombre.trim(),
        recibidoPorApellido: recibe.value.apellido.trim(),
        recibidoPorCedula: recibe.value.cedula.trim(),
        recibidoPorContacto: recibe.value.contacto.trim(),
      })

      if (!result.notificacion) {
        toast.showNotification('Entrega registrada. El cliente no tiene un correo configurado.', 'warning')
      } else {
        const sent = result.notificacion.estado === 'enviada'
        toast.showNotification(
          sent
            ? 'Entrega registrada y comprobante enviado por correo.'
            : 'Entrega registrada. El correo quedó pendiente de revisión administrativa.',
          sent ? 'success' : 'warning',
        )
      }
      router.push('/motorizado')
    } catch (err) {
      fail(err, 'No se pudo marcar como entregado')
    } finally {
      saving.value = false
    }
  }

  async function iniciarRuta() {
    saving.value = true
    error.value = ''
    try {
      envio.value = (await enviosApi.iniciarRuta(id)).envio
      toast.showNotification('Ruta iniciada y registrada en la bitácora', 'success')
    } catch (err) {
      fail(err, 'No se pudo iniciar la ruta')
    } finally {
      saving.value = false
    }
  }

  async function marcarFallido() {
    if (!motivoFallido.value.trim()) return
    saving.value = true
    error.value = ''
    try {
      envio.value = (await enviosApi.marcarFallido(id, motivoFallido.value.trim())).envio
      toast.showNotification('Entrega fallida registrada en la bitácora', 'warning')
      router.push('/motorizado')
    } catch (err) {
      fail(err, 'No se pudo registrar la novedad')
    } finally {
      saving.value = false
    }
  }

  async function load() {
    loading.value = true
    try {
      const res = await enviosApi.getById(id)
      envio.value = res.envio
      fotoUrl.value = res.envio.fotoEntregaUrl || ''
      fotoPreview.value = res.envio.fotoEntregaUrl || ''
      firmaUrl.value = res.envio.firmaUrl || ''
    } catch {
      envio.value = null
    } finally {
      loading.value = false
    }
  }

  return {
    envio,
    loading,
    saving,
    uploadingFoto,
    error,
    fotoPreview,
    firmaDataUrl,
    novedad,
    motivoFallido,
    recibe,
    puedeEntregar,
    recibidoPorTexto,
    mapsUrl,
    subirFoto,
    entregar,
    iniciarRuta,
    marcarFallido,
    load,
  }
}
