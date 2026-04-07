'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { EVENT_TYPES, type EventType } from '@/lib/service-types'
import { Camera, Paperclip, Calendar } from 'lucide-react'

const NEXT_DATE_PRESETS = [
  { label: '+1W',  days: 7 },
  { label: '+2W',  days: 14 },
  { label: '+1M',  days: 30 },
  { label: '+3M',  days: 90 },
  { label: '+6M',  days: 180 },
  { label: '+1J',  days: 365 },
]

export default function NeuerServiceEintragPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params.id as string
  const editId = searchParams.get('edit')
  const isEditing = !!editId
  const supabase = createClient()

  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEditing)
  const [error, setError] = useState<string | null>(null)
  const [customTypes, setCustomTypes] = useState<EventType[]>([])
  const [existingAttachments, setExistingAttachments] = useState<string[]>([])

  // Felder
  const [eventType, setEventType] = useState('maintenance')
  const [title, setTitle] = useState('')
  const [eventDate, setEventDate] = useState(() => new Date().toISOString().slice(0, 16))
  const [description, setDescription] = useState('')
  const [performedBy, setPerformedBy] = useState('')
  const [externalCompany, setExternalCompany] = useState('')
  const [costEur, setCostEur] = useState('')
  const [nextServiceDate, setNextServiceDate] = useState('')
  const [notes, setNotes] = useState('')

  // Fotos
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const photoInputRef = useRef<HTMLInputElement>(null)

  // Dokumente
  const [docFiles, setDocFiles] = useState<File[]>([])
  const docInputRef = useRef<HTMLInputElement>(null)

  // Custom Event Types laden
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
      .from('asset_lifecycle_events')
      .select('*')
      .eq('id', editId)
      .single()
      .then(({ data }) => {
        if (!data) return
        setEventType(data.event_type ?? 'maintenance')
        setTitle(data.title ?? '')
        setEventDate(data.event_date ? new Date(data.event_date).toISOString().slice(0, 16) : '')
        setDescription(data.description ?? '')
        setPerformedBy(data.performed_by ?? '')
        setExternalCompany(data.external_company ?? '')
        setCostEur(data.cost_eur != null ? String(data.cost_eur) : '')
        setNextServiceDate(data.next_service_date?.slice(0, 10) ?? '')
        setNotes(data.notes ?? '')
        setExistingAttachments(Array.isArray(data.attachments) ? data.attachments as string[] : [])
        setLoading(false)
      })
  }, [editId])

  const allTypes = [...EVENT_TYPES, ...customTypes]
  const selectedType = allTypes.find(e => e.value === eventType) ?? EVENT_TYPES[0]

  function applyNextDatePreset(days: number) {
    const base = eventDate ? new Date(eventDate) : new Date()
    base.setDate(base.getDate() + days)
    setNextServiceDate(base.toISOString().slice(0, 10))
  }

  function addPhotos(files: FileList | null) {
    if (!files) return
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'))
    setPhotoFiles(prev => [...prev, ...arr])
    arr.forEach(f => {
      const reader = new FileReader()
      reader.onload = e => setPhotoPreviews(prev => [...prev, e.target?.result as string])
      reader.readAsDataURL(f)
    })
  }

  function removePhoto(i: number) {
    setPhotoFiles(prev => prev.filter((_, j) => j !== i))
    setPhotoPreviews(prev => prev.filter((_, j) => j !== i))
  }

  function addDocs(files: FileList | null) {
    if (!files) return
    setDocFiles(prev => [...prev, ...Array.from(files)])
  }

  function removeDoc(i: number) {
    setDocFiles(prev => prev.filter((_, j) => j !== i))
  }

  async function handleSave() {
    if (!title.trim()) { setError('Bitte einen Titel eingeben.'); return }
    setSaving(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Nicht eingeloggt')

      const targetId = editId ?? crypto.randomUUID()
      const newAttachments: string[] = [...existingAttachments]

      for (const file of photoFiles) {
        const ext = file.name.split('.').pop()
        const path = `service/${id}/${targetId}/${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage.from('asset-images').upload(path, file)
        if (upErr) throw new Error('Foto-Upload fehlgeschlagen: ' + upErr.message)
        const { data } = supabase.storage.from('asset-images').getPublicUrl(path)
        newAttachments.push(`${data.publicUrl}|photo|`)
      }

      for (const file of docFiles) {
        const ext = file.name.split('.').pop()
        const path = `service/${id}/${targetId}/doc-${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage.from('service-files').upload(path, file)
        if (upErr) throw new Error('Dokument-Upload fehlgeschlagen: ' + upErr.message)
        const { data } = supabase.storage.from('service-files').getPublicUrl(path)
        newAttachments.push(`${data.publicUrl}|doc|${file.name}`)
      }

      const payload = {
        event_type: eventType,
        title: title.trim(),
        event_date: eventDate,
        description: description.trim() || null,
        performed_by: performedBy.trim() || null,
        external_company: externalCompany.trim() || null,
        cost_eur: costEur ? parseFloat(costEur.replace(',', '.')) : null,
        next_service_date: nextServiceDate || null,
        notes: notes.trim() || null,
        attachments: newAttachments.length > 0 ? newAttachments : null,
      }

      if (isEditing) {
        const { error: updateErr } = await supabase
          .from('asset_lifecycle_events')
          .update(payload)
          .eq('id', editId)
        if (updateErr) throw new Error(updateErr.message)
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', user.id)
          .single()
        if (!profile?.organization_id) throw new Error('Keine Organisation gefunden')

        const { error: insertErr } = await supabase.from('asset_lifecycle_events').insert({
          id: targetId,
          asset_id: id,
          organization_id: profile.organization_id,
          ...payload,
        })
        if (insertErr) throw new Error(insertErr.message)
      }

      // Wenn next_service_date gesetzt → maintenance_schedule aktualisieren
      if (nextServiceDate) {
        const { data: schedules } = await supabase
          .from('maintenance_schedules')
          .select('id')
          .eq('asset_id', id)
          .eq('is_active', true)
          .order('next_service_date', { ascending: true })
          .limit(1)

        if (schedules && schedules.length > 0) {
          await supabase.from('maintenance_schedules').update({
            last_service_date: eventDate.slice(0, 10),
            next_service_date: nextServiceDate,
          }).eq('id', schedules[0].id)
        }
      }

      router.push(`/assets/${id}/service`)
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Fehler beim Speichern')
      setSaving(false)
    }
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
            {isEditing ? 'Eintrag bearbeiten' : 'Neuer Eintrag'}
          </h1>
          <p style={{ fontSize: 12, color: '#96aed2', margin: 0 }}>Serviceheft</p>
        </div>
      </div>

      <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Typ */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={labelStyle}>Typ</label>
            <button
              type="button"
              onClick={() => router.push('/settings/event-types')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#0099cc', fontWeight: 600 }}
            >
              + Eigenen anlegen
            </button>
          </div>

          {/* System-Typen */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: customTypes.length > 0 ? 6 : 0 }}>
            {EVENT_TYPES.map(et => (
              <TypeChip key={et.value} et={et} selected={eventType === et.value} onSelect={setEventType} />
            ))}
          </div>

          {/* Custom-Typen */}
          {customTypes.length > 0 && (
            <>
              <p style={{ fontSize: 10, color: '#96aed2', fontWeight: 700, margin: '8px 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Eigene
              </p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {customTypes.map(et => (
                  <TypeChip key={et.value} et={et} selected={eventType === et.value} onSelect={setEventType} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Titel */}
        <div>
          <label style={labelStyle}>Titel *</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={`z.B. ${selectedType.label} durchgeführt`}
            style={inputStyle}
          />
        </div>

        {/* Datum */}
        <div>
          <label style={labelStyle}>Datum & Uhrzeit</label>
          <input
            type="datetime-local"
            value={eventDate}
            onChange={e => setEventDate(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Beschreibung */}
        <div>
          <label style={labelStyle}>Beschreibung</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Was wurde gemacht?"
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        {/* 2-Spalter: Durchgeführt von + Firma */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Durchgeführt von</label>
            <input value={performedBy} onChange={e => setPerformedBy(e.target.value)} placeholder="Name" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Firma / extern</label>
            <input value={externalCompany} onChange={e => setExternalCompany(e.target.value)} placeholder="z.B. TÜV" style={inputStyle} />
          </div>
        </div>

        {/* Kosten */}
        <div>
          <label style={labelStyle}>Kosten (€)</label>
          <input
            type="number"
            inputMode="decimal"
            value={costEur}
            onChange={e => setCostEur(e.target.value)}
            placeholder="0,00"
            style={{ ...inputStyle, maxWidth: 160 }}
          />
        </div>

        {/* Nächster Termin */}
        <div>
          <label style={labelStyle}>Nächster Termin</label>
          {/* Schnellwahl */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
            {NEXT_DATE_PRESETS.map(p => (
              <button
                key={p.days}
                type="button"
                onClick={() => applyNextDatePreset(p.days)}
                style={{
                  padding: '5px 10px', borderRadius: 16, border: '1px solid #c8d4e8',
                  background: '#f4f6f9', color: '#003366', fontSize: 12, fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {p.label}
              </button>
            ))}
            {nextServiceDate && (
              <button
                type="button"
                onClick={() => setNextServiceDate('')}
                style={{
                  padding: '5px 10px', borderRadius: 16, border: '1px solid #fecaca',
                  background: 'white', color: '#dc2626', fontSize: 12, fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                ✕ Löschen
              </button>
            )}
          </div>
          <input
            type="date"
            value={nextServiceDate}
            onChange={e => setNextServiceDate(e.target.value)}
            style={inputStyle}
          />
          {nextServiceDate && (
            <p style={{ fontSize: 12, color: '#003366', fontWeight: 600, margin: '6px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Calendar size={14} /> {new Date(nextServiceDate).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>

        {/* Notizen */}
        <div>
          <label style={labelStyle}>Notizen / Bemerkungen</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Interne Notizen, Befunde, Empfehlungen…"
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        {/* Fotos */}
        <div>
          <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 4 }}><Camera size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Fotos</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {/* Bestehende Fotos (Edit-Modus) */}
            {existingAttachments.filter(a => a.includes('|photo|')).map((a, i) => {
              const url = a.split('|photo|')[0]
              return (
                <div key={`existing-photo-${i}`} style={{ position: 'relative' }}>
                  <img src={url} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 10, border: '1px solid #c8d4e8' }} />
                  <button type="button" onClick={() => setExistingAttachments(prev => prev.filter(x => x !== a))} style={{
                    position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%',
                    background: '#dc2626', color: 'white', border: 'none', cursor: 'pointer',
                    fontSize: 13, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>×</button>
                </div>
              )
            })}
            {photoPreviews.map((src, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <img src={src} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 10, border: '1px solid #c8d4e8' }} />
                <button type="button" onClick={() => removePhoto(i)} style={{
                  position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%',
                  background: '#dc2626', color: 'white', border: 'none', cursor: 'pointer',
                  fontSize: 13, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>×</button>
              </div>
            ))}
            <button type="button" onClick={() => photoInputRef.current?.click()} style={{
              width: 72, height: 72, borderRadius: 10, border: '2px dashed #c8d4e8',
              background: '#f4f6f9', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#96aed2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <span style={{ fontSize: 9, color: '#96aed2', fontWeight: 700 }}>FOTO</span>
            </button>
            <input ref={photoInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => addPhotos(e.target.files)} />
          </div>
        </div>

        {/* Dokumente */}
        <div>
          <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 4 }}><Paperclip size={14} /> Dokumente</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {/* Bestehende Dokumente (Edit-Modus) */}
            {existingAttachments.filter(a => a.includes('|doc|')).map((a, i) => {
              const parts = a.split('|doc|')
              const name = parts[1] ?? `Dokument ${i + 1}`
              return (
                <div key={`existing-doc-${i}`} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                  borderRadius: 10, border: '1px solid #c8d4e8', background: '#f4f6f9',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#003366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  <span style={{ flex: 1, fontSize: 12, color: '#003366', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                  <button type="button" onClick={() => setExistingAttachments(prev => prev.filter(x => x !== a))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: 18, padding: 0, lineHeight: 1 }}>×</button>
                </div>
              )
            })}
            {docFiles.map((f, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                borderRadius: 10, border: '1px solid #c8d4e8', background: '#f4f6f9',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#003366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <span style={{ flex: 1, fontSize: 12, color: '#003366', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                <button type="button" onClick={() => removeDoc(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: 18, padding: 0, lineHeight: 1 }}>×</button>
              </div>
            ))}
            <button type="button" onClick={() => docInputRef.current?.click()} style={{
              padding: '10px 14px', borderRadius: 10, border: '2px dashed #c8d4e8',
              background: '#f4f6f9', cursor: 'pointer', color: '#96aed2', fontSize: 13, fontWeight: 700, textAlign: 'left',
            }}>
              + Dokument / PDF hinzufügen
            </button>
            <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt" multiple style={{ display: 'none' }} onChange={e => addDocs(e.target.files)} />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: '#fff1f1', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', color: '#dc2626', fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* Speichern */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !title.trim()}
          style={{
            width: '100%', padding: '15px', borderRadius: 50, border: 'none',
            background: saving || !title.trim() ? '#c8d4e8' : '#003366',
            color: 'white', fontSize: 15, fontWeight: 700,
            cursor: saving || !title.trim() ? 'default' : 'pointer',
          }}
        >
          {saving ? 'Wird gespeichert…' : isEditing ? 'Änderungen speichern' : 'Eintrag speichern'}
        </button>
      </div>
    </div>
  )
}

function TypeChip({ et, selected, onSelect }: { et: EventType; selected: boolean; onSelect: (v: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(et.value)}
      style={{
        padding: '6px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
        fontSize: 12, fontWeight: 700,
        display: 'inline-flex', alignItems: 'center', gap: 5,
        background: selected ? `${et.color}18` : '#f4f6f9',
        color: selected ? et.color : '#666',
        outline: selected ? `2px solid ${et.color}` : 'none',
        outlineOffset: 1,
      }}
    >
      <et.icon size={13} />{et.label}
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
  backgroundColor: 'white', color: '#000', outline: 'none',
  boxSizing: 'border-box',
}
