/**
 * Komprimiert ein Bild clientseitig via Canvas API.
 * - Resize auf maxDim (default 1920px auf der längsten Seite)
 * - JPEG-Kompression mit quality (default 0.82)
 * - Gibt { file, originalSize, compressedSize } zurück
 */
export async function compressImage(
  file: File,
  options: { maxDim?: number; quality?: number } = {}
): Promise<{ file: File; originalSize: number; compressedSize: number }> {
  const { maxDim = 1920, quality = 0.82 } = options
  const originalSize = file.size

  // Nicht-Bilder oder sehr kleine Dateien direkt zurückgeben
  if (!file.type.startsWith('image/') || file.size < 100 * 1024) {
    return { file, originalSize, compressedSize: file.size }
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img

      // Skalieren wenn größer als maxDim
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height / width) * maxDim)
          width = maxDim
        } else {
          width = Math.round((width / height) * maxDim)
          height = maxDim
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) { resolve({ file, originalSize, compressedSize: file.size }); return }

      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        blob => {
          if (!blob) { resolve({ file, originalSize, compressedSize: file.size }); return }

          // Nur nehmen wenn wirklich kleiner (Canvas kann manchmal größer sein)
          if (blob.size >= file.size) {
            resolve({ file, originalSize, compressedSize: file.size })
            return
          }

          const compressed = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, '.jpg'),
            { type: 'image/jpeg', lastModified: Date.now() }
          )
          resolve({ file: compressed, originalSize, compressedSize: compressed.size })
        },
        'image/jpeg',
        quality
      )
    }

    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Bild konnte nicht geladen werden')) }
    img.src = url
  })
}

/** Komprimiert mehrere Bilder und gibt Statistiken zurück */
export async function compressImages(files: File[]): Promise<{
  files: File[]
  stats: { name: string; originalSize: number; compressedSize: number }[]
}> {
  const results = await Promise.all(files.map(f => compressImage(f)))
  return {
    files: results.map(r => r.file),
    stats: results.map((r, i) => ({
      name: files[i].name,
      originalSize: r.originalSize,
      compressedSize: r.compressedSize,
    })),
  }
}

/** Standard-Maximalgröße für Dokumente (10 MB) */
export const DOC_DEFAULT_MAX_BYTES = 10 * 1024 * 1024
/** @deprecated Verwende checkDocSize mit maxBytes-Parameter */
export const PDF_MAX_BYTES = DOC_DEFAULT_MAX_BYTES

/**
 * Prüft ob eine Datei das konfigurierte Größenlimit überschreitet.
 * @param maxBytes  Maximalgröße in Bytes — Standard: 10 MB
 */
export function checkDocSize(
  file: File,
  maxBytes: number = DOC_DEFAULT_MAX_BYTES
): { ok: boolean; message?: string } {
  if (file.size > maxBytes) {
    const maxLabel = formatBytes(maxBytes)
    return {
      ok: false,
      message: `"${file.name}" ist ${formatBytes(file.size)} groß — max. ${maxLabel} erlaubt.`,
    }
  }
  return { ok: true }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
