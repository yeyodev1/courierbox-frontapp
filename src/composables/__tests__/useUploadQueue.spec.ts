import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useUploadQueue } from '../useUploadQueue'

function imageFile(name: string) {
  return new File(['x'], name, { type: 'image/png' })
}

beforeEach(() => {
  // jsdom has no object URLs; the queue only needs a stable string back.
  globalThis.URL.createObjectURL = vi.fn(() => 'blob:preview')
  globalThis.URL.revokeObjectURL = vi.fn()
})

describe('useUploadQueue', () => {
  it('ignores files that are not images', () => {
    const q = useUploadQueue(async () => 'https://cdn/1.png')

    q.add([imageFile('a.png'), new File(['x'], 'notas.pdf', { type: 'application/pdf' })])

    expect(q.total.value).toBe(1)
  })

  it('keeps uploading after one file fails, and reports which', async () => {
    const upload = vi
      .fn()
      .mockResolvedValueOnce('https://cdn/1.png')
      .mockRejectedValueOnce(new Error('Cloudinary caído'))
      .mockResolvedValueOnce('https://cdn/3.png')

    const q = useUploadQueue(upload)
    q.add([imageFile('a.png'), imageFile('b.png'), imageFile('c.png')])

    const allDone = await q.run()

    expect(upload).toHaveBeenCalledTimes(3)
    expect(allDone).toBe(false)
    expect(q.doneCount.value).toBe(2)
    expect(q.failedCount.value).toBe(1)
    expect(q.uploadedUrls.value).toEqual(['https://cdn/1.png', 'https://cdn/3.png'])
    expect(q.items.value[1]!.error).toBe('Cloudinary caído')
  })

  it('retries only the file that failed', async () => {
    const upload = vi
      .fn()
      .mockResolvedValueOnce('https://cdn/1.png')
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce('https://cdn/2.png')

    const q = useUploadQueue(upload)
    q.add([imageFile('a.png'), imageFile('b.png')])

    await q.run()
    upload.mockClear()

    const allDone = await q.run()

    expect(upload).toHaveBeenCalledTimes(1)
    expect(allDone).toBe(true)
    expect(q.failedCount.value).toBe(0)
    expect(q.percent.value).toBe(100)
  })

  it('treats an empty response from the server as a failure', async () => {
    const q = useUploadQueue(async () => undefined)
    q.add([imageFile('a.png')])

    expect(await q.run()).toBe(false)
    expect(q.items.value[0]!.status).toBe('error')
  })

  it('revokes every preview when the list is cleared', () => {
    const q = useUploadQueue(async () => 'https://cdn/1.png')
    q.add([imageFile('a.png'), imageFile('b.png')])

    q.releaseAll()

    expect(globalThis.URL.revokeObjectURL).toHaveBeenCalledTimes(2)
    expect(q.total.value).toBe(0)
  })
})
