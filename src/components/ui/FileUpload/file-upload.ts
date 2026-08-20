/** Human-readable size: whole numbers for bytes and anything over 10 units. */
export function formatFileSize(bytes: number) {
  if (!bytes) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

export function fileKindLabel(file: File | null) {
  if (!file) return ''
  if (file.type === 'application/pdf') return 'PDF'
  if (file.type.startsWith('image/')) return 'Imagen'
  return 'Archivo'
}

export const isImageFile = (file: File | null) => !!file?.type.startsWith('image/')
