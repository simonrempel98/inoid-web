'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

type Asset = { id: string; name: string; serial_number: string | null }
type Druckwerk = { id: string; position: number; label: string | null; color_hint: string | null }
type Slot = { id: string; label: string; sort_order: number }
type CellAssets = { id: string; name: string; serial_number: string | null }[]
type AssignmentMap = Record<string, CellAssets>

export function TemplateDetailClient({
  templateId, templateName, templateDescription, isActive,
  machineId, machineName, druckwerke, slots,
  assignments: initialAssignments, assets, canEdit, orgId, sharedMachines,
}: {
  templateId: string
  templateName: string
  templateDescription: string | null
  isActive: boolean
  machineId: string
  machineName: string
  druckwerke: Druckwerk[]
  slots: Slot[]
  assignments: AssignmentMap
  assets: Asset[]
  canEdit: boolean
  orgId: string
  sharedMachines: string[]
}) {
  const t = useTranslations('flexodruck')
  const [assignments, setAssignments] = useState<AssignmentMap>(initialAssignments)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [pickerKey, setPickerKey] = useState<string | null>(null)
  const [pickerSearch, setPickerSearch] = useState('')
  const [pickerSelected, setPickerSelected] = useState<string[]>([])

  const openPicker = useCallback((key: string, currentAssets: CellAssets) => {
    setPickerKey(key)
    setPickerSearch('')
    setPickerSelected(currentAssets.map(a => a.id))
  }, [])

  const closePicker = useCallback(() => setPickerKey(null), [])

  function toggleAsset(id: string) {
    setPickerSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function saveCell(slotId: string, druckwerkId: string) {
    const key = `${slotId}__${druckwerkId}`
    setSavingKey(key)
    setPickerKey(null)

    const res = await fetch(`/api/flexodruck/templates/${templateId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cell_assets: { slot_id: slotId, druckwerk_id: druckwerkId, asset_ids: pickerSelected, org_id: orgId },
      }),
    })

    setSavingKey(null)
    if (res.ok) {
      const newAssets = pickerSelected.map(id => {
        const a = assets.find(x => x.id === id)
        return { id, name: a?.name ?? '?', serial_number: a?.serial_number ?? null }
      })
      setAssignments(prev => ({ ...prev, [key]: newAssets }))
    }
  }

  const filteredAssets = assets.filter(a =>
    !pickerSearch ||
    a.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
    (a.serial_number ?? '').toLowerCase().includes(pickerSearch.toLowerCase())
  )

  const cell: React.CSSProperties = {
    padding: '8px 10px',
    borderRight: '1px solid #e8edf4',
    borderBottom: '1px solid #e8edf4',
    verticalAlign: 'middle',
    fontFamily: 'Arial, sans-serif',
  }

  return (
    <div style={{ padding: '28px 24px 60px', maxWidth: 960 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <Link href={`/flexodruck/maschinen/${machineId}`}
          style={{ color: '#6b7280', fontSize: 13, textDecoration: 'none', fontFamily: 'Arial, sans-serif' }}>
          ← {machineName}
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#003366', margin: '0 0 2px', fontFamily: 'Arial, sans-serif' }}>
            {templateName}
          </h1>
          {templateDescription && (
            <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 4px', fontFamily: 'Arial, sans-serif' }}>{templateDescription}</p>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
            <span style={{ fontSize: 11, background: '#e8f4fd', color: '#0099cc', padding: '2px 10px', borderRadius: 20, fontFamily: 'Arial, sans-serif', fontWeight: 700 }}>
              {machineName}
            </span>
            {isActive && (
              <span style={{ fontSize: 11, background: '#d1fae5', color: '#34d399', padding: '2px 10px', borderRadius: 20, fontFamily: 'Arial, sans-serif', fontWeight: 700 }}>
                {t('active')}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          {canEdit && (
            <Link href={`/flexodruck/vorlagen/${templateId}/bearbeiten`}
              style={{
                background: '#f4f6f9', color: '#003366',
                padding: '10px 18px', borderRadius: 50,
                border: '1px solid var(--ds-border)',
                fontSize: 13, fontWeight: 700,
                fontFamily: 'Arial, sans-serif', textDecoration: 'none',
              }}>
              ✎ Bearbeiten
            </Link>
          )}
          <Link href={`/flexodruck/ruestung/neu?template=${templateId}&machine=${machineId}`}
            style={{
              background: '#003366', color: 'white',
              padding: '10px 20px', borderRadius: 50,
              fontSize: 13, fontWeight: 700,
              fontFamily: 'Arial, sans-serif', textDecoration: 'none',
            }}>
            ▶ {t('startSetupButton')}
          </Link>
        </div>
      </div>

      {/* Picker-Overlay (außerhalb der Tabelle, zentriert) */}
      {pickerKey && (() => {
        const [slotId, dwId] = pickerKey.split('__')
        const slot = slots.find(s => s.id === slotId)
        const dw = druckwerke.find(d => d.id === dwId)
        return (
          <>
            <div onClick={closePicker} style={{ position: 'fixed', inset: 0, zIndex: 999 }} />
            <div style={{
              position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              zIndex: 1000, background: 'var(--ds-surface)', borderRadius: 16,
              border: '1px solid var(--ds-border)', boxShadow: '0 12px 40px rgba(0,40,100,0.18)',
              width: 'min(340px, calc(100vw - 32px))', padding: 16,
              fontFamily: 'Arial, sans-serif',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>{dw?.label ?? `DW ${dw?.position}`}</p>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: '#003366' }}>{slot?.label}</p>
                </div>
                <button type="button" onClick={closePicker}
                  style={{ background: '#f4f6f9', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', color: '#6b7280', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  ×
                </button>
              </div>

              {/* Ausgewählte Assets */}
              {pickerSelected.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
                  {pickerSelected.map(id => {
                    const a = assets.find(x => x.id === id)
                    return (
                      <div key={id} style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        background: '#003366', color: 'white',
                        borderRadius: 20, padding: '3px 8px 3px 10px', fontSize: 11, fontWeight: 700,
                      }}>
                        <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a?.name ?? id}</span>
                        <button type="button" onClick={() => toggleAsset(id)}
                          style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 16, height: 16, cursor: 'pointer', color: 'white', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, lineHeight: 1, flexShrink: 0 }}>
                          ×
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              <input
                autoFocus
                placeholder={t('searchAsset')}
                value={pickerSearch}
                onChange={e => setPickerSearch(e.target.value)}
                style={{
                  width: '100%', padding: '8px 10px', borderRadius: 8,
                  border: '1px solid var(--ds-border)', fontSize: 13,
                  outline: 'none', boxSizing: 'border-box', marginBottom: 8,
                }}
              />

              <div style={{ maxHeight: 240, overflowY: 'auto', margin: '0 -4px' }}>
                {filteredAssets.slice(0, 80).map(a => {
                  const checked = pickerSelected.includes(a.id)
                  return (
                    <div key={a.id} onClick={() => toggleAsset(a.id)}
                      style={{
                        padding: '8px 10px', cursor: 'pointer', borderRadius: 8, marginBottom: 2,
                        background: checked ? '#e8f4fd' : 'transparent',
                        display: 'flex', alignItems: 'center', gap: 8,
                      }}>
                      <div style={{
                        width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                        border: checked ? 'none' : '2px solid #c8d4e8',
                        background: checked ? '#003366' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {checked && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#003366', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</p>
                        {a.serial_number && <p style={{ margin: 0, fontSize: 10, color: '#6b7280' }}>{a.serial_number}</p>}
                      </div>
                    </div>
                  )
                })}
                {filteredAssets.length === 0 && (
                  <p style={{ padding: '12px 10px', color: '#9ca3af', fontSize: 12, margin: 0 }}>Keine Assets gefunden</p>
                )}
              </div>

              <button type="button"
                onClick={() => saveCell(slotId, dwId)}
                style={{
                  marginTop: 12, width: '100%', background: '#003366', color: 'white',
                  border: 'none', borderRadius: 50, padding: '11px', fontSize: 13,
                  fontWeight: 700, cursor: 'pointer',
                }}>
                Speichern{pickerSelected.length > 0 ? ` (${pickerSelected.length})` : ''}
              </button>
            </div>
          </>
        )
      })()}

      {/* Assignment Matrix */}
      {slots.length === 0 ? (
        <div style={{ background: 'var(--ds-surface)', borderRadius: 14, border: '1px solid var(--ds-border)', padding: '32px', textAlign: 'center' }}>
          <p style={{ color: '#6b7280', fontSize: 14, margin: 0, fontFamily: 'Arial, sans-serif' }}>
            {t('noSlotsYet')}
          </p>
        </div>
      ) : (
        <div style={{ background: 'var(--ds-surface)', borderRadius: 14, border: '1px solid var(--ds-border)', overflow: 'auto' }}>
          <p style={{ margin: 0, padding: '12px 16px', fontSize: 12, color: '#6b7280', fontFamily: 'Arial, sans-serif', borderBottom: '1px solid #e8edf4', background: '#f4f6f9' }}>
            {canEdit ? t('matrixHintEdit') : t('matrixHintView')}
          </p>
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: druckwerke.length * 160 + 140 }}>
            <thead>
              <tr>
                <th style={{ ...cell, background: '#f4f6f9', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: 120 }}>
                  {t('slotTypeHeader')}
                </th>
                {druckwerke.map(dw => (
                  <th key={dw.id} style={{ ...cell, background: dw.color_hint ? dw.color_hint + '28' : '#f4f6f9', textAlign: 'center', minWidth: 160 }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#003366', fontFamily: 'Arial, sans-serif' }}>
                      {dw.label ?? `DW ${dw.position}`}
                    </p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slots.map(slot => (
                <tr key={slot.id}>
                  <td style={{ ...cell, background: '#fafafa' }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#003366' }}>{slot.label}</p>
                  </td>
                  {druckwerke.map(dw => {
                    const key = `${slot.id}__${dw.id}`
                    const cellAssets = assignments[key] ?? []
                    const isSaving = savingKey === key

                    return (
                      <td key={dw.id} style={{ ...cell, textAlign: 'center', verticalAlign: 'top' }}>
                        {isSaving ? (
                          <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'Arial, sans-serif' }}>…</span>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {cellAssets.map((a, i) => (
                              <div key={a.id} style={{
                                background: '#e8f4fd', borderRadius: 6, padding: '4px 8px',
                                border: '1px solid #bfdbfe', textAlign: 'left',
                              }}>
                                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#003366', fontFamily: 'Arial, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                                  {i + 1}. {a.name}
                                </p>
                                {a.serial_number && (
                                  <p style={{ margin: 0, fontSize: 10, color: '#6b7280', fontFamily: 'Arial, sans-serif' }}>{a.serial_number}</p>
                                )}
                              </div>
                            ))}
                            {canEdit && (
                              <button type="button"
                                onClick={() => openPicker(key, cellAssets)}
                                style={{
                                  fontSize: 11, color: cellAssets.length > 0 ? '#0099cc' : '#9ca3af',
                                  background: cellAssets.length > 0 ? 'transparent' : '#f9fafb',
                                  border: cellAssets.length > 0 ? 'none' : '1px dashed #d1d5db',
                                  borderRadius: 6, padding: '5px 8px',
                                  cursor: 'pointer', fontFamily: 'Arial, sans-serif',
                                  width: '100%',
                                }}>
                                {cellAssets.length > 0 ? '+ Asset hinzufügen' : '+ Asset'}
                              </button>
                            )}
                            {!canEdit && cellAssets.length === 0 && (
                              <span style={{ fontSize: 11, color: '#d1d5db', fontFamily: 'Arial, sans-serif' }}>–</span>
                            )}
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
