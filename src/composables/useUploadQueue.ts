import { computed, ref } from 'vue'

export type UploadStatus = 'pending' | 'uploading' | 'done' | 'error'

export interface UploadItem {
  id: number
  file: File
  /** Object URL for the local thumbnail — revoke it before dropping the item. */
  preview: string
  status: UploadStatus
  url?: string
  error?: string
}

export type Uploader = (file: File) => Promise<string | undefined | null>

/**
 * A queue of images picked locally and uploaded one by one.
 *
 * A failure marks only its own item and the run keeps going, so one bad photo
 * never discards the work already done — the operator retries just that one
 * instead of starting the whole batch over.
 */
export function useUploadQueue(upload: Uploader) {
  const items = ref<UploadItem[]>([])
  const running = ref(false)
  /** What the queue is doing right now, in words the operator can read. */
  const message = ref('')

  let seq = 0

  const total = computed(() => items.value.length)
  const doneCount = computed(() => items.value.filter((i) => i.status === 'done').length)
  const failedCount = computed(() => items.value.filter((i) => i.status === 'error').length)
  const pendingCount = computed(() =>
    items.value.filter((i) => i.status === 'pending' || i.status === 'uploading').length,
  )
  const percent = computed(() => (total.value ? Math.round((doneCount.value / total.value) * 100) : 0))
  const allUploaded = computed(() => total.value > 0 && doneCount.value === total.value)

  /** Object URLs live until revoked; drop every one when the list is cleared. */
  function releaseAll() {
    items.value.forEach((i) => URL.revokeObjectURL(i.preview))
    items.value = []
  }

  function reset() {
    releaseAll()
    running.value = false
    message.value = ''
    seq = 0
  }

  function add(files: File[]) {
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue
      items.value.push({ id: ++seq, file, preview: URL.createObjectURL(file), status: 'pending' })
    }
  }

  function remove(id: number) {
    const index = items.value.findIndex((i) => i.id === id)
    if (index < 0) return
    URL.revokeObjectURL(items.value[index]!.preview)
    items.value.splice(index, 1)
  }

  /**
   * Uploads everything not already stored. Resolves to true only when every
   * item made it, so the caller knows whether it may take the next step.
   */
  async function run(): Promise<boolean> {
    const queue = items.value.filter((i) => i.status !== 'done')
    if (!queue.length) return allUploaded.value

    running.value = true
    queue.forEach((i) => {
      i.status = 'pending'
      i.error = undefined
    })

    try {
      for (const item of queue) {
        item.status = 'uploading'
        message.value = `Subiendo ${doneCount.value + 1} de ${total.value}...`
        try {
          const url = await upload(item.file)
          if (!url) throw new Error('El servidor no devolvió la imagen.')
          item.url = url
          item.status = 'done'
        } catch (err: unknown) {
          item.status = 'error'
          item.error = (err as Error)?.message ?? 'No se pudo subir'
        }
      }
      return allUploaded.value
    } finally {
      running.value = false
      message.value = ''
    }
  }

  /** Every URL stored so far, in the order the operator added the photos. */
  const uploadedUrls = computed(() =>
    items.value.filter((i) => i.url).map((i) => i.url as string),
  )

  return {
    items,
    running,
    message,
    total,
    doneCount,
    failedCount,
    pendingCount,
    percent,
    allUploaded,
    uploadedUrls,
    add,
    remove,
    releaseAll,
    reset,
    run,
  }
}
