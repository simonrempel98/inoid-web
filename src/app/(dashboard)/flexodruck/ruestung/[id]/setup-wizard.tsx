'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import jsQR from 'jsqr'

type Asset = { id: string; name: string; serial_number: string | null }
type DW = { id: string; position: number; label: string | null; color_hint: string | null }
type Step = {
  id: string
  druckwerk_id: string
  slot_label: string
  is_fixed: boolean
  asset_id: string | null
  status: 'pending' | 'installed' | 'verified' | 'skipped'
  notes: string | null
  assets: Asset | null
}

// ── QR Scanner ────────────────────────────────────────────────────────────────
function QrScanner({ onMatch, onClose }: { onMatch: (uuid: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animRef = useRef<number>(0)
  const cooldownRef = useRef(false)
  const [scanning, setScanning] = useState(false)
  const [found, setFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permDenied, setPermDenied] = useState(false)

  useEffect(() => {
    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.setAttribute('playsinline', 'true')
          await videoRef.current.play()
        }
        setScanning(true)
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.includes('Permission') || msg.includes('NotAllowed')) setPermDenied(true)
        else setError(`Kamerafehler: ${msg}`)
      }
    }
    start()
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
      cancelAnimationFrame(animRef.current)
    }
  }, [])

  useEffect(() => {
    if (!scanning) return
    const canvas = canvasRef.current
    if (!canvas) return
    const SCAN_W = 640
    canvas.width = SCAN_W
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return
    let last = 0
    const scan = (ts: number) => {
      animRef.current = requestAnimationFrame(scan)
      if (ts - last < 200) return
      last = ts
      const video = videoRef.current
      if (!video || video.readyState < 2 || video.videoWidth === 0) return
      const h = Math.round(video.videoHeight * SCAN_W / video.videoWidth)
      if (canvas.height !== h) canvas.height = h
      ctx.drawImage(video, 0, 0, SCAN_W, h)
      let img: ImageData
      try { img = ctx.getImageData(0, 0, SCAN_W, h) } catch { return }
      if (cooldownRef.current) return
      const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'attemptBoth' })
      if (!code?.data) return
      cooldownRef.current = true
      const match = code.data.match(/\/assets\/([0-9a-f-]{36})/i)
      if (match) {
        setFound(true)
        setTimeout(() => onMatch(match[1]), 500)
      } else {
        setError('Kein Asset-QR-Code erkannt')
        setTimeout(() => { setError(null); cooldownRef.current = false }, 2000)
      }
    }
    animRef.current = requestAnimationFrame(scan)
    return () => cancelAnimationFrame(animRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.92)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'rgba(0,0,0,0.6)' }}>
        <span style={{ color: 'white', fontWeight: 700, fontSize: 16, fontFamily: 'Arial, sans-serif' }}>Asset scannen</span>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', color: 'white', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
      </div>
      {permDenied ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📷</div>
          <p style={{ color: 'white', fontSize: 15, fontFamily: 'Arial, sans-serif', marginBottom: 20 }}>Kamerazugriff verweigert.</p>
          <button onClick={onClose} style={{ background: '#003366', color: 'white', border: 'none', borderRadius: 50, padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Schließen</button>
        </div>
      ) : (
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <video ref={videoRef} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          {!found && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{ position: 'relative', width: 220, height: 220 }}>
                {([
                  { top: 0, left: 0, borderTop: '3px solid white', borderLeft: '3px solid white', borderRadius: '10px 0 0 0' },
                  { top: 0, right: 0, borderTop: '3px solid white', borderRight: '3px solid white', borderRadius: '0 10px 0 0' },
                  { bottom: 0, left: 0, borderBottom: '3px solid white', borderLeft: '3px solid white', borderRadius: '0 0 0 10px' },
                  { bottom: 0, right: 0, borderBottom: '3px solid white', borderRight: '3px solid white', borderRadius: '0 0 10px 0' },
                ] as React.CSSProperties[]).map((s, i) => <div key={i} style={{ position: 'absolute', width: 24, height: 24, ...s }} />)}
                <div style={{ position: 'absolute', left: 4, right: 4, height: 2, background: 'rgba(0,153,204,0.8)', animation: 'qrscan 2s ease-in-out infinite' }} />
              </div>
            </div>
          )}
          {found && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(39,174,96,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: 'var(--ds-surface)', borderRadius: 20, padding: '18px 28px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>✓</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#27AE60', fontFamily: 'Arial, sans-serif' }}>Asset erkannt!</span>
              </div>
            </div>
          )}
          {error && (
            <div style={{ position: 'absolute', bottom: 24, left: 16, right: 16, background: 'rgba(220,38,38,0.9)', borderRadius: 10, padding: '10px 14px' }}>
              <p style={{ color: 'white', fontSize: 13, margin: 0, fontFamily: 'Arial, sans-serif' }}>{error}</p>
            </div>
          )}
        </div>
      )}
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, textAlign: 'center', padding: '12px 20px 20px', margin: 0, fontFamily: 'Arial, sans-serif' }}>
        Halte die Kamera auf den QR-Code des Assets
      </p>
      <style>{`@keyframes qrscan { 0% { top: 4px; } 50% { top: calc(100% - 6px); } 100% { top: 4px; } }`}</style>
    </div>
  )
}

// ── Fortschrittsfarben für Diagramm ──────────────────────────────────────────
const STEP_FILL: Record<string, string> = {
  pending: '#d1d5db', installed: '#34d399', verified: '#34d399', skipped: '#e5e7eb',
}

function hexAlpha(hex: string | null, alpha: number): string {
  if (!hex || !hex.startsWith('#') || hex.length < 7) return `rgba(0,51,102,${alpha})`
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(0,51,102,${alpha})`
  return `rgba(${r},${g},${b},${alpha})`
}

// ── Canvas-Diagramm (aus Whiteboard-Layout) ───────────────────────────────────
type CanvasCircle = { id: string; x: number; y: number; r: number; label: string; color: string }

function CanvasSetupDiagram({ circles, druckwerke, stepsByDW, currentDwId, onSelect }: {
  circles: CanvasCircle[]
  druckwerke: DW[]
  stepsByDW: Record<string, Step[]>
  currentDwId: string
  onSelect: (dwId: string) => void
}) {
  const VW = 820, VH = 540
  const GRID = 20

  // Kreis → Druckwerk mappen: zuerst per ID, dann per Label
  function getDW(circle: CanvasCircle): DW | null {
    const byId = druckwerke.find(d => d.id === circle.id)
    if (byId) return byId
    const byLabel = druckwerke.find(d =>
      circle.label === (d.label ?? `DW ${d.position}`) ||
      circle.label === `DW ${d.position}` ||
      circle.label === `Druckwerk ${d.position}`
    )
    return byLabel ?? null
  }

  function dwDone(dwId: string) {
    const steps = stepsByDW[dwId] ?? []
    return steps.length > 0 && steps.every(s => s.status !== 'pending')
  }
  function dwPartial(dwId: string) {
    const steps = stepsByDW[dwId] ?? []
    return steps.some(s => s.status !== 'pending') && !dwDone(dwId)
  }

  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      style={{ width: '100%', display: 'block' }}
    >
      <defs>
        <pattern id="csdDots" width={GRID} height={GRID} patternUnits="userSpaceOnUse">
          <circle cx="0.7" cy="0.7" r="0.7" fill="var(--ds-border)" />
        </pattern>
      </defs>
      <rect width={VW} height={VH} fill="var(--ds-surface2)" />
      <rect width={VW} height={VH} fill="url(#csdDots)" />

      {circles.map(circle => {
        const dw     = getDW(circle)
        const isDW   = !!dw
        const isCur  = dw?.id === currentDwId
        const done   = dw ? dwDone(dw.id) : false
        const part   = dw ? dwPartial(dw.id) : false

        const fontSize = circle.r < 24 ? 8 : circle.r < 36 ? 10 : circle.r < 52 ? 12 : 14
        const lines    = wrapLabel(circle.label)
        const lineH    = fontSize * 1.3
        const startY   = -(lines.length - 1) * lineH / 2

        return (
          <g key={circle.id}
            onClick={() => dw && onSelect(dw.id)}
            style={{ cursor: isDW ? 'pointer' : 'default' }}
          >
            {/* Auswahl-Ring beim aktiven DW */}
            {isCur && (
              <circle cx={circle.x} cy={circle.y} r={circle.r + 7}
                fill="none" stroke="#0099cc" strokeWidth="2.5" strokeDasharray="6 3" />
            )}

            {/* Hauptkreis */}
            <circle cx={circle.x} cy={circle.y} r={circle.r}
              fill={circle.color}
              stroke={isCur ? '#0099cc' : 'rgba(255,255,255,0.2)'}
              strokeWidth={isCur ? 2.5 : 1.5}
            />

            {/* Beschriftung */}
            {lines.map((line, li) => (
              <text key={li}
                x={circle.x} y={circle.y + startY + li * lineH}
                textAnchor="middle" dominantBaseline="central"
                fill="white" fontSize={fontSize} fontWeight="700"
                fontFamily="Arial, sans-serif"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {line}
              </text>
            ))}

            {/* Status-Indikator */}
            {done && (
              <g>
                <circle cx={circle.x + circle.r * 0.72} cy={circle.y - circle.r * 0.72}
                  r={Math.max(6, circle.r * 0.28)} fill="#34d399" stroke="white" strokeWidth="1.5" />
                <text x={circle.x + circle.r * 0.72} y={circle.y - circle.r * 0.72}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize={Math.max(5, circle.r * 0.2)} fill="white" fontWeight="900"
                  style={{ pointerEvents: 'none' }}>✓</text>
              </g>
            )}
            {part && !done && (
              <circle cx={circle.x + circle.r * 0.72} cy={circle.y - circle.r * 0.72}
                r={Math.max(5, circle.r * 0.22)} fill="#f59e0b" stroke="white" strokeWidth="1.5" />
            )}
          </g>
        )
      })}
    </svg>
  )
}

function wrapLabel(label: string, maxChars = 12): string[] {
  const words = label.split(' ')
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxChars && cur) { lines.push(cur.trim()); cur = w }
    else { cur = (cur + ' ' + w).trim() }
  }
  if (cur) lines.push(cur)
  return lines
}

// ── Altes Auto-Diagramm (Fallback wenn kein Canvas-Layout) ───────────────────
function SetupDiagram({ druckwerke, stepsByDW, currentDwId, onSelect }: {
  druckwerke: DW[]; stepsByDW: Record<string, Step[]>; currentDwId: string; onSelect: (id: string) => void
}) {
  const n = druckwerke.length
  if (n === 0) return null
  const W = 340, H = 340, CX = W / 2, CY = H / 2, PAD = 44, CYLL_R = 44
  const dbR = n <= 4 ? 24 : n <= 7 ? 20 : n <= 11 ? 17 : 14
  const fR = Math.round(dbR * 0.72)
  const DB_DIST = CYLL_R + 18 + dbR, F_DIST = DB_DIST + dbR + 6 + fR
  const LBL_DIST = F_DIST + fR + (n <= 8 ? 14 : 10)
  const SQRT2 = 0.707

  function slotStatus(dwId: string, label: string) {
    return stepsByDW[dwId]?.find(s => s.slot_label === label)?.status ?? null
  }
  function dwComplete(dwId: string) {
    const steps = stepsByDW[dwId] ?? []
    return steps.length > 0 && steps.every(s => s.status !== 'pending')
  }
  function dwPartial(dwId: string) {
    const steps = stepsByDW[dwId] ?? []
    return steps.some(s => s.status !== 'pending') && !dwComplete(dwId)
  }

  return (
    <svg viewBox={`${-PAD} ${-PAD} ${W + PAD * 2} ${H + PAD * 2}`}
      style={{ width: '100%', maxWidth: W + PAD * 2, display: 'block', margin: '0 auto' }} overflow="visible">
      <defs>
        <radialGradient id="sgCyl2" cx="38%" cy="35%">
          <stop offset="0%" stopColor="#2a7ab5" /><stop offset="100%" stopColor="#174f77" />
        </radialGradient>
      </defs>
      {druckwerke.map((dw, i) => {
        const angle = (i * 2 * Math.PI / n) - Math.PI / 2
        const c = Math.cos(angle), s = Math.sin(angle)
        return <line key={`l-${dw.id}`} x1={CX + (CYLL_R + 2) * c} y1={CY + (CYLL_R + 2) * s}
          x2={CX + (DB_DIST - dbR - 2) * c} y2={CY + (DB_DIST - dbR - 2) * s}
          stroke="#dde4ef" strokeWidth="1.5" strokeDasharray="4 3" />
      })}
      <circle cx={CX} cy={CY} r={CYLL_R} fill="url(#sgCyl2)" />
      <text x={CX} y={CY - 5} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="7" fontWeight="700" letterSpacing="1" fontFamily="Arial, sans-serif">ZENTRAL</text>
      <text x={CX} y={CY + 6} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="7" fontWeight="700" letterSpacing="1" fontFamily="Arial, sans-serif">ZYLINDER</text>
      {druckwerke.map((dw, i) => {
        const angle = (i * 2 * Math.PI / n) - Math.PI / 2
        const c = Math.cos(angle), s = Math.sin(angle)
        const dbX = CX + DB_DIST * c, dbY = CY + DB_DIST * s
        const fX = CX + F_DIST * c, fY = CY + F_DIST * s
        const lX = CX + LBL_DIST * c, lY = CY + LBL_DIST * s
        const isCurrent = dw.id === currentDwId
        const color = dw.color_hint ?? '#003366'
        const dbStatus = slotStatus(dw.id, 'Druckbild')
        const fStatus = slotStatus(dw.id, 'Farbe')
        const complete = dwComplete(dw.id)
        const partial = dwPartial(dw.id)
        const dbFill = dbStatus && dbStatus !== 'pending' ? STEP_FILL[dbStatus] : color
        const fFill = fStatus && fStatus !== 'pending' ? STEP_FILL[fStatus] : hexAlpha(color, 0.55)
        const ta = c > 0.25 ? 'start' : c < -0.25 ? 'end' : 'middle'
        const db = s > 0.25 ? 'hanging' : s < -0.25 ? 'auto' : 'central'
        return (
          <g key={dw.id} onClick={() => onSelect(dw.id)} style={{ cursor: 'pointer' }}>
            {isCurrent && <circle cx={dbX} cy={dbY} r={dbR + 6} fill="none" stroke="#0099cc" strokeWidth="2.5" strokeDasharray="5 3" opacity="0.7" />}
            {fStatus !== null && <circle cx={fX} cy={fY} r={fR} fill={fFill} stroke={isCurrent ? '#0099cc' : 'rgba(255,255,255,0.3)'} strokeWidth={isCurrent ? 2 : 1.5} />}
            {dbStatus !== null && <circle cx={dbX} cy={dbY} r={dbR} fill={dbFill} stroke={isCurrent ? '#0099cc' : 'rgba(255,255,255,0.3)'} strokeWidth={isCurrent ? 2 : 1.5} />}
            {complete && (
              <g>
                <circle cx={dbX + SQRT2 * dbR} cy={dbY - SQRT2 * dbR} r={5.5} fill="#34d399" stroke="white" strokeWidth="1.5" />
                <text x={dbX + SQRT2 * dbR} y={dbY - SQRT2 * dbR} textAnchor="middle" dominantBaseline="central" fontSize="7" fill="white" fontWeight="700">✓</text>
              </g>
            )}
            {partial && <circle cx={dbX + SQRT2 * dbR} cy={dbY - SQRT2 * dbR} r={4} fill="#f59e0b" stroke="white" strokeWidth="1.5" />}
            {n <= 14 && <text x={lX} y={lY} textAnchor={ta} dominantBaseline={db}
              fill={isCurrent ? '#003366' : '#9ca3af'} fontSize={n <= 8 ? 9.5 : 8}
              fontWeight={isCurrent ? '700' : '400'} fontFamily="Arial, sans-serif">
              {dw.label ?? `DW ${dw.position}`}
            </text>}
          </g>
        )
      })}
    </svg>
  )
}

// ── SetupWizard ───────────────────────────────────────────────────────────────
export function SetupWizard({
  setupId, setupName, jobNumber, status: initialStatus,
  machineName, machineId, templateName,
  druckwerke, stepsByDW: initialStepsByDW, assets, canEdit, canvasLayout,
}: {
  setupId: string; setupName: string; jobNumber: string | null; status: string
  machineName: string; machineId: string; templateName: string | null
  druckwerke: DW[]; stepsByDW: Record<string, Step[]>; assets: Asset[]; canEdit: boolean
  canvasLayout: any[] | null
}) {
  const t = useTranslations('flexodruck')
  const [currentDwIdx, setCurrentDwIdx] = useState(0)
  const [stepsByDW, setStepsByDW] = useState<Record<string, Step[]>>(initialStepsByDW)
  const [status, setStatus] = useState(initialStatus)
  const [savingStepId, setSavingStepId] = useState<string | null>(null)
  const [completing, setCompleting] = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)
  const [scanStepId, setScanStepId] = useState<string | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  const currentDW = druckwerke[currentDwIdx]
  const currentSteps = currentDW ? (stepsByDW[currentDW.id] ?? []) : []

  const visibleDwIds = new Set(druckwerke.map(d => d.id))
  const allSteps = Object.entries(stepsByDW)
    .filter(([dwId]) => visibleDwIds.has(dwId))
    .flatMap(([, steps]) => steps)
  const doneCount = allSteps.filter(s => s.status !== 'pending').length
  const totalCount = allSteps.length
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0
  const allDone = doneCount === totalCount && totalCount > 0

  async function updateStep(step: Step, newStatus: 'installed' | 'pending', newAssetId?: string | null) {
    setSavingStepId(step.id)
    const body: Record<string, unknown> = { step_id: step.id, status: newStatus }
    if (newAssetId !== undefined) body.asset_id = newAssetId
    const res = await fetch(`/api/flexodruck/setups/${setupId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSavingStepId(null)
    if (!res.ok) return
    const updatedAsset = newAssetId !== undefined
      ? (assets.find(a => a.id === newAssetId) ?? null)
      : step.assets
    setStepsByDW(prev => {
      const dwSteps = [...(prev[step.druckwerk_id] ?? [])]
      const idx = dwSteps.findIndex(s => s.id === step.id)
      if (idx >= 0) dwSteps[idx] = { ...dwSteps[idx], status: newStatus, asset_id: newAssetId !== undefined ? (newAssetId ?? null) : step.asset_id, assets: updatedAsset }
      return { ...prev, [step.druckwerk_id]: dwSteps }
    })
  }

  function handleScan(stepId: string, uuid: string) {
    setScanStepId(null)
    const asset = assets.find(a => a.id === uuid)
    const step = allSteps.find(s => s.id === stepId)
    if (!step) return
    if (!asset) { setScanError('Asset nicht in deiner Organisation gefunden'); return }
    updateStep(step, 'installed', asset.id)
  }

  async function startSetup() {
    const res = await fetch(`/api/flexodruck/setups/${setupId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'in_progress' }),
    })
    if (res.ok) setStatus('in_progress')
  }

  async function deleteSetup() {
    setDeleting(true)
    const res = await fetch(`/api/flexodruck/setups/${setupId}`, { method: 'DELETE' })
    setDeleting(false)
    if (res.ok) router.push(`/flexodruck/maschinen/${machineId}`)
  }

  async function completeSetup() {
    setCompleting(true)
    const res = await fetch(`/api/flexodruck/setups/${setupId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    })
    setCompleting(false)
    if (res.ok) { setStatus('completed'); setShowCompleted(true) }
  }

  const statusColor: Record<string, string> = { planned: '#0099cc', in_progress: '#f59e0b', completed: '#34d399', cancelled: '#6b7280' }
  const statusLabel: Record<string, string> = { planned: t('planned'), in_progress: t('inProgress'), completed: t('completed'), cancelled: t('cancelled') }

  if (showCompleted) {
    return (
      <div style={{ padding: '60px 24px', maxWidth: 560, textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#34d399', margin: '0 0 8px', fontFamily: 'Arial, sans-serif' }}>{t('setupComplete')}</h1>
        <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 24px', fontFamily: 'Arial, sans-serif' }}>{setupName}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link href={`/flexodruck/maschinen/${machineId}`} style={{ background: '#003366', color: 'white', padding: '12px 24px', borderRadius: 50, fontSize: 14, fontWeight: 700, fontFamily: 'Arial, sans-serif', textDecoration: 'none' }}>{t('toMachine')}</Link>
          <Link href="/flexodruck" style={{ background: '#f4f6f9', color: '#003366', padding: '12px 24px', borderRadius: 50, fontSize: 14, fontWeight: 700, fontFamily: 'Arial, sans-serif', textDecoration: 'none', border: '1px solid var(--ds-border)' }}>{t('overview')}</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px 24px 80px', maxWidth: 680 }}>
      {scanStepId && (
        <QrScanner
          onMatch={uuid => handleScan(scanStepId, uuid)}
          onClose={() => setScanStepId(null)}
        />
      )}

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <Link href="/flexodruck" style={{ color: '#6b7280', fontSize: 13, textDecoration: 'none', fontFamily: 'Arial, sans-serif' }}>← Flexodruck</Link>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: '#003366', margin: '0 0 2px', fontFamily: 'Arial, sans-serif' }}>
            {setupName}
            {jobNumber && <span style={{ fontSize: 14, fontWeight: 400, color: '#6b7280', marginLeft: 8 }}>#{jobNumber}</span>}
          </h1>
          <p style={{ fontSize: 12, color: '#6b7280', margin: 0, fontFamily: 'Arial, sans-serif' }}>{machineName}{templateName && ` · ${templateName}`}</p>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, color: statusColor[status], background: statusColor[status] + '18', fontFamily: 'Arial, sans-serif', flexShrink: 0 }}>
          {statusLabel[status] ?? status}
        </span>
      </div>

      {/* Fortschrittsbalken */}
      <div style={{ background: '#e8edf4', borderRadius: 10, height: 10, marginBottom: 8, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 10, background: allDone ? '#34d399' : '#0099cc', width: `${progressPct}%`, transition: 'width 0.3s ease' }} />
      </div>
      <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 20px', fontFamily: 'Arial, sans-serif' }}>
        {t('stepsCompleted', { done: doneCount, total: totalCount, pct: progressPct })}
      </p>

      {/* Start-Banner */}
      {status === 'planned' && canEdit && (
        <div style={{ background: '#e8f4fd', borderRadius: 12, border: '1px solid #bfdbfe', padding: '16px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#003366', fontFamily: 'Arial, sans-serif' }}>{t('readyToStart')}</p>
          <button type="button" onClick={startSetup}
            style={{ background: '#003366', color: 'white', padding: '10px 20px', borderRadius: 50, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'Arial, sans-serif', flexShrink: 0 }}>
            ▶ {t('startButton')}
          </button>
        </div>
      )}

      {scanError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
          <p style={{ margin: 0, fontSize: 13, color: '#ef4444', fontFamily: 'Arial, sans-serif' }}>{scanError}</p>
        </div>
      )}

      {/* Diagramm */}
      <div style={{ background: 'var(--ds-surface)', borderRadius: 16, border: '1px solid var(--ds-border)', padding: '16px 8px 12px', marginBottom: 20 }}>
        {canvasLayout && canvasLayout.length > 0 ? (
          <CanvasSetupDiagram
            circles={canvasLayout}
            druckwerke={druckwerke}
            stepsByDW={stepsByDW}
            currentDwId={currentDW?.id ?? ''}
            onSelect={id => { const idx = druckwerke.findIndex(d => d.id === id); if (idx >= 0) setCurrentDwIdx(idx) }}
          />
        ) : (
          <SetupDiagram
            druckwerke={druckwerke}
            stepsByDW={stepsByDW}
            currentDwId={currentDW?.id ?? ''}
            onSelect={id => { const idx = druckwerke.findIndex(d => d.id === id); if (idx >= 0) setCurrentDwIdx(idx) }}
          />
        )}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 8, flexWrap: 'wrap' }}>
          {[{ color: '#d1d5db', label: 'Offen' }, { color: '#34d399', label: 'Eingebaut' }].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
              <span style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'Arial, sans-serif' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Aktives Druckwerk */}
      <div>
        {currentDW && (
          <div>
            {/* DW Header */}
            <div style={{
              background: currentDW.color_hint ? currentDW.color_hint + '18' : '#f4f6f9',
              borderRadius: '12px 12px 0 0', border: '1px solid var(--ds-border)',
              borderBottom: 'none', padding: '14px 18px',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: currentDW.color_hint ?? '#003366', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 900, color: 'white', fontFamily: 'Arial, sans-serif' }}>{currentDW.position}</span>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#003366', fontFamily: 'Arial, sans-serif' }}>{currentDW.label ?? `Druckwerk ${currentDW.position}`}</p>
                <p style={{ margin: 0, fontSize: 11, color: '#6b7280', fontFamily: 'Arial, sans-serif' }}>
                  {currentSteps.filter(s => s.status !== 'pending').length}/{currentSteps.length} eingebaut
                </p>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                {currentDwIdx > 0 && (
                  <button type="button" onClick={() => setCurrentDwIdx(i => i - 1)}
                    style={{ background: 'var(--ds-surface)', border: '1px solid var(--ds-border)', borderRadius: 20, padding: '4px 12px', cursor: 'pointer', fontSize: 12, color: '#6b7280', fontFamily: 'Arial, sans-serif' }}>
                    ← {t('back')}
                  </button>
                )}
                {currentDwIdx < druckwerke.length - 1 && (
                  <button type="button" onClick={() => setCurrentDwIdx(i => i + 1)}
                    style={{ background: '#003366', color: 'white', border: 'none', borderRadius: 20, padding: '4px 12px', cursor: 'pointer', fontSize: 12, fontFamily: 'Arial, sans-serif' }}>
                    {t('nextDW')} →
                  </button>
                )}
              </div>
            </div>

            {/* Schritte */}
            <div style={{ background: 'var(--ds-surface)', border: '1px solid var(--ds-border)', borderRadius: '0 0 12px 12px', overflow: 'hidden' }}>
              {currentSteps.map((step, si) => {
                const isSaving = savingStepId === step.id
                const isDone = step.status !== 'pending'

                return (
                  <div key={step.id} style={{
                    padding: '14px 18px',
                    borderBottom: si < currentSteps.length - 1 ? '1px solid #f0f2f5' : 'none',
                    background: isDone ? '#f0fdf4' : 'white',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    {/* Label + Asset */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#003366', fontFamily: 'Arial, sans-serif' }}>
                          {step.slot_label}
                        </p>
                        {step.is_fixed && (
                          <span style={{ fontSize: 10, background: '#f4f6f9', color: '#9ca3af', padding: '1px 7px', borderRadius: 10, fontFamily: 'Arial, sans-serif' }}>
                            fest
                          </span>
                        )}
                      </div>
                      {step.assets && (
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280', fontFamily: 'Arial, sans-serif' }}>
                          {step.assets.name}{step.assets.serial_number && ` · ${step.assets.serial_number}`}
                        </p>
                      )}
                    </div>

                    {/* Aktionen */}
                    {canEdit && (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                        {/* QR-Scan Button */}
                        <button type="button"
                          onClick={() => { setScanError(null); setScanStepId(step.id) }}
                          title="Asset scannen"
                          style={{
                            width: 36, height: 36, borderRadius: 8, border: '1px solid var(--ds-border)',
                            background: 'var(--ds-surface)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                            <rect x="3" y="14" width="7" height="7" rx="1"/>
                            <path d="M14 14h2v2h-2z"/><path d="M18 14h3v3h-3z"/><path d="M14 18h3v3h-3z"/>
                          </svg>
                        </button>

                        {/* Eingebaut / Rückgängig */}
                        {!isDone ? (
                          <button type="button"
                            disabled={isSaving}
                            onClick={() => updateStep(step, 'installed')}
                            style={{
                              padding: '8px 16px', borderRadius: 20, border: 'none',
                              background: '#003366', color: 'white',
                              fontSize: 13, fontWeight: 700, cursor: isSaving ? 'default' : 'pointer',
                              fontFamily: 'Arial, sans-serif', opacity: isSaving ? 0.5 : 1,
                            }}>
                            {isSaving ? '…' : '✓ Eingebaut'}
                          </button>
                        ) : (
                          <button type="button"
                            disabled={isSaving}
                            onClick={() => updateStep(step, 'pending')}
                            style={{
                              padding: '8px 16px', borderRadius: 20,
                              border: '1px solid #34d399',
                              background: '#f0fdf4', color: '#059669',
                              fontSize: 13, fontWeight: 700, cursor: isSaving ? 'default' : 'pointer',
                              fontFamily: 'Arial, sans-serif',
                              display: 'flex', alignItems: 'center', gap: 6,
                            }}>
                            <span style={{ fontSize: 14 }}>✓</span> Eingebaut
                          </button>
                        )}
                      </div>
                    )}
                    {!canEdit && isDone && (
                      <span style={{ fontSize: 20, color: '#34d399' }}>✓</span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Nächstes DW */}
            {currentDwIdx < druckwerke.length - 1 && (
              <button type="button" onClick={() => setCurrentDwIdx(i => i + 1)}
                style={{ marginTop: 12, width: '100%', padding: '12px', background: '#f4f6f9', color: '#003366', border: '1px solid var(--ds-border)', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'Arial, sans-serif' }}>
                {t('nextToDW')} {druckwerke[currentDwIdx + 1]?.label ?? `DW ${druckwerke[currentDwIdx + 1]?.position}`} →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Abschließen */}
      {canEdit && status === 'in_progress' && allDone && (
        <div style={{ marginTop: 24, background: '#d1fae5', borderRadius: 14, border: '2px solid #34d399', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 700, color: '#065f46', fontFamily: 'Arial, sans-serif' }}>{t('allStepsDone')}</p>
            <p style={{ margin: 0, fontSize: 12, color: '#047857', fontFamily: 'Arial, sans-serif' }}>{t('allStepsDoneDesc')}</p>
          </div>
          <button type="button" onClick={completeSetup} disabled={completing}
            style={{ background: completing ? '#9ca3af' : '#059669', color: 'white', padding: '12px 24px', borderRadius: 50, border: 'none', fontSize: 14, fontWeight: 700, cursor: completing ? 'default' : 'pointer', fontFamily: 'Arial, sans-serif', flexShrink: 0 }}>
            {completing ? t('saving') : `✓ ${t('completeButton')}`}
          </button>
        </div>
      )}

      {status === 'completed' && (
        <div style={{ marginTop: 24, background: '#d1fae5', borderRadius: 14, border: '1px solid #34d399', padding: '16px 20px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#065f46', fontFamily: 'Arial, sans-serif' }}>✓ {t('setupCompletedBanner')}</p>
        </div>
      )}

      {/* Löschen */}
      <div style={{ marginTop: 40, borderTop: '1px solid #e8edf4', paddingTop: 24 }}>
        {!deleteConfirm ? (
          <button type="button" onClick={() => setDeleteConfirm(true)}
            style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 13, cursor: 'pointer', fontFamily: 'Arial, sans-serif', padding: 0, textDecoration: 'underline' }}>
            Rüstvorgang löschen
          </button>
        ) : (
          <div style={{ background: '#fef2f2', borderRadius: 12, border: '1px solid #fca5a5', padding: '16px 20px' }}>
            <p style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: '#991b1b', fontFamily: 'Arial, sans-serif' }}>
              Rüstvorgang wirklich löschen?
            </p>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6b7280', fontFamily: 'Arial, sans-serif' }}>
              Diese Aktion kann nicht rückgängig gemacht werden. Alle Schritte werden ebenfalls gelöscht.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={deleteSetup} disabled={deleting}
                style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: 20, padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: deleting ? 'default' : 'pointer', fontFamily: 'Arial, sans-serif', opacity: deleting ? 0.6 : 1 }}>
                {deleting ? 'Löschen…' : 'Ja, löschen'}
              </button>
              <button type="button" onClick={() => setDeleteConfirm(false)}
                style={{ background: 'var(--ds-surface)', color: '#6b7280', border: '1px solid var(--ds-border)', borderRadius: 20, padding: '8px 18px', fontSize: 13, cursor: 'pointer', fontFamily: 'Arial, sans-serif' }}>
                Abbrechen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
