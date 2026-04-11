'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { EVENT_TYPES, INTERVAL_PRESETS, type EventType } from '@/lib/service-types'

import { Plus, Trash2, Wrench } from 'lucide-react'

const TYPE_COLORS = ['#2980B9', '#27AE60', '#E74C3C', '#8E44AD', '#16A085', '#E67E22', '#0099cc', '#003366']

type ChecklistItem = { id: string; text: string; resources?: string }

export default function IntervalPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const t = useTranslations()
  const locale = useLocale()
  const id = params.id as string
  const editId = searchParams.get('edit')
  const isEditing = !!editId

  const supabase = createClient()

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(isEditing)
  const [customTypes, setCustomTypes] = useState<EventType[]>([])
  const [showNewTypeForm, setShowNewTypeForm] = useState(false)
  const [newTypeLabel, setNewTypeLabel] = useState('')
  const [newTypeColor, setNewTypeColor] = useState('#2980B9')
  const [savingType, setSavingType] = useState(false)

  const [eventType, setEventType] = useState('maintenance')
  const [name, setName] = useState('')
  const [intervalDays, setIntervalDays] = useState<number>(365)
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [customDays, setCustomDays] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [nextDate, setNextDate] = useState('')
  const [lastDate, setLastDate] = useState('')

  useEffect(() => {
    supabase.from('organizations').select('settings').single().then(({ data }) => {
      const ct = (data?.settings as { custom_event_types?: EventType[] })?.custom_event_types ?? []
      setCustomTypes(ct)
    })
  }, [])

  // Bei Bearbeitung: bestehende Daten laden
  useEffect(() => {
    if (!editId) return
    supabase
      .from('maintenance_schedules')
      .select('*')
      .eq('id', editId)
      .single()
      .then(({ data }) => {
        if (!data) return
        setName(data.name ?? '')
        setEventType(data.event_type ?? 'maintenance')
        setNextDate(data.next_service_date?.slice(0, 10) ?? '')
        setLastDate(data.last_service_date?.slice(0, 10) ?? '')

        const preset = INTERVAL_PRESETS.find(p => p.days === data.interval_days)
        if (preset) {
          setIntervalDays(data.interval_days)
          setUseCustom(false)
        } else {
          setCustomDays(String(data.interval_days))
          setUseCustom(true)
        }
        const raw = (data as any).checklist
        if (Array.isArray(raw)) setChecklist(raw as ChecklistItem[])
        setLoading(false)
      })
  }, [editId])

  const allTypes = [...EVENT_TYPES, ...customTypes]
  const selectedType = allTypes.find(e => e.value === eventType) ?? EVENT_TYPES[0]
  const effectiveDays = useCustom ? parseInt(customDays) || 0 : intervalDays

  function onLastDateChange(val: string) {
    setLastDate(val)
    if (val && effectiveDays > 0) {
      const next = new Date(val)
      next.setDate(next.getDate() + effectiveDays)
      setNextDate(next.toISOString().slice(0, 10))
    }
  }

  function onIntervalChange(days: number) {
    setIntervalDays(days)
    setUseCustom(false)
    if (lastDate && days > 0) {
      const next = new Date(lastDate)
      next.setDate(next.getDate() + days)
      setNextDate(next.toISOString().slice(0, 10))
    }
  }

  async function saveNewType() {
    if (!newTypeLabel.trim()) return
    setSavingType(true)
    const value = newTypeLabel.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    const { data: org } = await supabase.from('organizations').select('settings').single()
    const existing = (org?.settings as Record<string, unknown>) ?? {}
    const current = (existing.custom_event_types as EventType[] | undefined) ?? []
    if (!current.some(t => t.value === value)) {
      const updated = [...current, { value, label: newTypeLabel.trim(), color: newTypeColor }]
      await supabase.from('organizations').update({ settings: { ...existing, custom_event_types: updated } })
      setCustomTypes(updated as EventType[])
      setEventType(value)
    }
    setNewTypeLabel('')
    setNewTypeColor('#2980B9')
    setShowNewTypeForm(false)
    setSavingType(false)
  }

  async function handleSave() {
    if (!name.trim()) { setError(t('service.interval.errors.nameRequired')); return }
    if (effectiveDays <= 0) { setError(t('service.interval.errors.intervalRequired')); return }
    if (!nextDate) { setError(t('service.interval.errors.nextDateRequired')); return }

    setSaving(true)
    setError(null)

    const payload = {
      name: name.trim(),
      title: name.trim(),
      event_type: eventType,
      interval_days: effectiveDays,
      next_service_date: nextDate,
      last_service_date: lastDate || null,
      is_active: true,
      checklist: checklist.filter(c => c.text.trim()),
    }

    if (isEditing) {
      const { error: updateErr } = await supabase
        .from('maintenance_schedules')
        .update(payload)
        .eq('id', editId)
      if (updateErr) { setError(updateErr.message); setSaving(false); return }
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user!.id).single()
      if (!profile?.organization_id) { setError('Keine Organisation gefunden'); setSaving(false); return }

      const { error: insertErr } = await supabase.from('maintenance_schedules').insert({
        ...payload,
        asset_id: id,
        organization_id: profile.organization_id,
      })
      if (insertErr) { setError(insertErr.message); setSaving(false); return }
    }

    router.push(`/assets/${id}/service`)
    router.refresh()
  }

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#96aed2', fontFamily: 'Arial, sans-serif' }}>
        {t('common.loading')}
      </div>
    )
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button type="button" onClick={() => router.back()} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 36, height: 36, borderRadius: '50%',
          background: '#f4f6f9', border: '1px solid #c8d4e8', cursor: 'pointer',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#003366" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#000', margin: 0 }}>
            {isEditing ? t('service.interval.editTitle') : t('service.interval.title')}
          </h1>
          <p style={{ fontSize: 12, color: '#96aed2', margin: 0 }}>{t('service.interval.subtitle')}</p>
        </div>
      </div>

      <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Kategorie */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={labelStyle}>{t('service.entry.type')}</label>
            <button type="button" onClick={() => setShowNewTypeForm(v => !v)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#0099cc', fontWeight: 600 }}>
              {showNewTypeForm ? t('service.entry.cancelCustomType') : t('service.entry.customType')}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: customTypes.length > 0 ? 6 : 0 }}>
            {EVENT_TYPES.map(et => (
              <TypeChip key={et.value} et={et} selected={eventType === et.value} onSelect={setEventType} />
            ))}
          </div>
          {customTypes.length > 0 && (
            <>
              <p style={{ fontSize: 10, color: '#96aed2', fontWeight: 700, margin: '8px 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('common.custom')}</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {customTypes.map(et => (
                  <TypeChip key={et.value} et={et} selected={eventType === et.value} onSelect={setEventType} />
                ))}
              </div>
            </>
          )}
          {showNewTypeForm && (
            <div style={{
              marginTop: 10, padding: 14, borderRadius: 12,
              border: '1px solid #c8d4e8', background: '#f9fbff',
              display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#003366', margin: 0 }}>{t('service.interval.newType')}</p>
              <input
                value={newTypeLabel}
                onChange={e => setNewTypeLabel(e.target.value)}
                placeholder={t('service.entry.newTypePlaceholder')}
                autoFocus
                onKeyDown={e => e.key === 'Enter' && saveNewType()}
                style={inputStyle}
              />
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                {TYPE_COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setNewTypeColor(c)} style={{
                    width: 24, height: 24, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
                    outline: newTypeColor === c ? `3px solid ${c}` : 'none', outlineOffset: 2,
                  }} />
                ))}
                <input type="color" value={newTypeColor} onChange={e => setNewTypeColor(e.target.value)}
                  style={{ width: 24, height: 24, borderRadius: '50%', border: '1px solid #c8d4e8', padding: 2, cursor: 'pointer', background: 'none' }} />
                {newTypeLabel && (
                  <span style={{
                    fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 16,
                    backgroundColor: `${newTypeColor}20`, color: newTypeColor,
                  }}>{newTypeLabel}</span>
                )}
              </div>
              <button type="button" onClick={saveNewType} disabled={!newTypeLabel.trim() || savingType}
                style={{
                  padding: '9px', borderRadius: 8, border: 'none',
                  background: !newTypeLabel.trim() ? '#c8d4e8' : '#003366',
                  color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}>
                {savingType ? t('common.saving') : t('service.entry.createType')}
              </button>
            </div>
          )}
        </div>

        {/* Bezeichnung */}
        <div>
          <label style={labelStyle}>{t('service.interval.name')}</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={t('service.interval.namePlaceholder', { type: selectedType.label })}
            style={inputStyle}
            autoFocus={!isEditing}
          />
        </div>

        {/* Intervall */}
        <div>
          <label style={labelStyle}>{t('service.interval.interval')}</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {INTERVAL_PRESETS.map(p => (
              <button key={p.days} type="button" onClick={() => onIntervalChange(p.days)} style={{
                padding: '7px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 700,
                background: !useCustom && intervalDays === p.days ? '#003366' : '#f4f6f9',
                color: !useCustom && intervalDays === p.days ? 'white' : '#666',
              }}>{p.label}</button>
            ))}
            <button type="button" onClick={() => setUseCustom(true)} style={{
              padding: '7px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 700,
              background: useCustom ? '#003366' : '#f4f6f9',
              color: useCustom ? 'white' : '#666',
            }}>{t('service.interval.custom')}</button>
          </div>
          {useCustom && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="number" inputMode="numeric"
                value={customDays} onChange={e => setCustomDays(e.target.value)}
                placeholder={t('service.interval.customDaysPlaceholder')}
                style={{ ...inputStyle, maxWidth: 120 }}
              />
              <span style={{ fontSize: 13, color: '#666' }}>{t('service.interval.customDays')}</span>
            </div>
          )}
          {effectiveDays > 0 && (
            <p style={{ fontSize: 12, color: '#003366', fontWeight: 600, margin: '8px 0 0' }}>
              ✓ {t('service.interval.intervalDays', { n: effectiveDays })}
            </p>
          )}
        </div>

        {/* Letzter + Nächster Termin */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} className="rg-2">
          <div>
            <label style={labelStyle}>{t('service.interval.lastDone')}</label>
            <input type="date" value={lastDate} onChange={e => onLastDateChange(e.target.value)} style={inputStyle} />
            <p style={{ fontSize: 11, color: '#96aed2', margin: '4px 0 0' }}>{t('service.interval.lastDoneHint')}</p>
          </div>
          <div>
            <label style={labelStyle}>{t('service.interval.nextDue')}</label>
            <input type="date" value={nextDate} onChange={e => setNextDate(e.target.value)} style={inputStyle} />
          </div>
        </div>

        {/* Vorschau */}
        {name && effectiveDays > 0 && nextDate && (
          <div style={{ background: `${selectedType.color}10`, borderRadius: 12, padding: '14px 16px', border: `1px solid ${selectedType.color}33` }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: selectedType.color, margin: '0 0 4px' }}>{t('service.interval.preview')}</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#000', margin: '0 0 3px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: selectedType.color, flexShrink: 0 }} />
              {name}
            </p>
            <p style={{ fontSize: 12, color: '#666', margin: 0 }}>
              {t('service.interval.previewDesc', { days: effectiveDays, date: new Date(nextDate + 'T00:00:00').toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' }) })}
            </p>
          </div>
        )}

        {/* Checkliste */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <label style={labelStyle}>{t('service.interval.checklist')}</label>
              <p style={{ fontSize: 11, color: '#96aed2', margin: '-4px 0 0' }}>
                {t('service.interval.checklistSubtitle')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setChecklist(prev => [...prev, { id: crypto.randomUUID(), text: '', resources: '' }])}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '7px 14px', borderRadius: 20, border: 'none',
                background: '#003366', color: 'white',
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}
            >
              <Plus size={13} /> {t('service.interval.addStep').replace('+ ', '')}
            </button>
          </div>

          {checklist.length === 0 ? (
            <div style={{
              border: '1px dashed #c8d4e8', borderRadius: 12, padding: '20px',
              textAlign: 'center', color: '#96aed2', fontSize: 13,
            }}>
              {t('service.interval.noSteps')}
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: 14, border: '1px solid #c8d4e8', overflow: 'hidden' }}>
              {checklist.map((item, idx) => (
                <div key={item.id} style={{
                  borderBottom: idx < checklist.length - 1 ? '1px solid #f4f6f9' : 'none',
                  padding: '12px 14px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    {/* Schritt-Nummer */}
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%',
                      background: '#003366', color: 'white',
                      fontSize: 11, fontWeight: 800, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginTop: 10,
                    }}>
                      {idx + 1}
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <input
                        value={item.text}
                        onChange={e => setChecklist(prev => prev.map((c, i) => i === idx ? { ...c, text: e.target.value } : c))}
                        placeholder={t('service.interval.stepPlaceholder', { n: idx + 1 })}
                        style={inputStyle}
                        autoFocus={item.text === ''}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Wrench size={11} color="#96aed2" style={{ flexShrink: 0 }} />
                        <input
                          value={item.resources ?? ''}
                          onChange={e => setChecklist(prev => prev.map((c, i) => i === idx ? { ...c, resources: e.target.value } : c))}
                          placeholder={t('service.interval.resourcesPlaceholder')}
                          style={{
                            flex: 1, padding: '7px 10px', borderRadius: 8,
                            border: '1px solid #e8eef8', fontSize: 12,
                            fontFamily: 'Arial, sans-serif', color: '#666',
                            backgroundColor: '#f9fbff', outline: 'none', boxSizing: 'border-box' as const,
                          }}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setChecklist(prev => prev.filter((_, i) => i !== idx))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c8d4e8', padding: 4, display: 'flex', flexShrink: 0, marginTop: 6 }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: '#fff1f1', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', color: '#dc2626', fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* Speichern */}
        <button type="button" onClick={handleSave}
          disabled={saving || !name.trim() || effectiveDays <= 0 || !nextDate}
          style={{
            width: '100%', padding: '15px', borderRadius: 50, border: 'none',
            background: saving || !name.trim() || effectiveDays <= 0 || !nextDate ? '#c8d4e8' : '#003366',
            color: 'white', fontSize: 15, fontWeight: 700,
            cursor: saving || !name.trim() || effectiveDays <= 0 || !nextDate ? 'default' : 'pointer',
          }}>
          {saving ? t('common.saving') : isEditing ? t('service.interval.saveEdit') : t('service.interval.save')}
        </button>
      </div>
    </div>
  )
}

function TypeChip({ et, selected, onSelect }: { et: EventType; selected: boolean; onSelect: (v: string) => void }) {
  return (
    <button type="button" onClick={() => onSelect(et.value)} style={{
      padding: '6px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
      fontSize: 12, fontWeight: 700,
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: selected ? `${et.color}20` : '#f4f6f9',
      color: selected ? et.color : '#666',
      outline: selected ? `2px solid ${et.color}` : 'none',
      outlineOffset: 1,
    }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: selected ? et.color : '#999', flexShrink: 0 }} />
      {et.label}
    </button>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 700,
  color: '#003366', marginBottom: 6, fontFamily: 'Arial, sans-serif',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 12px', borderRadius: 10,
  border: '1px solid #c8d4e8', fontSize: 14, fontFamily: 'Arial, sans-serif',
  backgroundColor: 'white', color: '#000', outline: 'none', boxSizing: 'border-box',
}
