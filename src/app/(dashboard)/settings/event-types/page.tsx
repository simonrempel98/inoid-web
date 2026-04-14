'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { EVENT_TYPES, type EventType } from '@/lib/service-types'
import { Trash2 } from 'lucide-react'

const PRESET_COLORS = [
  '#2980B9', '#27AE60', '#E74C3C', '#8E44AD',
  '#16A085', '#E67E22', '#1ABC9C', '#34495E',
  '#0099cc', '#003366', '#005c8a', '#00a8c8',
]

export default function EventTypesPage() {
  const t = useTranslations()
  const router = useRouter()
  const supabase = createClient()

  const [customTypes, setCustomTypes] = useState<EventType[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const [newLabel, setNewLabel] = useState('')
  const [newColor, setNewColor] = useState('#2980B9')

  useEffect(() => {
    supabase.from('organizations').select('settings').single().then(({ data }) => {
      const raw = (data?.settings as { custom_event_types?: unknown[] })?.custom_event_types ?? []
      const cleaned = raw.map((et: any) => ({ value: et.value, label: et.label, color: et.color }))
      setCustomTypes(cleaned as EventType[])
      setLoading(false)
    })
  }, [])

  async function save(updated: EventType[]) {
    setSaving(true)
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
    if (customTypes.some(et => et.value === value)) return
    const updated = [...customTypes, { value, label: newLabel.trim(), color: newColor }]
    await save(updated)
    setNewLabel('')
    setNewColor('#2980B9')
    setShowForm(false)
  }

  async function removeType(value: string) {
    await save(customTypes.filter(et => et.value !== value))
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
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ds-text)', margin: 0 }}>{t('settings.eventTypes.title')}</h1>
          <p style={{ fontSize: 12, color: '#96aed2', margin: 0 }}>{t('settings.eventTypes.subtitle')}</p>
        </div>
      </div>

      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* System-Typen */}
        <div style={{ background: 'var(--ds-surface)', borderRadius: 14, border: '1px solid var(--ds-border)', overflow: 'hidden' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#96aed2', padding: '12px 16px 8px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {t('settings.eventTypes.systemTypes')}
          </p>
          {EVENT_TYPES.map((et, i) => (
            <div key={et.value} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px',
              borderTop: i > 0 ? '1px solid #f4f6f9' : 'none',
            }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: et.color, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 14, color: 'var(--ds-text)', fontWeight: 600 }}>
                {t(`eventTypes.${et.value}` as any) || et.label}
              </span>
              <span style={{ fontSize: 11, color: '#96aed2', background: '#f4f6f9', padding: '2px 8px', borderRadius: 6 }}>{t('settings.eventTypes.systemBadge')}</span>
            </div>
          ))}
        </div>

        {/* Eigene Typen */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--ds-text)', margin: 0 }}>{t('settings.eventTypes.customTypes')}</h2>
            <button type="button" onClick={() => setShowForm(v => !v)}
              style={{ padding: '8px 16px', borderRadius: 50, border: 'none', background: '#003366', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              {t('settings.eventTypes.newType')}
            </button>
          </div>

          {/* Formular */}
          {showForm && (
            <div style={{ background: 'var(--ds-surface)', borderRadius: 14, padding: 16, border: '1px solid var(--ds-border)', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>

              <div>
                <label style={labelStyle}>{t('common.label')}</label>
                <input
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  style={inputStyle}
                  placeholder={t('settings.eventTypes.labelPlaceholder')}
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && addType()}
                />
              </div>

              <div>
                <label style={labelStyle}>{t('common.color')}</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  {PRESET_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setNewColor(c)}
                      style={{
                        width: 28, height: 28, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
                        outline: newColor === c ? `3px solid ${c}` : 'none', outlineOffset: 2,
                      }} />
                  ))}
                  <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)}
                    style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--ds-border)', padding: 2, cursor: 'pointer', background: 'none' }} />
                </div>
              </div>

              {newLabel && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: '#96aed2' }}>{t('settings.eventTypes.preview')}</span>
                  <span style={{
                    fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
                    backgroundColor: `${newColor}20`, color: newColor,
                  }}>
                    {newLabel}
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setShowForm(false)}
                  style={{ flex: 1, padding: '10px', borderRadius: 50, border: '1px solid var(--ds-border)', background: 'var(--ds-surface)', color: '#666', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  {t('common.cancel')}
                </button>
                <button onClick={addType} disabled={!newLabel.trim() || saving}
                  style={{ flex: 2, padding: '10px', borderRadius: 50, border: 'none', background: !newLabel.trim() ? '#c8d4e8' : '#003366', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  {saving ? t('common.saving') : t('settings.eventTypes.save')}
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <p style={{ color: '#96aed2', fontSize: 13 }}>{t('common.loading')}</p>
          ) : customTypes.length === 0 ? (
            <div style={{ background: 'var(--ds-surface)', borderRadius: 14, border: '1px dashed #c8d4e8', padding: '24px', textAlign: 'center' }}>
              <p style={{ color: '#96aed2', fontSize: 13, margin: 0 }}>{t('settings.eventTypes.noCustomTypes')}</p>
            </div>
          ) : (
            <div style={{ background: 'var(--ds-surface)', borderRadius: 14, border: '1px solid var(--ds-border)', overflow: 'hidden' }}>
              {customTypes.map((et, i) => (
                <div key={et.value} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  borderTop: i > 0 ? '1px solid #f4f6f9' : 'none',
                }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: et.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 14, color: 'var(--ds-text)', fontWeight: 600 }}>{et.label}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                    backgroundColor: `${et.color}20`, color: et.color,
                  }}>{et.label}</span>
                  <button onClick={() => removeType(et.value)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c8d4e8', padding: 4, display: 'flex' }}>
                    <Trash2 size={15} />
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
  color: '#003366', marginBottom: 6, fontFamily: 'Arial, sans-serif',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 12px', borderRadius: 10,
  border: '1px solid var(--ds-border)', fontSize: 14, fontFamily: 'Arial, sans-serif',
  backgroundColor: 'white', color: 'var(--ds-text)', outline: 'none', boxSizing: 'border-box',
}
