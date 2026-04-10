'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

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

// ── Fortschrittsfarben ────────────────────────────────────────────────────────
const STEP_FILL: Record<string, string> = {
  pending:   '#d1d5db',
  installed: '#0099cc',
  verified:  '#34d399',
  skipped:   '#e5e7eb',
}

function hexAlpha(hex: string | null, alpha: number): string {
  if (!hex || !hex.startsWith('#') || hex.length < 7) return `rgba(0,51,102,${alpha})`
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(0,51,102,${alpha})`
  return `rgba(${r},${g},${b},${alpha})`
}

// ── Setup-Diagramm ────────────────────────────────────────────────────────────
function SetupDiagram({
  druckwerke, stepsByDW, currentDwId, onSelect,
}: {
  druckwerke: DW[]
  stepsByDW: Record<string, Step[]>
  currentDwId: string
  onSelect: (id: string) => void
}) {
  const n = druckwerke.length
  if (n === 0) return null

  const W = 340, H = 340, CX = W / 2, CY = H / 2
  const PAD = 44
  const CYLL_R = 44

  const dbR = n <= 4 ? 24 : n <= 7 ? 20 : n <= 11 ? 17 : 14
  const fR  = Math.round(dbR * 0.72)
  const DB_DIST  = CYLL_R + 18 + dbR
  const F_DIST   = DB_DIST + dbR + 6 + fR
  const LBL_DIST = F_DIST + fR + (n <= 8 ? 14 : 10)
  const SQRT2    = 0.707

  function slotStatus(dwId: string, label: string): Step['status'] | null {
    const steps = stepsByDW[dwId] ?? []
    const step = steps.find(s => s.slot_label === label)
    return step?.status ?? null
  }

  function dwOverallStatus(dwId: string): 'complete' | 'partial' | 'pending' {
    const steps = stepsByDW[dwId] ?? []
    if (steps.length === 0) return 'pending'
    const done = steps.filter(s => s.status === 'verified' || s.status === 'installed' || s.status === 'skipped').length
    if (done === steps.length) return 'complete'
    if (done > 0) return 'partial'
    return 'pending'
  }

  return (
    <svg
      viewBox={`${-PAD} ${-PAD} ${W + PAD * 2} ${H + PAD * 2}`}
      style={{ width: '100%', maxWidth: W + PAD * 2, display: 'block', margin: '0 auto' }}
      overflow="visible"
    >
      <defs>
        <radialGradient id="sgCyl" cx="38%" cy="35%">
          <stop offset="0%" stopColor="#2a7ab5" />
          <stop offset="100%" stopColor="#174f77" />
        </radialGradient>
      </defs>

      {/* Verbindungslinien */}
      {druckwerke.map((dw, i) => {
        const angle = (i * 2 * Math.PI / n) - Math.PI / 2
        const c = Math.cos(angle), s = Math.sin(angle)
        return (
          <line key={`l-${dw.id}`}
            x1={CX + (CYLL_R + 2) * c} y1={CY + (CYLL_R + 2) * s}
            x2={CX + (DB_DIST - dbR - 2) * c} y2={CY + (DB_DIST - dbR - 2) * s}
            stroke="#dde4ef" strokeWidth="1.5" strokeDasharray="4 3"
          />
        )
      })}

      {/* Zentralzylinder */}
      <circle cx={CX} cy={CY} r={CYLL_R} fill="url(#sgCyl)" />
      <text x={CX} y={CY - 5} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="7" fontWeight="700" letterSpacing="1" fontFamily="Arial, sans-serif">ZENTRAL</text>
      <text x={CX} y={CY + 6} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="7" fontWeight="700" letterSpacing="1" fontFamily="Arial, sans-serif">ZYLINDER</text>

      {/* Druckwerke */}
      {druckwerke.map((dw, i) => {
        const angle = (i * 2 * Math.PI / n) - Math.PI / 2
        const c = Math.cos(angle), s = Math.sin(angle)
        const dbX = CX + DB_DIST * c, dbY = CY + DB_DIST * s
        const fX  = CX + F_DIST  * c, fY  = CY + F_DIST  * s
        const lX  = CX + LBL_DIST * c, lY = CY + LBL_DIST * s

        const isCurrent = dw.id === currentDwId
        const overall = dwOverallStatus(dw.id)
        const dbStatus = slotStatus(dw.id, 'Druckbild')
        const fStatus  = slotStatus(dw.id, 'Farbe')
        const color = dw.color_hint ?? '#003366'

        const ta = c > 0.25 ? 'start' : c < -0.25 ? 'end' : 'middle'
        const db = s > 0.25 ? 'hanging' : s < -0.25 ? 'auto' : 'central'

        // Farbe des Druckbild-Kreises: wenn Fortschritt vorhanden → Statusfarbe, sonst DW-Farbe
        const dbFill = dbStatus && dbStatus !== 'pending' ? STEP_FILL[dbStatus] : color
        const fFill  = fStatus  && fStatus  !== 'pending' ? STEP_FILL[fStatus]  : hexAlpha(color, 0.55)

        return (
          <g key={dw.id} onClick={() => onSelect(dw.id)} style={{ cursor: 'pointer' }}>
            {/* Highlight-Ring für aktives DW */}
            {isCurrent && (
              <circle cx={dbX} cy={dbY} r={dbR + 6}
                fill="none" stroke="#0099cc" strokeWidth="2.5" strokeDasharray="5 3" opacity="0.7"
              />
            )}

            {/* Farbe-Kreis */}
            {fStatus !== null && (
              <circle cx={fX} cy={fY} r={fR}
                fill={fFill}
                stroke={isCurrent ? '#0099cc' : 'rgba(255,255,255,0.3)'}
                strokeWidth={isCurrent ? 2 : 1.5}
              />
            )}

            {/* Druckbild-Kreis */}
            {dbStatus !== null && (
              <circle cx={dbX} cy={dbY} r={dbR}
                fill={dbFill}
                stroke={isCurrent ? '#0099cc' : 'rgba(255,255,255,0.3)'}
                strokeWidth={isCurrent ? 2 : 1.5}
              />
            )}

            {/* Fortschritt-Indikator oben rechts */}
            {overall === 'complete' && (
              <g>
                <circle cx={dbX + SQRT2 * dbR} cy={dbY - SQRT2 * dbR} r={5.5} fill="#34d399" stroke="white" strokeWidth="1.5" />
                <text x={dbX + SQRT2 * dbR} y={dbY - SQRT2 * dbR} textAnchor="middle" dominantBaseline="central" fontSize="7" fill="white" fontWeight="700">✓</text>
              </g>
            )}
            {overall === 'partial' && (
              <circle cx={dbX + SQRT2 * dbR} cy={dbY - SQRT2 * dbR} r={4} fill="#f59e0b" stroke="white" strokeWidth="1.5" />
            )}

            {/* Label */}
            {n <= 14 && (
              <text x={lX} y={lY} textAnchor={ta} dominantBaseline={db}
                fill={isCurrent ? '#003366' : '#9ca3af'}
                fontSize={n <= 8 ? 9.5 : 8}
                fontWeight={isCurrent ? '700' : '400'}
                fontFamily="Arial, sans-serif"
              >
                {dw.label ?? `DW ${dw.position}`}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

export function SetupWizard({
  setupId,
  setupName,
  jobNumber,
  status: initialStatus,
  machineName,
  machineId,
  templateName,
  druckwerke,
  stepsByDW: initialStepsByDW,
  assets,
  canEdit,
}: {
  setupId: string
  setupName: string
  jobNumber: string | null
  status: string
  machineName: string
  machineId: string
  templateName: string | null
  druckwerke: DW[]
  stepsByDW: Record<string, Step[]>
  assets: Asset[]
  canEdit: boolean
}) {
  const router = useRouter()
  const t = useTranslations('flexodruck')
  const [currentDwIdx, setCurrentDwIdx] = useState(0)
  const [stepsByDW, setStepsByDW] = useState<Record<string, Step[]>>(initialStepsByDW)
  const [status, setStatus] = useState(initialStatus)
  const [savingStepId, setSavingStepId] = useState<string | null>(null)
  const [pickerStepId, setPickerStepId] = useState<string | null>(null)
  const [pickerSearch, setPickerSearch] = useState('')
  const [completing, setCompleting] = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)

  const currentDW = druckwerke[currentDwIdx]
  const currentSteps = currentDW ? (stepsByDW[currentDW.id] ?? []) : []

  // Progress: nur sichtbare Druckwerke (ohne DW ohne Assets)
  const visibleDwIds = new Set(druckwerke.map(d => d.id))
  const allSteps = Object.entries(stepsByDW)
    .filter(([dwId]) => visibleDwIds.has(dwId))
    .flatMap(([, steps]) => steps)
  const doneCount = allSteps.filter(s => s.status === 'installed' || s.status === 'verified' || s.status === 'skipped').length
  const totalCount = allSteps.length
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  // Status pro DW
  const dwProgress = useCallback((dwId: string) => {
    const steps = stepsByDW[dwId] ?? []
    if (steps.length === 0) return 'empty'
    const done = steps.filter(s => ['installed', 'verified', 'skipped'].includes(s.status)).length
    if (done === steps.length) return 'complete'
    if (done > 0) return 'partial'
    return 'pending'
  }, [stepsByDW])

  async function updateStep(step: Step, newStatus: Step['status'], newAssetId?: string | null) {
    setSavingStepId(step.id)
    setPickerStepId(null)

    const body: Record<string, unknown> = { step_id: step.id, status: newStatus }
    if (newAssetId !== undefined) body.asset_id = newAssetId

    const res = await fetch(`/api/flexodruck/setups/${setupId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
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
      if (idx >= 0) {
        dwSteps[idx] = {
          ...dwSteps[idx],
          status: newStatus,
          asset_id: newAssetId !== undefined ? (newAssetId ?? null) : step.asset_id,
          assets: updatedAsset,
        }
      }
      return { ...prev, [step.druckwerk_id]: dwSteps }
    })
  }

  async function startSetup() {
    if (status !== 'planned') return
    const res = await fetch(`/api/flexodruck/setups/${setupId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'in_progress' }),
    })
    if (res.ok) setStatus('in_progress')
  }

  async function completeSetup() {
    setCompleting(true)
    const res = await fetch(`/api/flexodruck/setups/${setupId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    })
    setCompleting(false)
    if (res.ok) {
      setStatus('completed')
      setShowCompleted(true)
    }
  }

  const statusColor: Record<string, string> = {
    planned: '#0099cc', in_progress: '#f59e0b', completed: '#34d399', cancelled: '#6b7280',
  }
  const statusLabel: Record<string, string> = {
    planned: t('planned'), in_progress: t('inProgress'), completed: t('completed'), cancelled: t('cancelled'),
  }

  const stepStatusIcon: Record<string, string> = {
    pending: '○', installed: '●', verified: '✓', skipped: '–',
  }
  const stepStatusColor: Record<string, string> = {
    pending: '#d1d5db', installed: '#0099cc', verified: '#34d399', skipped: '#9ca3af',
  }

  const allDone = progressPct === 100

  if (showCompleted) {
    return (
      <div style={{ padding: '60px 24px', maxWidth: 560, textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#34d399', margin: '0 0 8px', fontFamily: 'Arial, sans-serif' }}>
          {t('setupComplete')}
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 24px', fontFamily: 'Arial, sans-serif' }}>
          {setupName}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link href={`/flexodruck/maschinen/${machineId}`}
            style={{ background: '#003366', color: 'white', padding: '12px 24px', borderRadius: 50, fontSize: 14, fontWeight: 700, fontFamily: 'Arial, sans-serif', textDecoration: 'none' }}>
            {t('toMachine')}
          </Link>
          <Link href="/flexodruck"
            style={{ background: '#f4f6f9', color: '#003366', padding: '12px 24px', borderRadius: 50, fontSize: 14, fontWeight: 700, fontFamily: 'Arial, sans-serif', textDecoration: 'none', border: '1px solid #c8d4e8' }}>
            {t('overview')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px 24px 80px', maxWidth: 760 }}>
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
          <p style={{ fontSize: 12, color: '#6b7280', margin: 0, fontFamily: 'Arial, sans-serif' }}>
            {machineName}
            {templateName && ` · ${templateName}`}
          </p>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
          color: statusColor[status], background: statusColor[status] + '18',
          fontFamily: 'Arial, sans-serif', flexShrink: 0,
        }}>
          {statusLabel[status] ?? status}
        </span>
      </div>

      {/* Progress Bar */}
      <div style={{ background: '#e8edf4', borderRadius: 10, height: 10, marginBottom: 8, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 10,
          background: allDone ? '#34d399' : '#0099cc',
          width: `${progressPct}%`,
          transition: 'width 0.3s ease',
        }} />
      </div>
      <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 20px', fontFamily: 'Arial, sans-serif' }}>
        {t('stepsCompleted', { done: doneCount, total: totalCount, pct: progressPct })}
      </p>

      {/* Starte Setup wenn noch "planned" */}
      {status === 'planned' && canEdit && (
        <div style={{
          background: '#e8f4fd', borderRadius: 12, border: '1px solid #bfdbfe',
          padding: '16px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: '#003366', fontFamily: 'Arial, sans-serif' }}>{t('readyToStart')}</p>
            <p style={{ margin: 0, fontSize: 12, color: '#6b7280', fontFamily: 'Arial, sans-serif' }}>{t('readyToStartDesc')}</p>
          </div>
          <button type="button" onClick={startSetup}
            style={{
              background: '#003366', color: 'white', padding: '10px 20px',
              borderRadius: 50, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 700, fontFamily: 'Arial, sans-serif', flexShrink: 0,
            }}>
            ▶ {t('startButton')}
          </button>
        </div>
      )}

      {/* Maschinendiagramm mit Fortschritt */}
      <div style={{
        background: 'white', borderRadius: 16, border: '1px solid #c8d4e8',
        padding: '16px 8px 12px', marginBottom: 20,
      }}>
        <SetupDiagram
          druckwerke={druckwerke}
          stepsByDW={stepsByDW}
          currentDwId={currentDW?.id ?? ''}
          onSelect={id => {
            const idx = druckwerke.findIndex(d => d.id === id)
            if (idx >= 0) setCurrentDwIdx(idx)
          }}
        />
        {/* Mini-Legende */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 8, flexWrap: 'wrap' }}>
          {[
            { color: '#d1d5db', label: 'Offen' },
            { color: '#0099cc', label: 'Eingebaut' },
            { color: '#34d399', label: 'Verifiziert' },
          ].map(({ color, label }) => (
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
              borderRadius: '12px 12px 0 0', border: '1px solid #c8d4e8',
              borderBottom: 'none', padding: '14px 18px',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: currentDW.color_hint ?? '#003366',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 14, fontWeight: 900, color: 'white', fontFamily: 'Arial, sans-serif' }}>{currentDW.position}</span>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#003366', fontFamily: 'Arial, sans-serif' }}>
                  {currentDW.label ?? `Druckwerk ${currentDW.position}`}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: '#6b7280', fontFamily: 'Arial, sans-serif' }}>
                  {currentSteps.filter(s => ['installed', 'verified', 'skipped'].includes(s.status)).length}/{currentSteps.length} {t('step')}
                </p>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                {currentDwIdx > 0 && (
                  <button type="button" onClick={() => setCurrentDwIdx(i => i - 1)}
                    style={{ background: 'white', border: '1px solid #c8d4e8', borderRadius: 20, padding: '4px 12px', cursor: 'pointer', fontSize: 12, color: '#6b7280', fontFamily: 'Arial, sans-serif' }}>
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
            <div style={{ background: 'white', border: '1px solid #c8d4e8', borderRadius: '0 0 12px 12px', overflow: 'hidden' }}>
              {currentSteps.length === 0 ? (
                <p style={{ padding: '24px', color: '#6b7280', fontSize: 13, textAlign: 'center', margin: 0, fontFamily: 'Arial, sans-serif' }}>
                  {t('noStepsForDW')}
                </p>
              ) : (
                currentSteps.map((step, si) => {
                  const isSaving = savingStepId === step.id
                  const isPickerOpen = pickerStepId === step.id
                  const isDone = step.status === 'installed' || step.status === 'verified'
                  const isSkipped = step.status === 'skipped'

                  return (
                    <div key={step.id} style={{
                      padding: '14px 18px',
                      borderBottom: si < currentSteps.length - 1 ? '1px solid #f4f6f9' : 'none',
                      opacity: isSkipped ? 0.6 : 1,
                      background: isDone ? '#f9fffe' : 'white',
                    }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        {/* Status-Icon */}
                        <button
                          type="button"
                          disabled={!canEdit || isSaving}
                          onClick={() => {
                            if (!canEdit || isSaving) return
                            if (step.status === 'pending') updateStep(step, 'installed')
                            else if (step.status === 'installed') updateStep(step, 'verified')
                            else if (step.status === 'verified') updateStep(step, 'pending')
                          }}
                          style={{
                            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                            border: `2px solid ${stepStatusColor[step.status]}`,
                            background: isDone ? stepStatusColor[step.status] + '22' : 'white',
                            cursor: canEdit && !isSaving ? 'pointer' : 'default',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, color: stepStatusColor[step.status], fontWeight: 700,
                            transition: 'all 0.15s',
                          }}
                        >
                          {isSaving ? '…' : stepStatusIcon[step.status]}
                        </button>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <p style={{
                              margin: 0, fontSize: 13, fontWeight: 700, color: '#003366',
                              fontFamily: 'Arial, sans-serif',
                              textDecoration: isSkipped ? 'line-through' : 'none',
                            }}>
                              {step.slot_label}
                            </p>
                            {step.is_fixed && (
                              <span style={{ fontSize: 10, background: '#f4f6f9', color: '#6b7280', padding: '1px 7px', borderRadius: 10, fontFamily: 'Arial, sans-serif', fontWeight: 600 }}>
                                {t('fixed')}
                              </span>
                            )}
                          </div>

                          {/* Asset-Anzeige */}
                          {step.assets ? (
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
                              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#0099cc', flexShrink: 0 }} />
                              <p style={{ margin: 0, fontSize: 12, color: '#0099cc', fontFamily: 'Arial, sans-serif' }}>
                                {step.assets.name}
                                {step.assets.serial_number && ` · ${step.assets.serial_number}`}
                              </p>
                              {canEdit && !step.is_fixed && (
                                <button type="button"
                                  onClick={() => { setPickerStepId(step.id); setPickerSearch('') }}
                                  style={{ fontSize: 10, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Arial, sans-serif' }}>
                                  {t('change')}
                                </button>
                              )}
                            </div>
                          ) : (
                            <div style={{ marginTop: 4 }}>
                              {canEdit && !step.is_fixed ? (
                                <button type="button"
                                  onClick={() => { setPickerStepId(step.id); setPickerSearch('') }}
                                  style={{ fontSize: 11, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Arial, sans-serif', textDecoration: 'underline' }}>
                                  {t('assignAsset')}
                                </button>
                              ) : (
                                <p style={{ margin: 0, fontSize: 11, color: '#d1d5db', fontFamily: 'Arial, sans-serif' }}>{t('noLinkedAsset')}</p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Aktions-Buttons */}
                        {canEdit && (
                          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                            {step.status === 'pending' && (
                              <>
                                <button type="button"
                                  onClick={() => updateStep(step, 'installed')}
                                  disabled={isSaving}
                                  style={{
                                    fontSize: 11, padding: '5px 10px', borderRadius: 20,
                                    background: '#003366', color: 'white', border: 'none',
                                    cursor: 'pointer', fontFamily: 'Arial, sans-serif', fontWeight: 700,
                                  }}>
                                  {t('installed')}
                                </button>
                                <button type="button"
                                  onClick={() => updateStep(step, 'skipped')}
                                  disabled={isSaving}
                                  style={{
                                    fontSize: 11, padding: '5px 10px', borderRadius: 20,
                                    background: '#f4f6f9', color: '#6b7280', border: '1px solid #c8d4e8',
                                    cursor: 'pointer', fontFamily: 'Arial, sans-serif',
                                  }}>
                                  –
                                </button>
                              </>
                            )}
                            {step.status === 'installed' && (
                              <button type="button"
                                onClick={() => updateStep(step, 'verified')}
                                disabled={isSaving}
                                style={{
                                  fontSize: 11, padding: '5px 10px', borderRadius: 20,
                                  background: '#d1fae5', color: '#059669', border: 'none',
                                  cursor: 'pointer', fontFamily: 'Arial, sans-serif', fontWeight: 700,
                                }}>
                                ✓ {t('markVerified')}
                              </button>
                            )}
                            {(step.status === 'installed' || step.status === 'verified' || step.status === 'skipped') && (
                              <button type="button"
                                onClick={() => updateStep(step, 'pending')}
                                disabled={isSaving}
                                style={{
                                  fontSize: 11, padding: '5px 10px', borderRadius: 20,
                                  background: '#fff7ed', color: '#9ca3af', border: '1px solid #e8edf4',
                                  cursor: 'pointer', fontFamily: 'Arial, sans-serif',
                                }}>
                                ↺
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Inline Asset Picker */}
                      {isPickerOpen && (
                        <div style={{ marginTop: 10, background: '#f4f6f9', borderRadius: 10, padding: 12 }}>
                          <input
                            autoFocus
                            placeholder={t('searchAsset')}
                            value={pickerSearch}
                            onChange={e => setPickerSearch(e.target.value)}
                            style={{
                              width: '100%', padding: '8px 10px', borderRadius: 6,
                              border: '1px solid #c8d4e8', fontSize: 13, fontFamily: 'Arial, sans-serif',
                              outline: 'none', boxSizing: 'border-box', marginBottom: 8,
                            }}
                          />
                          <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <div onClick={() => updateStep(step, step.status === 'pending' ? 'pending' : step.status, null)}
                              style={{ padding: '7px 10px', cursor: 'pointer', borderRadius: 6, fontSize: 12, color: '#6b7280', fontFamily: 'Arial, sans-serif', fontStyle: 'italic' }}>
                              {t('noAsset')}
                            </div>
                            {assets
                              .filter(a => !pickerSearch || a.name.toLowerCase().includes(pickerSearch.toLowerCase()) || (a.serial_number ?? '').toLowerCase().includes(pickerSearch.toLowerCase()))
                              .slice(0, 50)
                              .map(a => (
                                <div key={a.id}
                                  onClick={() => updateStep(step, 'installed', a.id)}
                                  style={{
                                    padding: '7px 10px', cursor: 'pointer', borderRadius: 6,
                                    background: step.asset_id === a.id ? '#e8f4fd' : 'white',
                                  }}>
                                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#003366', fontFamily: 'Arial, sans-serif' }}>{a.name}</p>
                                  {a.serial_number && <p style={{ margin: 0, fontSize: 10, color: '#6b7280', fontFamily: 'Arial, sans-serif' }}>{a.serial_number}</p>}
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {/* Nächstes DW Button */}
            {currentDwIdx < druckwerke.length - 1 && (
              <button type="button" onClick={() => setCurrentDwIdx(i => i + 1)}
                style={{
                  marginTop: 12, width: '100%', padding: '12px',
                  background: '#f4f6f9', color: '#003366', border: '1px solid #c8d4e8',
                  borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700,
                  fontFamily: 'Arial, sans-serif',
                }}>
                {t('nextToDW')} {druckwerke[currentDwIdx + 1]?.label ?? `DW ${druckwerke[currentDwIdx + 1]?.position}`} →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Rüstvorgang abschließen */}
      {canEdit && status === 'in_progress' && allDone && (
        <div style={{
          marginTop: 24, background: '#d1fae5', borderRadius: 14,
          border: '2px solid #34d399', padding: '20px 24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 700, color: '#065f46', fontFamily: 'Arial, sans-serif' }}>
              {t('allStepsDone')}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: '#047857', fontFamily: 'Arial, sans-serif' }}>
              {t('allStepsDoneDesc')}
            </p>
          </div>
          <button type="button" onClick={completeSetup} disabled={completing}
            style={{
              background: completing ? '#9ca3af' : '#059669', color: 'white',
              padding: '12px 24px', borderRadius: 50, border: 'none',
              fontSize: 14, fontWeight: 700, cursor: completing ? 'default' : 'pointer',
              fontFamily: 'Arial, sans-serif', flexShrink: 0,
            }}>
            {completing ? t('saving') : `✓ ${t('completeButton')}`}
          </button>
        </div>
      )}

      {/* Abgeschlossen-Banner */}
      {status === 'completed' && (
        <div style={{ marginTop: 24, background: '#d1fae5', borderRadius: 14, border: '1px solid #34d399', padding: '16px 20px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#065f46', fontFamily: 'Arial, sans-serif' }}>
            ✓ {t('setupCompletedBanner')}
          </p>
        </div>
      )}
    </div>
  )
}
