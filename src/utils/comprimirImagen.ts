/**
 * Achica una foto antes de subirla.
 *
 * La API vive en Vercel, que corta cualquier petición de más de 4,5 MB con un
 * 413 antes de que llegue al servidor, y sin cabeceras CORS: el teléfono sólo
 * ve "no pudimos conectarnos". Una foto de la cámara de un iPhone pesa entre
 * 3 y 8 MB, así que la foto de la entrega fallaba y se borraba de la pantalla.
 *
 * Redimensionar al lado mayor de 1920 px en JPEG deja la foto en unos cientos
 * de KB, legible como evidencia, y además sube rápido con datos móviles.
 * Si el navegador no puede decodificar la imagen (p. ej. HEIC fuera de
 * Safari), se devuelve el archivo original y que decida el servidor.
 */

/** Por debajo de esto la foto se sube tal cual. */
export const UMBRAL_BYTES = 1.5 * 1024 * 1024
/** Techo seguro bajo el límite de Vercel (4,5 MB) contando el multipart. */
export const MAXIMO_BYTES = 4 * 1024 * 1024

/** Intentos de menor a mayor compresión; se para en el primero que quede bajo el umbral. */
const PASOS: { lado: number; calidad: number }[] = [
  { lado: 1920, calidad: 0.82 },
  { lado: 1600, calidad: 0.75 },
  { lado: 1280, calidad: 0.7 },
]

const SIN_TOCAR = new Set(['image/gif', 'image/svg+xml'])

function cargarImagen(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('No se pudo leer la imagen'))
    }
    img.src = url
  })
}

function aJpeg(img: HTMLImageElement, lado: number, calidad: number): Promise<Blob | null> {
  const ancho = img.naturalWidth || img.width
  const alto = img.naturalHeight || img.height
  const escala = Math.min(1, lado / Math.max(ancho, alto))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(ancho * escala))
  canvas.height = Math.max(1, Math.round(alto * escala))
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.resolve(null)
  // El navegador ya aplica la orientación EXIF al dibujar un <img>.
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', calidad))
}

export async function comprimirImagen(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || SIN_TOCAR.has(file.type)) return file
  if (file.size <= UMBRAL_BYTES) return file

  let img: HTMLImageElement
  try {
    img = await cargarImagen(file)
  } catch {
    return file
  }

  let mejor: Blob | null = null
  for (const { lado, calidad } of PASOS) {
    const blob = await aJpeg(img, lado, calidad).catch(() => null)
    if (!blob) continue
    if (!mejor || blob.size < mejor.size) mejor = blob
    if (blob.size <= UMBRAL_BYTES) break
  }

  if (!mejor || mejor.size >= file.size) return file
  const nombre = `${file.name.replace(/\.[^.]+$/, '') || 'foto'}.jpg`
  return new File([mejor], nombre, { type: 'image/jpeg', lastModified: file.lastModified })
}

/**
 * Lo que las pantallas deben llamar antes de subir una foto: la comprime y,
 * si aun así no cabe en el límite de Vercel, falla con un mensaje que el
 * operador entiende en vez del "no pudimos conectarnos" del 413 sin CORS.
 */
export async function imagenParaSubir(file: File): Promise<File> {
  const lista = await comprimirImagen(file)
  if (lista.size > MAXIMO_BYTES) {
    const mb = (lista.size / (1024 * 1024)).toFixed(1)
    throw Object.assign(new Error(`La foto pesa ${mb} MB y el máximo es 4 MB. Toma otra foto o elige una más liviana.`), {
      status: 413,
    })
  }
  return lista
}
