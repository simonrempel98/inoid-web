'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

type Asset = { id: string; name: string; serial_number: string | null }
type Druckwerk = { id: string; position: number; label: string | null; color_hint: string | null }
type Slot = { id: string; label: string; sort_order: number }
type AssignmentMap = Record<string, { asset_id: string | null; asset_name: string | null; serial_number: string | null }>

export function TemplateDetailClient({
  templateId,
  templateName,
  templateDescription,
  isActive,
  machineId,
  machineName,
  druckwerke,
  slots,
  assignments: initialAssignments,
  assets,
  canEdit,
  orgId,
  sharedMachines,
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
  // Picker state: which cell is open
  const [pickerKey, setPickerKey] = useState<string | null>(null)
  const [pickerSearch, setPickerSearch] = useState('')

  const openPicker = useCallback((key: string) => {
    setPickerKey(key)
    setPickerSearch('')
  }, [])

  const closePicker = useCallback(() => setPickerKey(null), [])

  async function assignAsset(slotId: string, druckwerkId: string, asset: Asset | null) {
    const key = `${slotId}__${druckwerkId}`
    setSavingKey(key)
    setPickerKey(null)

    const res = await fetch(`/api/flexodruck/templates/${templateId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assignment: {
          template_id: templateId,
          slot_id: slotId,
          druckwerk_id: druckwerkId,
          asset_id: asset?.id ?? null,
          org_id: orgId,
        },
      }),
    })

    setSavingKey(null)
    if (res.ok) {
      setAssignments(prev => ({
        ...prev,
        [key]: {
          asset_id: asset?.id ?? null,
          asset_name: asset?.name ?? null,
          serial_number: asset?.serial_number ?? null,
        },
      }))
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
            {sharedMachines.map(m => (
              <span key={m} style={{ fontSize: 11, background: '#f4f6f9', color: '#6b7280', padding: '2px 10px', borderRadius: 20, fontFamily: 'Arial, sans-serif' }}>
                + {m}
              </span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          {canEdit && (
            <Link href={`/flexodruck/vorlagen/${templateId}/bearbeiten`}
              style={{
                background: '#f4f6f9', color: '#003366',
                padding: '10px 18px', borderRadius: 50,
                border: '1px solid #c8d4e8',
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

      {/* Assignment Matrix */}
      {slots.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #c8d4e8', padding: '32px', textAlign: 'center' }}>
          <p style={{ color: '#6b7280', fontSize: 14, margin: 0, fontFamily: 'Arial, sans-serif' }}>
            {t('noSlotsYet')}
          </p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #c8d4e8', overflow: 'auto' }}>
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
                  <th key={dw.id} style={{ ...cell, background: dw.color_hint ? dw.color_hint + '28' : '#f4f6f9', textAlign: 'center', minWidth: 150 }}>
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
                    const asgn = assignments[key]
                    const isSaving = savingKey === key
                    const isOpen = pickerKey === key

                    return (
                      <td key={dw.id} style={{ ...cell, textAlign: 'center', position: 'relative' }}>
                        {isSaving ? (
                          <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'Arial, sans-serif' }}>…</span>
                        ) : asgn?.asset_id ? (
                          <div>
                            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#003366', fontFamily: 'Arial, sans-serif' }}>
                              {asgn.asset_name}
                            </p>
                            {asgn.serial_number && (
                              <p style={{ margin: 0, fontSize: 10, color: '#6b7280', fontFamily: 'Arial, sans-serif' }}>{asgn.serial_number}</p>
                            )}
                            {canEdit && (
                              <button type="button" onClick={() => openPicker(key)}
                                style={{ fontSize: 10, color: '#0099cc', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Arial, sans-serif', marginTop: 2 }}>
                                {t('change')}
                              </button>
                            )}
                          </div>
                        ) : canEdit ? (
                          <button type="button" onClick={() => openPicker(key)}
                            style={{
                              fontSize: 12, color: '#9ca3af', background: '#f9fafb',
                              border: '1px dashed #d1d5db', borderRadius: 6,
                              padding: '6px 10px', cursor: 'pointer', fontFamily: 'Arial, sans-serif',
                              width: '100%',
                            }}>
                            {t('addAsset')}
                          </button>
                        ) : (
                          <span style={{ fontSize: 11, color: '#d1d5db', fontFamily: 'Arial, sans-serif' }}>–</span>
                        )}

                        {/* Inline Picker */}
                        {isOpen && (
                          <div style={{
                            position: 'fixed', zIndex: 1000,
                            background: 'white', borderRadius: 12, border: '1px solid #c8d4e8',
                            boxShadow: '0 8px 32px rgba(0,40,100,0.18)',
                            width: 280, padding: 12,
                            top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#003366', fontFamily: 'Arial, sans-serif' }}>
                                {slot.label} · {dw.label ?? `DW ${dw.position}`}
                              </p>
                              <button type="button" onClick={closePicker}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#6b7280' }}>×</button>
                            </div>
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
                            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                              <div onClick={() => assignAsset(slot.id, dw.id, null)}
                                style={{ padding: '7px 10px', cursor: 'pointer', borderRadius: 6, fontSize: 12, color: '#6b7280', fontFamily: 'Arial, sans-serif', fontStyle: 'italic' }}>
                                {t('noAsset')}
                              </div>
                              {filteredAssets.slice(0, 50).map(a => (
                                <div key={a.id} onClick={() => assignAsset(slot.id, dw.id, a)}
                                  style={{
                                    padding: '7px 10px', cursor: 'pointer', borderRadius: 6,
                                    background: asgn?.asset_id === a.id ? '#e8f4fd' : 'transparent',
                                  }}>
                                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#003366', fontFamily: 'Arial, sans-serif' }}>{a.name}</p>
                                  {a.serial_number && <p style={{ margin: 0, fontSize: 10, color: '#6b7280', fontFamily: 'Arial, sans-serif' }}>{a.serial_number}</p>}
                                </div>
                              ))}
                            </div>
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

      {/* Feste Einbauten Info */}
      <div style={{ marginTop: 16, background: '#f4f6f9', borderRadius: 12, border: '1px solid #c8d4e8', padding: '12px 16px' }}>
        <p style={{ margin: 0, fontSize: 12, color: '#6b7280', fontFamily: 'Arial, sans-serif' }}>
          <strong style={{ color: '#003366' }}>{t('fixedSlots')}</strong> {t('fixedSlotsInfo')}
        </p>
      </div>
    </div>
  )
}
