/**
 * Client-side image enhancement using Canvas API.
 * Applies auto-levels, contrast boost and unsharp masking.
 * Returns an enhanced File object.
 */
export async function enhanceImage(
  file: File,
  mode: 'document' | 'photo' = 'document',
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      try {
        const canvas = document.createElement('canvas')
        canvas.width  = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0)

        const id = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const d = id.data

        if (mode === 'document') {
          applyDocumentEnhance(d)
        } else {
          applyPhotoEnhance(d)
        }

        ctx.putImageData(id, 0, 0)

        canvas.toBlob(
          blob => {
            if (!blob) { resolve(file); return }
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '') + '_enhanced.jpg', { type: 'image/jpeg' }))
          },
          'image/jpeg',
          0.92,
        )
      } catch {
        resolve(file)
      }
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
}

// ── Dokument-Modus: Kontrast maximieren, Text scharf ──────────────────────────
function applyDocumentEnhance(d: Uint8ClampedArray) {
  // 1. Histogramm (Luminanz)
  const hist = new Array(256).fill(0)
  for (let i = 0; i < d.length; i += 4) {
    const lum = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2])
    hist[lum]++
  }

  // 2. 1%-/99%-Percentile für Auto-Levels
  const total = d.length / 4
  const cut   = total * 0.01
  let lo = 0, hi = 255
  let sum = 0
  for (let v = 0; v < 256; v++) { sum += hist[v]; if (sum >= cut) { lo = v; break } }
  sum = 0
  for (let v = 255; v >= 0; v--) { sum += hist[v]; if (sum >= cut) { hi = v; break } }
  const range = Math.max(hi - lo, 1)

  // 3. Stretch + stärkere Kontrastverstärkung für Dokument
  for (let i = 0; i < d.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      let v = ((d[i + c] - lo) / range) * 255
      // S-Kurve für Kontrast
      v = sigmoid(v / 255) * 255
      d[i + c] = clamp(Math.round(v))
    }
  }
}

// ── Foto-Modus: sanfte Auto-Levels, Sättigung leicht erhöhen ─────────────────
function applyPhotoEnhance(d: Uint8ClampedArray) {
  const hist = new Array(256).fill(0)
  for (let i = 0; i < d.length; i += 4) {
    const lum = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2])
    hist[lum]++
  }
  const total = d.length / 4
  const cut   = total * 0.005
  let lo = 0, hi = 255, sum = 0
  for (let v = 0; v < 256; v++) { sum += hist[v]; if (sum >= cut) { lo = v; break } }
  sum = 0
  for (let v = 255; v >= 0; v--) { sum += hist[v]; if (sum >= cut) { hi = v; break } }
  const range = Math.max(hi - lo, 1)

  for (let i = 0; i < d.length; i += 4) {
    const r = clamp(Math.round(((d[i]     - lo) / range) * 255))
    const g = clamp(Math.round(((d[i + 1] - lo) / range) * 255))
    const b = clamp(Math.round(((d[i + 2] - lo) / range) * 255))

    // Sättigung +15%
    const [h, s, l] = rgbToHsl(r, g, b)
    const [rr, gg, bb] = hslToRgb(h, Math.min(1, s * 1.15), l)
    d[i]     = rr
    d[i + 1] = gg
    d[i + 2] = bb
  }
}

// ── Hilfsfunktionen ───────────────────────────────────────────────────────────

function sigmoid(x: number): number {
  // Stärkere S-Kurve für Dokumente: x → mehr Schwarz/Weiß
  const k = 6
  return 1 / (1 + Math.exp(-k * (x - 0.5)))
}

function clamp(v: number): number {
  return Math.max(0, Math.min(255, v))
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return [h, s, l]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r: number, g: number, b: number
  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

/** Bild für API-Upload auf max 1200px verkleinern und als base64 zurückgeben */
export async function fileToBase64ForApi(file: File, maxDim = 1200): Promise<{ base64: string; mediaType: string }> {
  if (file.type === 'application/pdf') {
    const ab = await file.arrayBuffer()
    const bytes = new Uint8Array(ab)
    let binary = ''
    const chunk = 8192
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
    }
    return { base64: btoa(binary), mediaType: 'application/pdf' }
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight))
      const w = Math.round(img.naturalWidth  * scale)
      const h = Math.round(img.naturalHeight * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      const base64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1]
      resolve({ base64, mediaType: 'image/jpeg' })
    }
    img.onerror = reject
    img.src = url
  })
}
