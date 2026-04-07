'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SYSTEM_STATUSES, type StatusConfig } from '@/lib/asset-statuses'

const PRESET_COLORS = [
  '#27AE60', '#F39C12', '#E67E22', '#E74C3C', '#9B59B6',
  '#2980B9', '#1ABC9C', '#34495E', '#D35400', '#C0392B',
  '#8E44AD', '#16A085', '#27AE60', '#2C3E50', '#F1C40F',
]

export default function StatusesPage() {
  const router = useRouter()
  const supabase = createClient()

  const [customStatuses, setCustomStatuses] = useState<StatusConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Neu anlegen
  const [newLabel, setNewLabel] = useState('')
  const [newColor, setNewColor] = useState('#2980B9')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    supabase.from('organizations').select('settings').single().then(({ data }) => {
      const cs = (data?.settings as { custom_statuses?: StatusConfig[] })?.custom_statuses ?? []
      setCustomStatuses(cs)
      setLoading(false)
    })
  }, [])

  async function save(updated: StatusConfig[]) {
    setSaving(true)
    await supabase.from('organizations').update({
      settings: { custom_statuses: updated }
    })
    setCustomStatuses(updated)
    setSaving(false)
  }

  async function addStatus() {
    if (!newLabel.trim()) return
    const value = newLabel.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    const updated = [...customStatuses, { value, label: newLabel.trim(), color: newColor }]
    await save(updated)
    setNewLabel('')
    setNewColor('#2980B9')
    setShowForm(false)
  }

  async function removeStatus(value: string) {
    await save(customStatuses.filter(s => s.value !== value))
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 10,
    border: '1px solid #c8d4e8', fontSize: 14, fontFamily: 'Arial, sans-serif',
    backgroundColor: 'white', color: '#000', outline: 'none', boxSizing: 'border-box',
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
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#000', margin: 0 }}>Asset-Status</h1>
      </div>

      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* System-Statuses */}
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #c8d4e8', overflow: 'hidden' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#96aed2', padding: '12px 16px 8px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            System-Statuses
          </p>
          {SYSTEM_STATUSES.map((s, i) => (
            <div key={s.value} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px',
              borderTop: i > 0 ? '1px solid #f4f6f9' : 'none',
            }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 14, color: '#000', fontWeight: 600 }}>{s.label}</span>
              <span style={{ fontSize: 11, color: '#96aed2', fontFamily: 'monospace' }}>{s.value}</span>
              <span style={{ fontSize: 11, color: '#96aed2', background: '#f4f6f9', padding: '2px 8px', borderRadius: 6 }}>System</span>
            </div>
          ))}
        </div>

        {/* Eigene Statuses */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#000', margin: 0 }}>Eigene Statuses</h2>
            <button type="button" onClick={() => setShowForm(v => !v)}
              style={{ padding: '8px 16px', borderRadius: 50, border: 'none', background: '#003366', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              + Neu
            </button>
          </div>

          {/* Neu-Formular */}
          {showForm && (
            <div style={{ background: 'white', borderRadius: 14, padding: 16, border: '1px solid #c8d4e8', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#003366', marginBottom: 4 }}>Bezeichnung</label>
                <input value={newLabel} onChange={e => setNewLabel(e.target.value)}
                  style={inputStyle} placeholder="z.B. Im Einsatz" autoFocus
                  onKeyDown={e => e.key === 'Enter' && addStatus()} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#003366', marginBottom: 8 }}>Farbe</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  {PRESET_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setNewColor(c)}
                      style={{
                        width: 28, height: 28, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
                        outline: newColor === c ? `3px solid ${c}` : 'none',
                        outlineOffset: 2,
                      }} />
                  ))}
                  <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)}
                    style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #c8d4e8', padding: 2, cursor: 'pointer', background: 'none' }} />
                </div>
                {/* Vorschau */}
                {newLabel && (
                  <div style={{ marginTop: 10 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 10,
                      backgroundColor: `${newColor}20`, color: newColor,
                    }}>
                      {newLabel}
                    </span>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setShowForm(false)}
                  style={{ flex: 1, padding: '10px', borderRadius: 50, border: '1px solid #c8d4e8', background: 'white', color: '#666', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  Abbrechen
                </button>
                <button onClick={addStatus} disabled={!newLabel.trim() || saving}
                  style={{ flex: 2, padding: '10px', borderRadius: 50, border: 'none', background: !newLabel.trim() ? '#c8d4e8' : '#003366', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  {saving ? 'Wird gespeichert…' : 'Status anlegen'}
                </button>
              </div>
            </div>
          )}

          {/* Liste eigener Statuses */}
          {loading ? (
            <p style={{ color: '#96aed2', fontSize: 13, textAlign: 'center' }}>Lädt…</p>
          ) : customStatuses.length === 0 && !showForm ? (
            <div style={{ background: 'white', borderRadius: 14, padding: 32, border: '1px solid #c8d4e8', textAlign: 'center' }}>
              <p style={{ color: '#666', fontSize: 14, margin: '0 0 12px' }}>Noch keine eigenen Statuses</p>
              <button onClick={() => setShowForm(true)}
                style={{ padding: '10px 20px', borderRadius: 50, border: 'none', background: '#003366', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                + Ersten anlegen
              </button>
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: 14, border: '1px solid #c8d4e8', overflow: 'hidden' }}>
              {customStatuses.map((s, i) => (
                <div key={s.value} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  borderTop: i > 0 ? '1px solid #f4f6f9' : 'none',
                }}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 14, color: '#000', fontWeight: 600 }}>{s.label}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                    backgroundColor: `${s.color}20`, color: s.color,
                  }}>{s.label}</span>
                  <button type="button" onClick={() => removeStatus(s.value)}
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
