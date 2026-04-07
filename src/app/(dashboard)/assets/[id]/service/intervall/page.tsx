'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { EVENT_TYPES, INTERVAL_PRESETS, type EventType } from '@/lib/service-types'

export default function IntervalPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params.id as string
  const editId = searchParams.get('edit')
  const isEditing = !!editId

  const supabase = createClient()

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(isEditing)
  const [customTypes, setCustomTypes] = useState<EventType[]>([])

  const [eventType, setEventType] = useState('maintenance')
  const [name, setName] = useState('')
  const [intervalDays, setIntervalDays] = useState<number>(365)
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

  async function handleSave() {
    if (!name.trim()) { setError('Bitte eine Bezeichnung eingeben.'); return }
    if (effectiveDays <= 0) { setError('Bitte ein gültiges Intervall eingeben.'); return }
    if (!nextDate) { setError('Bitte die nächste Fälligkeit angeben.'); return }

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
        Lädt…
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
            {isEditing ? 'Intervall bearbeiten' : 'Neues Intervall'}
          </h1>
          <p style={{ fontSize: 12, color: '#96aed2', margin: 0 }}>Wiederkehrender Termin</p>
        </div>
      </div>

      <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Kategorie */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={labelStyle}>Kategorie</label>
            <button type="button" onClick={() => router.push('/settings/event-types')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#0099cc', fontWeight: 600 }}>
              + Eigene anlegen
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: customTypes.length > 0 ? 6 : 0 }}>
            {EVENT_TYPES.map(et => (
              <TypeChip key={et.value} et={et} selected={eventType === et.value} onSelect={setEventType} />
            ))}
          </div>
          {customTypes.length > 0 && (
            <>
              <p style={{ fontSize: 10, color: '#96aed2', fontWeight: 700, margin: '8px 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Eigene</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {customTypes.map(et => (
                  <TypeChip key={et.value} et={et} selected={eventType === et.value} onSelect={setEventType} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Bezeichnung */}
        <div>
          <label style={labelStyle}>Bezeichnung *</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={`z.B. ${selectedType.label} alle 6 Monate`}
            style={inputStyle}
            autoFocus={!isEditing}
          />
        </div>

        {/* Intervall */}
        <div>
          <label style={labelStyle}>Intervall</label>
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
            }}>Individuell</button>
          </div>
          {useCustom && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="number" inputMode="numeric"
                value={customDays} onChange={e => setCustomDays(e.target.value)}
                placeholder="z.B. 45"
                style={{ ...inputStyle, maxWidth: 120 }}
              />
              <span style={{ fontSize: 13, color: '#666' }}>Tage</span>
            </div>
          )}
          {effectiveDays > 0 && (
            <p style={{ fontSize: 12, color: '#003366', fontWeight: 600, margin: '8px 0 0' }}>
              ✓ Alle {effectiveDays} Tage
            </p>
          )}
        </div>

        {/* Letzter + Nächster Termin */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Zuletzt durchgeführt</label>
            <input type="date" value={lastDate} onChange={e => onLastDateChange(e.target.value)} style={inputStyle} />
            <p style={{ fontSize: 11, color: '#96aed2', margin: '4px 0 0' }}>Optional – berechnet nächsten Termin</p>
          </div>
          <div>
            <label style={labelStyle}>Nächste Fälligkeit *</label>
            <input type="date" value={nextDate} onChange={e => setNextDate(e.target.value)} style={inputStyle} />
          </div>
        </div>

        {/* Vorschau */}
        {name && effectiveDays > 0 && nextDate && (
          <div style={{ background: `${selectedType.color}10`, borderRadius: 12, padding: '14px 16px', border: `1px solid ${selectedType.color}33` }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: selectedType.color, margin: '0 0 4px' }}>Vorschau</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#000', margin: '0 0 3px' }}>
              {selectedType.icon} {name}
            </p>
            <p style={{ fontSize: 12, color: '#666', margin: 0 }}>
              Alle {effectiveDays} Tage · Fällig: {new Date(nextDate).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
        )}

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
          {saving ? 'Wird gespeichert…' : isEditing ? 'Änderungen speichern' : 'Intervall anlegen'}
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
      background: selected ? `${et.color}20` : '#f4f6f9',
      color: selected ? et.color : '#666',
      outline: selected ? `2px solid ${et.color}` : 'none',
      outlineOffset: 1,
    }}>
      {et.icon} {et.label}
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
