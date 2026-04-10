'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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

  // Progress: gesamt
  const allSteps = Object.values(stepsByDW).flat()
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
    planned: 'Geplant', in_progress: 'In Bearbeitung', completed: 'Abgeschlossen', cancelled: 'Abgebrochen',
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
          Rüstvorgang abgeschlossen!
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 24px', fontFamily: 'Arial, sans-serif' }}>
          {setupName} wurde erfolgreich abgeschlossen.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link href={`/flexodruck/maschinen/${machineId}`}
            style={{ background: '#003366', color: 'white', padding: '12px 24px', borderRadius: 50, fontSize: 14, fontWeight: 700, fontFamily: 'Arial, sans-serif', textDecoration: 'none' }}>
            Zur Maschine
          </Link>
          <Link href="/flexodruck"
            style={{ background: '#f4f6f9', color: '#003366', padding: '12px 24px', borderRadius: 50, fontSize: 14, fontWeight: 700, fontFamily: 'Arial, sans-serif', textDecoration: 'none', border: '1px solid #c8d4e8' }}>
            Übersicht
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
        {doneCount} von {totalCount} Schritten erledigt ({progressPct}%)
      </p>

      {/* Starte Setup wenn noch "planned" */}
      {status === 'planned' && canEdit && (
        <div style={{
          background: '#e8f4fd', borderRadius: 12, border: '1px solid #bfdbfe',
          padding: '16px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: '#003366', fontFamily: 'Arial, sans-serif' }}>Bereit zum Rüsten?</p>
            <p style={{ margin: 0, fontSize: 12, color: '#6b7280', fontFamily: 'Arial, sans-serif' }}>Starte den Rüstvorgang, um die Schritte abzuhaken.</p>
          </div>
          <button type="button" onClick={startSetup}
            style={{
              background: '#003366', color: 'white', padding: '10px 20px',
              borderRadius: 50, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 700, fontFamily: 'Arial, sans-serif', flexShrink: 0,
            }}>
            ▶ Starten
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 16 }}>
        {/* DW-Navigation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {druckwerke.map((dw, idx) => {
            const prog = dwProgress(dw.id)
            const isActive = idx === currentDwIdx
            return (
              <button
                key={dw.id}
                type="button"
                onClick={() => setCurrentDwIdx(idx)}
                style={{
                  padding: '10px 12px', borderRadius: 10, border: 'none',
                  cursor: 'pointer', textAlign: 'left',
                  background: isActive
                    ? (dw.color_hint ? dw.color_hint + '28' : '#e8f4fd')
                    : 'white',
                  borderLeft: isActive ? `4px solid ${dw.color_hint ?? '#0099cc'}` : '4px solid transparent',
                  boxShadow: isActive ? '0 2px 8px rgba(0,51,102,0.1)' : 'none',
                  transition: 'all 0.15s',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#003366', fontFamily: 'Arial, sans-serif' }}>
                      {dw.label ?? `DW ${dw.position}`}
                    </p>
                  </div>
                  <span style={{ fontSize: 14 }}>
                    {prog === 'complete' ? '✓' : prog === 'partial' ? '◐' : '○'}
                  </span>
                </div>
                {prog === 'complete' && (
                  <div style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: '50%', background: '#34d399' }} />
                )}
              </button>
            )
          })}
        </div>

        {/* Aktives Druckwerk */}
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
                  {currentSteps.filter(s => ['installed', 'verified', 'skipped'].includes(s.status)).length}/{currentSteps.length} Schritte
                </p>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                {currentDwIdx > 0 && (
                  <button type="button" onClick={() => setCurrentDwIdx(i => i - 1)}
                    style={{ background: 'white', border: '1px solid #c8d4e8', borderRadius: 20, padding: '4px 12px', cursor: 'pointer', fontSize: 12, color: '#6b7280', fontFamily: 'Arial, sans-serif' }}>
                    ← zurück
                  </button>
                )}
                {currentDwIdx < druckwerke.length - 1 && (
                  <button type="button" onClick={() => setCurrentDwIdx(i => i + 1)}
                    style={{ background: '#003366', color: 'white', border: 'none', borderRadius: 20, padding: '4px 12px', cursor: 'pointer', fontSize: 12, fontFamily: 'Arial, sans-serif' }}>
                    weiter →
                  </button>
                )}
              </div>
            </div>

            {/* Schritte */}
            <div style={{ background: 'white', border: '1px solid #c8d4e8', borderRadius: '0 0 12px 12px', overflow: 'hidden' }}>
              {currentSteps.length === 0 ? (
                <p style={{ padding: '24px', color: '#6b7280', fontSize: 13, textAlign: 'center', margin: 0, fontFamily: 'Arial, sans-serif' }}>
                  Keine Schritte für dieses Druckwerk.
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
                                fest
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
                                  ändern
                                </button>
                              )}
                            </div>
                          ) : (
                            <div style={{ marginTop: 4 }}>
                              {canEdit && !step.is_fixed ? (
                                <button type="button"
                                  onClick={() => { setPickerStepId(step.id); setPickerSearch('') }}
                                  style={{ fontSize: 11, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Arial, sans-serif', textDecoration: 'underline' }}>
                                  Asset zuweisen
                                </button>
                              ) : (
                                <p style={{ margin: 0, fontSize: 11, color: '#d1d5db', fontFamily: 'Arial, sans-serif' }}>Kein Asset verknüpft</p>
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
                                  Eingebaut
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
                                ✓ Verifizieren
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
                            placeholder="Asset suchen…"
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
                              Kein Asset
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
                Weiter zu {druckwerke[currentDwIdx + 1]?.label ?? `DW ${druckwerke[currentDwIdx + 1]?.position}`} →
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
              Alle Schritte erledigt!
            </p>
            <p style={{ margin: 0, fontSize: 12, color: '#047857', fontFamily: 'Arial, sans-serif' }}>
              Der Rüstvorgang kann jetzt abgeschlossen werden.
            </p>
          </div>
          <button type="button" onClick={completeSetup} disabled={completing}
            style={{
              background: completing ? '#9ca3af' : '#059669', color: 'white',
              padding: '12px 24px', borderRadius: 50, border: 'none',
              fontSize: 14, fontWeight: 700, cursor: completing ? 'default' : 'pointer',
              fontFamily: 'Arial, sans-serif', flexShrink: 0,
            }}>
            {completing ? 'Wird gespeichert…' : '✓ Abschließen'}
          </button>
        </div>
      )}

      {/* Abgeschlossen-Banner */}
      {status === 'completed' && (
        <div style={{ marginTop: 24, background: '#d1fae5', borderRadius: 14, border: '1px solid #34d399', padding: '16px 20px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#065f46', fontFamily: 'Arial, sans-serif' }}>
            ✓ Rüstvorgang abgeschlossen
          </p>
        </div>
      )}
    </div>
  )
}
