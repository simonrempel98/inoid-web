'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { EVENT_TYPES, type EventType } from '@/lib/service-types'

const PRESET_COLORS = [
  '#2980B9', '#27AE60', '#F39C12', '#E74C3C', '#8E44AD',
  '#16A085', '#E67E22', '#1ABC9C', '#34495E', '#C0392B',
]

const EMOJI_SUGGESTIONS = [
  '🔧', '🔍', '🛠️', '⚙️', '🎨', '🧹', '🏗️', '⚠️', '🔒', '📝',
  '🔬', '💡', '🔌', '📐', '🏷️', '🚧', '🧪', '📦', '🔋', '💧',
  '🌡️', '🔑', '📋', '🛡️', '🔦', '🧲', '⚡', '🌀', '🔩', '🪛',
]

export default function EventTypesPage() {
  const router = useRouter()
  const supabase = createClient()

  const [customTypes, setCustomTypes] = useState<EventType[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const [newLabel, setNewLabel] = useState('')
  const [newColor, setNewColor] = useState('#2980B9')
  const [newIcon, setNewIcon] = useState('🔧')

  useEffect(() => {
    supabase.from('organizations').select('settings').single().then(({ data }) => {
      const ct = (data?.settings as { custom_event_types?: EventType[] })?.custom_event_types ?? []
      setCustomTypes(ct)
      setLoading(false)
    })
  }, [])

  async function save(updated: EventType[]) {
    setSaving(true)
    // Bestehende settings lesen um andere keys nicht zu überschreiben
    const { data: org } = await supabase.from('organizations').select('settings').single()
    const existing = (org?.settings as Record<string, unknown>) ?? {}
    await supabase.from('organizations').update({
      settings: { ...existing, custom_event_types: updated }
    })
    setCustomTypes(updated)
    setSaving(false)
  }

  async function addType() {
    if (!newLabel.trim()) return
    const value = newLabel.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    if (customTypes.some(t => t.value === value)) return
    const updated = [...customTypes, { value, label: newLabel.trim(), color: newColor, icon: newIcon }]
    await save(updated)
    setNewLabel('')
    setNewColor('#2980B9')
    setNewIcon('🔧')
    setShowForm(false)
  }

  async function removeType(value: string) {
    await save(customTypes.filter(t => t.value !== value))
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: 600, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#003366" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#000', margin: 0 }}>Event-Typen</h1>
      </div>

      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* System-Typen */}
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #c8d4e8', overflow: 'hidden' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#96aed2', padding: '12px 16px 8px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            System-Typen
          </p>
          {EVENT_TYPES.map((t, i) => (
            <div key={t.value} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px',
              borderTop: i > 0 ? '1px solid #f4f6f9' : 'none',
            }}>
              <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{t.icon}</span>
              <span style={{ flex: 1, fontSize: 14, color: '#000', fontWeight: 600 }}>{t.label}</span>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                backgroundColor: `${t.color}20`, color: t.color,
              }}>{t.label}</span>
              <span style={{ fontSize: 11, color: '#96aed2', background: '#f4f6f9', padding: '2px 8px', borderRadius: 6 }}>System</span>
            </div>
          ))}
        </div>

        {/* Eigene Typen */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#000', margin: 0 }}>Eigene Typen</h2>
            <button type="button" onClick={() => setShowForm(v => !v)}
              style={{ padding: '8px 16px', borderRadius: 50, border: 'none', background: '#003366', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              + Neu
            </button>
          </div>

          {/* Formular */}
          {showForm && (
            <div style={{ background: 'white', borderRadius: 14, padding: 16, border: '1px solid #c8d4e8', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Bezeichnung */}
              <div>
                <label style={labelStyle}>Bezeichnung</label>
                <input
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  style={inputStyle}
                  placeholder="z.B. Kalibrierung, TÜV, Inspektion…"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && addType()}
                />
              </div>

              {/* Icon wählen */}
              <div>
                <label style={labelStyle}>Icon</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  {EMOJI_SUGGESTIONS.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewIcon(emoji)}
                      style={{
                        width: 36, height: 36, borderRadius: 8, border: 'none',
                        background: newIcon === emoji ? '#f0f4ff' : '#f4f6f9',
                        cursor: 'pointer', fontSize: 18,
                        outline: newIcon === emoji ? '2px solid #003366' : 'none',
                        outlineOffset: 1,
                      }}
                    >{emoji}</button>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: '#96aed2' }}>oder eingeben:</span>
                  <input
                    value={newIcon}
                    onChange={e => setNewIcon(e.target.value)}
                    style={{ ...inputStyle, width: 64, textAlign: 'center', fontSize: 18 }}
                    maxLength={2}
                  />
                </div>
              </div>

              {/* Farbe */}
              <div>
                <label style={labelStyle}>Farbe</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  {PRESET_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setNewColor(c)}
                      style={{
                        width: 28, height: 28, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
                        outline: newColor === c ? `3px solid ${c}` : 'none', outlineOffset: 2,
                      }} />
                  ))}
                  <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)}
                    style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #c8d4e8', padding: 2, cursor: 'pointer', background: 'none' }} />
                </div>
              </div>

              {/* Vorschau */}
              {newLabel && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: '#96aed2' }}>Vorschau:</span>
                  <span style={{
                    fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
                    backgroundColor: `${newColor}20`, color: newColor,
                  }}>
                    {newIcon} {newLabel}
                  </span>
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setShowForm(false)}
                  style={{ flex: 1, padding: '10px', borderRadius: 50, border: '1px solid #c8d4e8', background: 'white', color: '#666', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  Abbrechen
                </button>
                <button onClick={addType} disabled={!newLabel.trim() || saving}
                  style={{ flex: 2, padding: '10px', borderRadius: 50, border: 'none', background: !newLabel.trim() ? '#c8d4e8' : '#003366', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  {saving ? 'Wird gespeichert…' : 'Typ anlegen'}
                </button>
              </div>
            </div>
          )}

          {/* Liste */}
          {loading ? (
            <p style={{ color: '#96aed2', fontSize: 13, textAlign: 'center' }}>Lädt…</p>
          ) : customTypes.length === 0 && !showForm ? (
            <div style={{ background: 'white', borderRadius: 14, padding: 32, border: '1px solid #c8d4e8', textAlign: 'center' }}>
              <p style={{ color: '#666', fontSize: 14, margin: '0 0 12px' }}>Noch keine eigenen Typen</p>
              <button onClick={() => setShowForm(true)}
                style={{ padding: '10px 20px', borderRadius: 50, border: 'none', background: '#003366', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                + Ersten anlegen
              </button>
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: 14, border: '1px solid #c8d4e8', overflow: 'hidden' }}>
              {customTypes.map((t, i) => (
                <div key={t.value} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px',
                  borderTop: i > 0 ? '1px solid #f4f6f9' : 'none',
                }}>
                  <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{t.icon}</span>
                  <span style={{ flex: 1, fontSize: 14, color: '#000', fontWeight: 600 }}>{t.label}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                    backgroundColor: `${t.color}20`, color: t.color,
                  }}>{t.label}</span>
                  <button type="button" onClick={() => removeType(t.value)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: 18, padding: '0 4px' }}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 700,
  color: '#003366', marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 10,
  border: '1px solid #c8d4e8', fontSize: 14, fontFamily: 'Arial, sans-serif',
  backgroundColor: 'white', color: '#000', outline: 'none', boxSizing: 'border-box',
}
