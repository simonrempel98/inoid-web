'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import jsQR from 'jsqr'
import {
  SwitchCamera, ZoomIn, ZoomOut, Flashlight, FlashlightOff, X, CheckCircle2
} from 'lucide-react'

type CameraInfo = {
  deviceId: string
  label: string
  facingMode?: string
}

type Capabilities = {
  zoom?: { min: number; max: number; step: number }
  torch?: boolean
}

export function QrScanner() {
  const t = useTranslations()
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animRef = useRef<number>(0)

  const [cameras, setCameras] = useState<CameraInfo[]>([])
  const [activeCameraIdx, setActiveCameraIdx] = useState(0)
  const [capabilities, setCapabilities] = useState<Capabilities>({})
  const [zoom, setZoom] = useState(1)
  const [torch, setTorch] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [found, setFound] = useState(false)
  const [permDenied, setPermDenied] = useState(false)
  const cooldownRef = useRef(false) // verhindert Doppelerkennung ohne State-Overhead

  // Alle Kameras auflisten
  const listCameras = useCallback(async () => {
    try {
      // Erst einmal Zugriff anfragen damit Labels sichtbar werden
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true })
      tempStream.getTracks().forEach(t => t.stop())

      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices
        .filter(d => d.kind === 'videoinput')
        .map((d, i) => ({
          deviceId: d.deviceId,
          label: d.label || t('scan.cameraLabel', { n: i + 1 }),
          facingMode: d.label.toLowerCase().includes('front') || d.label.toLowerCase().includes('vorder') ? 'user' : 'environment',
        }))
      setCameras(videoDevices)

      // Standard: Rückkamera bevorzugen
      const backIdx = videoDevices.findIndex(c =>
        c.label.toLowerCase().includes('back') ||
        c.label.toLowerCase().includes('rück') ||
        c.label.toLowerCase().includes('0') ||
        c.facingMode === 'environment'
      )
      setActiveCameraIdx(backIdx >= 0 ? backIdx : 0)
      return videoDevices
    } catch {
      setPermDenied(true)
      return []
    }
  }, [])

  // Kamera starten
  const startCamera = useCallback(async (camList: CameraInfo[], idx: number) => {
    // Vorherigen Stream stoppen
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
    }
    cancelAnimationFrame(animRef.current)

    const cam = camList[idx]
    if (!cam) return

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: { exact: cam.deviceId },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        }
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.setAttribute('playsinline', 'true')
        await videoRef.current.play()
      }

      // Capabilities lesen
      const track = stream.getVideoTracks()[0]
      const caps = track.getCapabilities?.() as any
      const newCaps: Capabilities = {}
      if (caps?.zoom) {
        newCaps.zoom = { min: caps.zoom.min, max: caps.zoom.max, step: caps.zoom.step ?? 0.1 }
        const currentZoom = (track.getSettings?.() as any)?.zoom ?? 1
        setZoom(currentZoom)
      }
      if (caps?.torch) newCaps.torch = true
      setCapabilities(newCaps)
      setTorch(false)
      setScanning(true)
      setError(null)
    } catch (e: any) {
      setError(`${t('scan.cameraError')}: ${e.message}`)
    }
  }, [])

  // QR-Scan Loop
  // Fixes: Canvas auf feste 640px → jsQR hat 9× weniger Pixel;
  //        200ms-Throttle → kein Main-Thread-Freeze;
  //        cooldownRef statt State → kein Stale-Closure durch lastScan-Dependency;
  //        rAF am Anfang schedulen → Loop läuft immer, Cooldown verhindert Doppelscans
  useEffect(() => {
    if (!scanning) return

    const canvas = canvasRef.current
    if (!canvas) return

    // Feste Scan-Auflösung: 640px breit. Canvas VOR getContext dimensionieren,
    // damit willReadFrequently auf dem richtigen Canvas greift.
    const SCAN_W = 640
    canvas.width = SCAN_W
    canvas.height = 360 // wird beim ersten Frame auf echtes Seitenverhältnis korrigiert

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    cooldownRef.current = false
    let lastAttempt = 0

    const scan = (ts: number) => {
      // Loop immer weiterführen – Cooldown verhindert Doppelerkennung
      animRef.current = requestAnimationFrame(scan)

      // Throttle: jsQR nur alle 200ms (~5fps) – reicht für QR, verhindert Freeze
      if (ts - lastAttempt < 200) return
      lastAttempt = ts

      const video = videoRef.current
      if (!video || video.readyState < 2 || video.videoWidth === 0) return

      // Seitenverhältnis beibehalten, Höhe nur bei Bedarf anpassen
      const h = Math.round(video.videoHeight * SCAN_W / video.videoWidth)
      if (canvas.height !== h) canvas.height = h

      ctx.drawImage(video, 0, 0, SCAN_W, h)

      let imageData: ImageData
      try {
        imageData = ctx.getImageData(0, 0, SCAN_W, h)
      } catch {
        return // SecurityError bei tainted canvas (sollte nicht passieren)
      }

      if (cooldownRef.current) return

      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth',
      })

      if (!code?.data) return

      // QR erkannt – Cooldown setzen
      cooldownRef.current = true
      const match = code.data.match(/\/assets\/([0-9a-f-]{36})/i)
      if (match) {
        setFound(true)
        setTimeout(() => router.push(`/assets/${match[1]}`), 600)
      } else {
        // Unbekanntes Format: kurz anzeigen, dann weiter scannen
        setFound(true)
        setTimeout(() => {
          setFound(false)
          cooldownRef.current = false
        }, 2000)
      }
    }

    animRef.current = requestAnimationFrame(scan)
    return () => cancelAnimationFrame(animRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning])

  // Zoom anwenden
  async function applyZoom(newZoom: number) {
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track) return
    try {
      await track.applyConstraints({ advanced: [{ zoom: newZoom } as any] })
      setZoom(newZoom)
    } catch {}
  }

  // Torch togglen
  async function toggleTorch() {
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track || !capabilities.torch) return
    try {
      const newTorch = !torch
      await track.applyConstraints({ advanced: [{ torch: newTorch } as any] })
      setTorch(newTorch)
    } catch {}
  }

  // Kamera wechseln
  async function switchCamera() {
    const nextIdx = (activeCameraIdx + 1) % cameras.length
    setActiveCameraIdx(nextIdx)
    setScanning(false)
    await startCamera(cameras, nextIdx)
  }

  // Init
  useEffect(() => {
    listCameras().then(camList => {
      if (camList.length > 0) {
        const backIdx = camList.findIndex(c =>
          c.label.toLowerCase().includes('back') ||
          c.label.toLowerCase().includes('rück') ||
          c.facingMode === 'environment'
        )
        const idx = backIdx >= 0 ? backIdx : 0
        setActiveCameraIdx(idx)
        startCamera(camList, idx)
      }
    })
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
      cancelAnimationFrame(animRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Kamera-Auswahl geändert
  const prevCameraIdx = useRef(activeCameraIdx)
  useEffect(() => {
    if (prevCameraIdx.current === activeCameraIdx) return
    prevCameraIdx.current = activeCameraIdx
    if (cameras.length > 0) startCamera(cameras, activeCameraIdx)
  }, [activeCameraIdx, cameras, startCamera])

  // ── Kein Kamerazugriff ──────────────────────────────────────────────────────
  if (permDenied) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>📷</div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ds-text)', margin: '0 0 8px' }}>{t('scan.permDeniedTitle')}</h2>
        <p style={{ fontSize: 14, color: '#666', margin: '0 0 20px' }}>
          {t('scan.permDeniedHint')}
        </p>
        <button onClick={() => window.location.reload()}
          style={{ background: '#003366', color: 'white', border: 'none', borderRadius: 50, padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          {t('scan.reload')}
        </button>
      </div>
    )
  }

  const zoomCaps = capabilities.zoom

  return (
    <div style={{ position: 'relative', fontFamily: 'Arial, sans-serif', background: '#000', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>

      {/* ── Video ────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <video
          ref={videoRef}
          muted
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Scan-Rahmen */}
        {!found && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <div style={{ position: 'relative', width: 240, height: 240 }}>
              {/* Ecken */}
              {[
                { top: 0, left: 0, borderTop: '3px solid white', borderLeft: '3px solid white', borderRadius: '12px 0 0 0' },
                { top: 0, right: 0, borderTop: '3px solid white', borderRight: '3px solid white', borderRadius: '0 12px 0 0' },
                { bottom: 0, left: 0, borderBottom: '3px solid white', borderLeft: '3px solid white', borderRadius: '0 0 0 12px' },
                { bottom: 0, right: 0, borderBottom: '3px solid white', borderRight: '3px solid white', borderRadius: '0 0 12px 0' },
              ].map((s, i) => (
                <div key={i} style={{ position: 'absolute', width: 28, height: 28, ...s as any }} />
              ))}
              {/* Scan-Linie */}
              <div style={{
                position: 'absolute', left: 4, right: 4, height: 2,
                background: 'rgba(0,153,204,0.8)',
                animation: 'scanline 2s ease-in-out infinite',
              }} />
            </div>
          </div>
        )}

        {/* Gefunden-Overlay */}
        {found && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(39,174,96,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              background: 'var(--ds-surface)', borderRadius: 20, padding: '20px 32px',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <CheckCircle2 size={28} color="#27AE60" />
              <span style={{ fontSize: 16, fontWeight: 700, color: '#27AE60' }}>QR-Code erkannt!</span>
            </div>
          </div>
        )}

        {/* Fehler */}
        {error && (
          <div style={{
            position: 'absolute', bottom: 80, left: 16, right: 16,
            background: 'rgba(220,38,38,0.9)', borderRadius: 10, padding: '10px 14px',
          }}>
            <p style={{ color: 'white', fontSize: 13, margin: 0 }}>{error}</p>
          </div>
        )}
      </div>

      {/* ── Controls ─────────────────────────────────────────────── */}
      <div style={{
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
        padding: '16px 20px 24px',
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>

        {/* Kamera-Auswahl (mehr als 2 Kameras → Dropdown) */}
        {cameras.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <SwitchCamera size={16} color="#96aed2" style={{ flexShrink: 0 }} />
            <select
              value={cameras[activeCameraIdx]?.deviceId ?? ''}
              onChange={e => {
                const idx = cameras.findIndex(c => c.deviceId === e.target.value)
                if (idx >= 0) setActiveCameraIdx(idx)
              }}
              style={{
                flex: 1, background: 'rgba(255,255,255,0.1)', color: 'white',
                border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8,
                padding: '7px 10px', fontSize: 13, outline: 'none',
                fontFamily: 'Arial, sans-serif',
              }}
            >
              {cameras.map(c => (
                <option key={c.deviceId} value={c.deviceId} style={{ background: '#111', color: 'white' }}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Zoom */}
        {zoomCaps && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => applyZoom(Math.max(zoomCaps.min, zoom - zoomCaps.step * 2))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'white' }}>
              <ZoomOut size={18} />
            </button>
            <div style={{ flex: 1 }}>
              <input
                type="range"
                min={zoomCaps.min}
                max={zoomCaps.max}
                step={zoomCaps.step}
                value={zoom}
                onChange={e => applyZoom(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#0099cc' }}
              />
            </div>
            <button onClick={() => applyZoom(Math.min(zoomCaps.max, zoom + zoomCaps.step * 2))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'white' }}>
              <ZoomIn size={18} />
            </button>
            <span style={{ fontSize: 12, color: '#96aed2', minWidth: 36, textAlign: 'right' }}>
              {zoom.toFixed(1)}×
            </span>
          </div>
        )}

        {/* Aktions-Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          {/* Torch */}
          {capabilities.torch && (
            <button onClick={toggleTorch} style={{
              width: 52, height: 52, borderRadius: '50%',
              background: torch ? '#f39c12' : 'rgba(255,255,255,0.12)',
              border: torch ? 'none' : '1px solid rgba(255,255,255,0.2)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {torch
                ? <Flashlight size={22} color="white" />
                : <FlashlightOff size={22} color="white" />
              }
            </button>
          )}

          {/* Kamera wechseln (nur wenn genau 2) */}
          {cameras.length === 2 && (
            <button onClick={switchCamera} style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <SwitchCamera size={22} color="white" />
            </button>
          )}
        </div>

        {/* Hinweis */}
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, textAlign: 'center', margin: 0 }}>
          {t('scan.hint')}
        </p>
      </div>

      <style>{`
        @keyframes scanline {
          0% { top: 4px; }
          50% { top: calc(100% - 6px); }
          100% { top: 4px; }
        }
      `}</style>
    </div>
  )
}
