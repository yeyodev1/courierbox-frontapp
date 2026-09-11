import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { comprimirImagen, imagenParaSubir, MAXIMO_BYTES, UMBRAL_BYTES } from '../comprimirImagen'

const MB = 1024 * 1024

function archivo(bytes: number, type = 'image/jpeg', name = 'IMG_0001.JPG') {
  return new File([new Uint8Array(bytes)], name, { type })
}

/** Simula un <img> que decodifica (o no) y un canvas que codifica a un tamaño dado. */
function simularNavegador(opts: { decodifica?: boolean; ancho?: number; alto?: number; bytesPorPaso?: number[] }) {
  const { decodifica = true, ancho = 4032, alto = 3024, bytesPorPaso = [600 * 1024] } = opts
  const dibujos: { w: number; h: number; calidad: number }[] = []
  let paso = 0

  class FakeImage {
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    naturalWidth = ancho
    naturalHeight = alto
    width = ancho
    height = alto
    set src(_: string) {
      queueMicrotask(() => (decodifica ? this.onload?.() : this.onerror?.()))
    }
  }
  vi.stubGlobal('Image', FakeImage)

  const crearOriginal = document.createElement.bind(document)
  vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
    if (tag !== 'canvas') return crearOriginal(tag)
    const canvas = { width: 0, height: 0 } as any
    canvas.getContext = () => ({ drawImage: vi.fn() })
    canvas.toBlob = (cb: (b: Blob | null) => void, _type: string, calidad: number) => {
      dibujos.push({ w: canvas.width, h: canvas.height, calidad })
      const bytes = bytesPorPaso[Math.min(paso++, bytesPorPaso.length - 1)]!
      cb(new Blob([new Uint8Array(bytes)], { type: 'image/jpeg' }))
    }
    return canvas
  }) as typeof document.createElement)

  return { dibujos }
}

beforeEach(() => {
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake')
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('comprimirImagen', () => {
  it('deja pasar tal cual lo que ya es liviano o no es una foto', async () => {
    const liviana = archivo(UMBRAL_BYTES - 1)
    const pdf = archivo(6 * MB, 'application/pdf', 'guia.pdf')
    expect(await comprimirImagen(liviana)).toBe(liviana)
    expect(await comprimirImagen(pdf)).toBe(pdf)
  })

  it('achica una foto de cámara pesada a JPEG de 1920 px de lado mayor', async () => {
    const { dibujos } = simularNavegador({ bytesPorPaso: [700 * 1024] })
    const foto = archivo(5 * MB, 'image/heic', 'IMG_0001.HEIC')

    const r = await comprimirImagen(foto)

    expect(r).not.toBe(foto)
    expect(r.type).toBe('image/jpeg')
    expect(r.name).toBe('IMG_0001.jpg')
    expect(r.size).toBe(700 * 1024)
    expect(dibujos).toEqual([{ w: 1920, h: 1440, calidad: 0.82 }])
  })

  it('baja resolución y calidad si el primer intento sigue pesado', async () => {
    const { dibujos } = simularNavegador({ bytesPorPaso: [3 * MB, 2 * MB, 900 * 1024] })
    const r = await comprimirImagen(archivo(8 * MB))
    expect(r.size).toBe(900 * 1024)
    expect(dibujos.map((d) => d.w)).toEqual([1920, 1600, 1280])
  })

  it('devuelve el original si el navegador no puede leer la imagen', async () => {
    simularNavegador({ decodifica: false })
    const foto = archivo(5 * MB, 'image/heic')
    expect(await comprimirImagen(foto)).toBe(foto)
  })
})

describe('imagenParaSubir', () => {
  it('rechaza con un mensaje claro lo que no cabe en el límite de Vercel', async () => {
    simularNavegador({ decodifica: false })
    await expect(imagenParaSubir(archivo(MAXIMO_BYTES + MB))).rejects.toMatchObject({
      status: 413,
      message: expect.stringContaining('máximo es 4 MB'),
    })
  })

  it('entrega la foto comprimida cuando cabe', async () => {
    simularNavegador({ bytesPorPaso: [500 * 1024] })
    const r = await imagenParaSubir(archivo(6 * MB))
    expect(r.size).toBe(500 * 1024)
  })
})
