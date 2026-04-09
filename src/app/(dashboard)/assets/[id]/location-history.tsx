'use client'

import { useState } from 'react'
import { MapPin, ChevronDown, ChevronUp, MoveRight, Pencil, Check, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { OrgTreePicker, getOrgRefLabel } from '@/components/org-tree-picker'
import type { OrgLocation, OrgHall, OrgArea } from '@/components/org-tree-picker'

type HistoryEntry = {
  id: string
  location: string | null
  changed_at: string
}

export function LocationHistory({ current, history, assetId, locationRef: initialLocationRef, locations, halls, areas }: {
  current: string | null
  history: HistoryEntry[]
  assetId: string
  locationRef: string | null
  locations: OrgLocation[]
  halls: OrgHall[]
  areas: OrgArea[]
}) {
  const t = useTranslations()
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [locationRef, setLocationRef] = useState(initialLocationRef ?? '')
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    const newLabel = getOrgRefLabel(locationRef, locations, halls, areas)
    await supabase.from('assets').update({
      location: newLabel || null,
      location_ref: locationRef || null,
    }).eq('id', assetId)
    setSaving(false)
    setEditing(false)
    router.refresh()
  }

  const handleCancel = () => {
    setLocationRef(initialLocationRef ?? '')
    setEditing(false)
  }

  return (
    <div style={{
      background: 'white', borderRadius: 14,
      border: open ? '1px solid #0099cc' : '1px solid #e8eef6',
      overflow: 'visible', transition: 'border-color 0.15s',
      position: 'relative',
    }}>
      {/* Aktuelle Zeile */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: '#f0f4ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <MapPin size={14} color="#003366" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 11, color: '#96aed2', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('assets.fields.location')}</p>
            {editing ? (
              <div style={{ marginTop: 4 }}>
                <OrgTreePicker
                  locations={locations}
                  halls={halls}
                  areas={areas}
                  value={locationRef}
                  onChange={setLocationRef}
                  inputStyle={{
                    border: '1px solid #0099cc', borderRadius: 8,
                    padding: '6px 10px', fontSize: 13, background: 'white',
                    minWidth: 0,
                  }}
                />
              </div>
            ) : (
              <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 600,
                color: current ? '#000' : '#aab2bf',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {current ?? '–'}
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 8 }}>
          {editing ? (
            <>
              <button onClick={handleCancel} disabled={saving} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', color: '#96aed2', padding: 4,
              }}>
                <X size={16} />
              </button>
              <button onClick={handleSave} disabled={saving} style={{
                background: '#003366', border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', color: 'white',
                borderRadius: 8, padding: '5px 10px', fontSize: 12, fontWeight: 700,
                opacity: saving ? 0.6 : 1,
              }}>
                <Check size={13} style={{ marginRight: 4 }} />
                {saving ? '…' : t('common.save')}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', color: '#96aed2', padding: 4,
              }}>
                <Pencil size={13} />
              </button>
              {history.length > 0 && (
                <div
                  onClick={() => setOpen(o => !o)}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
                >
                  <span style={{ fontSize: 11, color: '#96aed2' }}>{history.length} {t('assets.locationHistory')}</span>
                  {open ? <ChevronUp size={14} color="#96aed2" /> : <ChevronDown size={14} color="#96aed2" />}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Verlauf */}
      {open && !editing && (
        <div style={{ borderTop: '1px solid #e8eef6' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#96aed2', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0, padding: '10px 16px 6px' }}>
            {t('assets.locationHistory')}
          </p>
          {/* Aktuell */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 16px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#27AE60', flexShrink: 0, marginLeft: 3 }} />
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: current ? '#000' : '#aab2bf' }}>{current ?? '–'}</p>
              <p style={{ margin: 0, fontSize: 11, color: '#96aed2' }}>{t('common.active')}</p>
            </div>
          </div>
          {/* Historie */}
          {[...history].map((entry) => (
            <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 16px' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#c8d4e8', flexShrink: 0, marginLeft: 3 }} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 13, color: '#555' }}>{entry.location ?? '–'}</p>
                <p style={{ margin: 0, fontSize: 11, color: '#96aed2' }}>
                  {new Date(entry.changed_at).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </p>
              </div>
              <MoveRight size={12} color="#c8d4e8" />
            </div>
          ))}
          <div style={{ height: 8 }} />
        </div>
      )}
    </div>
  )
}
