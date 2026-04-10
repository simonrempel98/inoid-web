/**
 * Komprimiert eine PDF-Datei clientseitig via pdf-lib.
 * - Wird nur ausgeführt wenn die Datei größer als PDF_COMPRESS_THRESHOLD_BYTES ist
 * - Behält Textebene, Hyperlinks und Lesezeichen
 * - Gibt das Original zurück wenn die Komprimierung keine Verbesserung bringt
 * - Schlägt die Komprimierung fehl, wird das Original stillschweigend zurückgegeben
 */

export const PDF_COMPRESS_THRESHOLD_BYTES = 1 * 1024 * 1024 // 1 MB

export async function compressPdf(file: File): Promise<{
  file: File
  originalSize: number
  compressedSize: number
  wasCompressed: boolean
}> {
  const originalSize = file.size

  if (!file.name.toLowerCase().endsWith('.pdf') || !file.type.includes('pdf')) {
    return { file, originalSize, compressedSize: file.size, wasCompressed: false }
  }

  if (file.size <= PDF_COMPRESS_THRESHOLD_BYTES) {
    return { file, originalSize, compressedSize: file.size, wasCompressed: false }
  }

  try {
    const { PDFDocument } = await import('pdf-lib')
    const bytes = await file.arrayBuffer()
    const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true })
    const compressed = await pdfDoc.save({ useObjectStreams: true })

    // Nur nehmen wenn wirklich kleiner
    if (compressed.byteLength >= bytes.byteLength) {
      return { file, originalSize, compressedSize: file.size, wasCompressed: false }
    }

    const compressedFile = new File([compressed], file.name, {
      type: 'application/pdf',
      lastModified: Date.now(),
    })

    return {
      file: compressedFile,
      originalSize,
      compressedSize: compressedFile.size,
      wasCompressed: true,
    }
  } catch {
    // Verschlüsselte oder beschädigte PDFs → Original zurückgeben
    return { file, originalSize, compressedSize: file.size, wasCompressed: false }
  }
}
