'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { EVENT_TYPES, type EventType } from '@/lib/service-types'
import { Camera, Paperclip, Calendar, RefreshCw, X } from 'lucide-react'

const TYPE_COLORS = ['#2980B9', '#27AE60', '#E74C3C', '#8E44AD', '#16A085', '#E67E22', '#0099cc', '#003366']

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
  const t = useTranslations()
  const locale = useLocale()
  const id = params.id as string
  const editId = searchParams.get('edit')
  const scheduleId = searchParams.get('schedule_id')
  const isEditing = !!editId
  const fromSchedule = !!scheduleId
  const supabase = createClient()

  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEditing || fromSchedule)
  const [error, setError] = useState<string | null>(null)
  const [customTypes, setCustomTypes] = useState<EventType[]>([])
  const [existingAttachments, setExistingAttachments] = useState<string[]>([])
  const [scheduleIntervalDays, setScheduleIntervalDays] = useState<number | null>(null)
  const [scheduleName, setScheduleName] = useState<string>('')
  const [checklistItems, setChecklistItems] = useState<{ id: string; text: string; resources?: string; checked: boolean; note: string }[]>([])
  const [openNotes, setOpenNotes] = useState<Set<string>>(new Set())
  const [showNewTypeForm, setShowNewTypeForm] = useState(false)
  const [newTypeLabel, setNewTypeLabel] = useState('')
  const [newTypeColor, setNewTypeColor] = useState('#2980B9')
  const [savingType, setSavingType] = useState(false)

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

  // Wartungsintervall vorausfüllen
  useEffect(() => {
    if (!scheduleId) return
    supabase
      .from('maintenance_schedules')
      .select('*')
      .eq('id', scheduleId)
      .single()
      .then(({ data }) => {
        if (!data) return
        setEventType(data.event_type ?? 'maintenance')
        setTitle(data.name ?? data.title ?? 'Wartung durchgeführt')
        setScheduleIntervalDays(data.interval_days ?? null)
        setScheduleName(data.name ?? '')
        const raw = (data as any).checklist
        if (Array.isArray(raw) && raw.length > 0) {
          setChecklistItems(raw.map((c: { id: string; text: string; resources?: string }) => ({ ...c, checked: false, note: '' })))
        }
        setLoading(false)
      })
  }, [scheduleId])

  // Bearbeitung: bestehende Daten laden
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
        const rawResult = (data as any).checklist_result
        if (Array.isArray(rawResult) && rawResult.length > 0) {
          setChecklistItems(rawResult.map((c: any) => ({ id: c.id, text: c.text, resources: c.resources, checked: c.checked ?? false, note: c.note ?? '' })))
        }
        setLoading(false)
      })
  }, [editId])

  const allTypes = [...EVENT_TYPES, ...customTypes]
  const selectedType = allTypes.find(e => e.value === eventType) ?? EVENT_TYPES[0]

  // Automatischer nächster Termin basierend auf Intervall
  const autoNextDate = (() => {
    if (!scheduleIntervalDays || !eventDate) return null
    const d = new Date(eventDate)
    d.setDate(d.getDate() + scheduleIntervalDays)
    return d
  })()

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
    if (!title.trim()) { setError(t('service.entry.errors.titleRequired')); return }
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
        // Wenn vom Wartungsintervall: kein manueller next_service_date
        next_service_date: fromSchedule ? null : (nextServiceDate || null),
        notes: notes.trim() || null,
        attachments: newAttachments.length > 0 ? newAttachments : null,
        ...(checklistItems.length > 0 ? { checklist_result: checklistItems } : {}),
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

      // Wartungsintervall aktualisieren: letztes Datum + nächsten Termin neu setzen
      if (fromSchedule && scheduleId && scheduleIntervalDays) {
        const doneDateStr = eventDate.slice(0, 10)
        const nextDate = new Date(eventDate)
        nextDate.setDate(nextDate.getDate() + scheduleIntervalDays)
        const nextStr = nextDate.toISOString().slice(0, 10)

        await supabase.from('maintenance_schedules').update({
          last_service_date: doneDateStr,
          next_service_date: nextStr,
          updated_at: new Date().toISOString(),
        }).eq('id', scheduleId)
      } else if (!fromSchedule && nextServiceDate) {
        // Manuell: erstes aktives Intervall aktualisieren
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
      setError(e instanceof Error ? e.message : t('service.entry.errors.saveFailed'))
      setSaving(false)
    }
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
            {isEditing ? t('service.entry.edit') : fromSchedule ? t('service.entry.completeMaintenance') : t('service.entry.new')}
          </h1>
          <p style={{ fontSize: 12, color: '#96aed2', margin: 0 }}>
            {fromSchedule ? scheduleName : t('service.title')}
          </p>
        </div>
      </div>

      {/* Hinweis-Banner wenn vom Wartungsintervall */}
      {fromSchedule && autoNextDate && (
        <div style={{
          margin: '16px 20px 0',
          background: 'linear-gradient(135deg, #003366, #005599)',
          borderRadius: 14, padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: 12,
          color: 'white',
        }}>
          <RefreshCw size={18} style={{ flexShrink: 0, opacity: 0.8 }} />
          <div>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 2 }}>{t('service.entry.nextDateAutoSet')}</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>
              {autoNextDate.toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' })}
              <span style={{ fontSize: 12, fontWeight: 400, opacity: 0.7, marginLeft: 8 }}>
                ({t('service.entry.nextDateIntervalHint', { n: scheduleIntervalDays })})
              </span>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Typ */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={labelStyle}>{t('service.entry.type')}</label>
            <button
              type="button"
              onClick={() => setShowNewTypeForm(v => !v)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#0099cc', fontWeight: 600 }}
            >
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
              <p style={{ fontSize: 10, color: '#96aed2', fontWeight: 700, margin: '8px 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {t('common.custom')}
              </p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {customTypes.map(et => (
                  <TypeChip key={et.value} et={et} selected={eventType === et.value} onSelect={setEventType} />
                ))}
              </div>
            </>
          )}

          {/* Inline: neuen Typ anlegen */}
          {showNewTypeForm && (
            <div style={{
              marginTop: 10, padding: 14, borderRadius: 12,
              border: '1px solid #c8d4e8', background: '#f9fbff',
              display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#003366', margin: 0 }}>{t('service.entry.newType')}</p>
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
              <button
                type="button"
                onClick={saveNewType}
                disabled={!newTypeLabel.trim() || savingType}
                style={{
                  padding: '9px', borderRadius: 8, border: 'none',
                  background: !newTypeLabel.trim() ? '#c8d4e8' : '#003366',
                  color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}
              >
                {savingType ? t('common.saving') : t('service.entry.createType')}
              </button>
            </div>
          )}
        </div>

        {/* Titel */}
        <div>
          <label style={labelStyle}>{t('service.entry.title')} *</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={t('service.entry.titlePlaceholder', { type: selectedType.label })}
            style={inputStyle}
          />
        </div>

        {/* Datum */}
        <div>
          <label style={labelStyle}>{t('service.entry.date')}</label>
          <input
            type="datetime-local"
            value={eventDate}
            onChange={e => setEventDate(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Beschreibung */}
        <div>
          <label style={labelStyle}>{t('service.entry.description')}</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={t('service.entry.descriptionPlaceholder')}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        {/* 2-Spalter: Durchgeführt von + Firma */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>{t('service.entry.performedBy')}</label>
            <input value={performedBy} onChange={e => setPerformedBy(e.target.value)} placeholder={t('service.entry.performedByPlaceholder')} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>{t('service.entry.externalCompany')}</label>
            <input value={externalCompany} onChange={e => setExternalCompany(e.target.value)} placeholder={t('service.entry.externalCompanyPlaceholder')} style={inputStyle} />
          </div>
        </div>

        {/* Kosten */}
        <div>
          <label style={labelStyle}>{t('service.entry.costEur')}</label>
          <input
            type="number"
            inputMode="decimal"
            value={costEur}
            onChange={e => setCostEur(e.target.value)}
            placeholder="0,00"
            style={{ ...inputStyle, maxWidth: 160 }}
          />
        </div>

        {/* Nächster Termin – NUR bei manuellem Eintrag anzeigen */}
        {!fromSchedule && (
          <div>
            <label style={labelStyle}>{t('service.entry.nextDate')}</label>
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
                  ✕ {t('common.delete')}
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
                <Calendar size={14} /> {new Date(nextServiceDate + 'T00:00:00').toLocaleDateString(locale, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
        )}

        {/* Checkliste (nur wenn Schritte vorhanden) */}
        {checklistItems.length > 0 && (
          <div style={{
            background: 'white', borderRadius: 16,
            border: '2px solid #003366',
            overflow: 'hidden',
          }}>
            {/* Checkliste Header */}
            <div style={{
              background: 'linear-gradient(135deg, #003366, #005599)',
              padding: '14px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 800, color: 'white', margin: 0 }}>{t('service.checklist.title')}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', margin: '2px 0 0' }}>
                  {t('service.checklist.subtitle')}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>
                  {checklistItems.filter(c => c.checked).length}/{checklistItems.length}
                </span>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', margin: 0 }}>{t('service.checklist.done')}</p>
              </div>
            </div>

            {/* Fortschrittsbalken */}
            <div style={{ height: 4, background: '#e8eef8' }}>
              <div style={{
                height: '100%', background: '#22c55e',
                width: `${checklistItems.filter(c => c.checked).length / checklistItems.length * 100}%`,
                transition: 'width 0.3s',
              }} />
            </div>

            {/* Schritte */}
            <div>
              {checklistItems.map((item, idx) => {
                const noteOpen = openNotes.has(item.id) || item.note.length > 0
                return (
                  <div key={item.id} style={{
                    borderBottom: idx < checklistItems.length - 1 ? '1px solid #f4f6f9' : 'none',
                  }}>
                    {/* Haupt-Zeile */}
                    <div style={{
                      display: 'flex', alignItems: 'flex-start', gap: 12,
                      padding: '13px 16px',
                      background: item.checked ? '#f0fdf4' : 'white',
                      transition: 'background 0.15s',
                    }}>
                      {/* Schritt-Nummer */}
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                        background: item.checked ? '#22c55e' : '#f4f6f9',
                        border: `1.5px solid ${item.checked ? '#22c55e' : '#c8d4e8'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 800,
                        color: item.checked ? 'white' : '#666',
                        transition: 'all 0.15s',
                        marginTop: 1,
                      }}>
                        {item.checked
                          ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          : idx + 1
                        }
                      </div>

                      {/* Text + Ressourcen */}
                      <div
                        style={{ flex: 1, cursor: 'pointer', minWidth: 0 }}
                        onClick={() => setChecklistItems(prev => prev.map((c, i) => i === idx ? { ...c, checked: !c.checked } : c))}
                      >
                        <span style={{
                          fontSize: 14, fontWeight: 600,
                          color: item.checked ? '#888' : '#1a2940',
                          textDecoration: item.checked ? 'line-through' : 'none',
                          transition: 'all 0.15s',
                          display: 'block', lineHeight: 1.4,
                        }}>
                          {item.text}
                        </span>
                        {item.resources && (
                          <span style={{ fontSize: 11, color: '#96aed2', display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#96aed2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                            </svg>
                            {item.resources}
                          </span>
                        )}
                      </div>

                      {/* Notiz-Button */}
                      <button
                        type="button"
                        onClick={() => setOpenNotes(prev => {
                          const next = new Set(prev)
                          next.has(item.id) ? next.delete(item.id) : next.add(item.id)
                          return next
                        })}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          padding: '3px 6px', borderRadius: 6,
                          fontSize: 11, fontWeight: 700,
                          color: item.note ? '#003366' : '#96aed2',
                          flexShrink: 0,
                        }}
                        title="Notiz hinzufügen"
                      >
                        {item.note ? '📝' : t('service.checklist.addNote')}
                      </button>
                    </div>

                    {/* Notiz-Feld */}
                    {noteOpen && (
                      <div style={{ padding: '0 16px 12px 52px' }}>
                        <textarea
                          value={item.note}
                          onChange={e => setChecklistItems(prev => prev.map((c, i) => i === idx ? { ...c, note: e.target.value } : c))}
                          placeholder={t('service.checklist.notePlaceholder')}
                          rows={2}
                          autoFocus
                          style={{
                            width: '100%', padding: '8px 10px', borderRadius: 8,
                            border: '1px solid #c8d4e8', fontSize: 12,
                            fontFamily: 'Arial, sans-serif', color: '#333',
                            backgroundColor: '#f9fbff', outline: 'none',
                            resize: 'vertical', boxSizing: 'border-box' as const,
                          }}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Notizen */}
        <div>
          <label style={labelStyle}>{t('service.entry.notes')}</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder={t('service.entry.notesPlaceholder')}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        {/* Fotos */}
        <div>
          <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 4 }}><Camera size={14} /> {t('service.entry.photos')}</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
          <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 4 }}><Paperclip size={14} /> {t('service.entry.documents')}</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
              {t('service.entry.addDocument')}
            </button>
            <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt" multiple style={{ display: 'none' }} onChange={e => addDocs(e.target.files)} />
          </div>
        </div>

        {error && (
          <div style={{ background: '#fff1f1', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', color: '#dc2626', fontSize: 13 }}>
            {error}
          </div>
        )}

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
          {saving ? t('common.saving') : isEditing ? t('service.entry.saveEdit') : fromSchedule ? t('service.entry.completeMaintenance') : t('service.entry.save')}
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
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: selected ? `${et.color}18` : '#f4f6f9',
        color: selected ? et.color : '#666',
        outline: selected ? `2px solid ${et.color}` : 'none',
        outlineOffset: 1,
      }}
    >
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
  backgroundColor: 'white', color: '#000', outline: 'none',
  boxSizing: 'border-box',
}
