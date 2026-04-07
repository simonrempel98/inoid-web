'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, X, ChevronRight, CalendarClock } from 'lucide-react'
import type { ScheduleWithAsset } from './wartung-timeline'

// ─── Typen & Hilfsfunktionen ──────────────────────────────────────────────────

type Group = {
  label: string
  color: string
  bg: string
  items: ScheduleWithAsset[]
}

function buildGroups(schedules: ScheduleWithAsset[], today: string, in7: string, in30: string): Group[] {
  const overdue: ScheduleWithAsset[] = []
  const thisWeek: ScheduleWithAsset[] = []
  const thisMonth: ScheduleWithAsset[] = []
  const later: ScheduleWithAsset[] = []

  for (const s of schedules) {
    const d = s.next_service_date ?? '9999-12-31'
    if (d < today)         overdue.push(s)
    else if (d <= in7)     thisWeek.push(s)
    else if (d <= in30)    thisMonth.push(s)
    else                   later.push(s)
  }

  const groups: Group[] = []
  if (overdue.length)    groups.push({ label: 'Überfällig',       color: '#E74C3C', bg: '#fef2f2', items: overdue })
  if (thisWeek.length)   groups.push({ label: 'Diese Woche',      color: '#F39C12', bg: '#fffbeb', items: thisWeek })
  if (thisMonth.length)  groups.push({ label: 'Nächste 30 Tage',  color: '#0099cc', bg: '#f0f8ff', items: thisMonth })
  if (later.length)      groups.push({ label: 'Später',           color: '#96aed2', bg: '#f8fafd', items: later })
  return groups
}

function daysLabel(dateStr: string, today: string): string {
  const diff = Math.ceil((new Date(dateStr).getTime() - new Date(today).getTime()) / 86400000)
  if (diff === 0) return 'heute'
  if (diff === 1) return 'morgen'
  if (diff === -1) return 'gestern'
  if (diff < 0) return `${Math.abs(diff)} Tage überfällig`
  return `in ${diff} Tagen`
}

// ─── Complete Modal ────────────────────────────────────────────────────────────

function CompleteModal({ schedule, onClose, onDone }: {
  schedule: ScheduleWithAsset
  onClose: () => void
  onDone: () => void
}) {
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleComplete() {
    setSaving(true)
    setError(null)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Nicht eingeloggt'); setSaving(false); return }
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    if (!profile?.organization_id) { setError('Keine Organisation'); setSaving(false); return }

    const done = new Date(date)
    const next = new Date(done)
    next.setDate(done.getDate() + (schedule.interval_days ?? 365))
    const nextStr = next.toISOString().slice(0, 10)

    const { error: insertErr } = await supabase.from('asset_lifecycle_events').insert({
      asset_id: schedule.asset_id,
      organization_id: profile.organization_id,
      title: schedule.name ?? 'Wartung',
      event_type: 'maintenance',
      event_date: date,
      notes: notes || null,
    })
    if (insertErr) { setError(insertErr.message); setSaving(false); return }

    const { error: updateErr } = await supabase.from('maintenance_schedules').update({
      last_service_date: date,
      next_service_date: nextStr,
      updated_at: new Date().toISOString(),
    }).eq('id', schedule.id)
    if (updateErr) { setError(updateErr.message); setSaving(false); return }

    setSaving(false)
    onDone()
  }

  const nextPreview = (() => {
    if (!date || !schedule.interval_days) return null
    const d = new Date(date)
    d.setDate(d.getDate() + schedule.interval_days)
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
  })()

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 101, background: 'white', borderRadius: '20px 20px 0 0', padding: '0 20px 40px', boxShadow: '0 -8px 40px rgba(0,51,102,0.18)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#c8d4e8' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, paddingTop: 8 }}>
          <div>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#000', margin: '0 0 3px' }}>Als erledigt markieren</p>
            <p style={{ fontSize: 13, color: '#96aed2', margin: 0 }}>{schedule.assets?.title} · {schedule.name}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#96aed2', padding: 4, display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Durchgeführt am</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} max={today} style={inputStyle} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Notiz (optional)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="z.B. Durchgeführt von Max Mustermann…"
            rows={2} style={{ ...inputStyle, resize: 'none' }} />
        </div>

        {nextPreview && (
          <div style={{ background: '#f0f7ff', borderRadius: 12, padding: '10px 14px', marginBottom: 20, border: '1px solid #c8d4e8' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#96aed2', margin: '0 0 2px' }}>NÄCHSTER TERMIN</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#003366', margin: 0 }}>
              {nextPreview}
              <span style={{ fontSize: 12, fontWeight: 400, color: '#96aed2', marginLeft: 6 }}>({schedule.interval_days} Tage)</span>
            </p>
          </div>
        )}

        {error && <p style={{ fontSize: 13, color: '#E74C3C', background: '#fff5f5', border: '1px solid #fcc', borderRadius: 10, padding: '8px 12px', marginBottom: 12 }}>{error}</p>}

        <button onClick={handleComplete} disabled={saving || !date} style={{
          width: '100%', padding: '15px', borderRadius: 50, border: 'none',
          background: saving || !date ? '#c8d4e8' : '#003366',
          color: 'white', fontSize: 15, fontWeight: 700,
          cursor: saving || !date ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <CheckCircle2 size={18} />
          {saving ? 'Wird gespeichert…' : 'Erledigt markieren'}
        </button>
      </div>
    </>
  )
}

// ─── Hauptkomponente ───────────────────────────────────────────────────────────

export function WartungTaskList({ schedules }: { schedules: ScheduleWithAsset[] }) {
  const router = useRouter()
  const today = new Date().toISOString().slice(0, 10)
  const in7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)

  const [completing, setCompleting] = useState<ScheduleWithAsset | null>(null)
  const groups = buildGroups(schedules, today, in7, in30)

  if (schedules.length === 0) {
    return (
      <div style={{ background: 'white', borderRadius: 16, padding: '40px 20px', border: '1px solid #c8d4e8', textAlign: 'center' }}>
        <CheckCircle2 size={32} color="#c8d4e8" style={{ marginBottom: 10 }} />
        <p style={{ fontWeight: 700, color: '#000', fontSize: 15, margin: '0 0 6px' }}>Alles erledigt</p>
        <p style={{ color: '#666', fontSize: 13, margin: 0 }}>Keine offenen Wartungsaufgaben.</p>
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {groups.map(group => (
          <div key={group.label}>
            {/* Gruppen-Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: group.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: group.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {group.label}
              </span>
              <span style={{ fontSize: 12, color: '#c8d4e8', fontWeight: 600 }}>· {group.items.length}</span>
            </div>

            {/* Task-Karten */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {group.items.map(s => (
                <div key={s.id} style={{
                  background: 'white', borderRadius: 14,
                  border: `1px solid ${group.color}33`,
                  borderLeft: `4px solid ${group.color}`,
                  padding: '12px 14px',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  {/* Info */}
                  <div
                    style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                    onClick={() => router.push(`/assets/${s.asset_id}/service`)}
                  >
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#000', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.assets?.title ?? '–'}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: '#666' }}>{s.name}</span>
                      {s.next_service_date && (
                        <span style={{
                          fontSize: 11, fontWeight: 700,
                          color: group.color,
                          display: 'flex', alignItems: 'center', gap: 3,
                        }}>
                          <CalendarClock size={11} />
                          {daysLabel(s.next_service_date, today)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Zum Serviceheft */}
                  <button
                    type="button"
                    onClick={() => router.push(`/assets/${s.asset_id}/service`)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c8d4e8', padding: 4, display: 'flex', flexShrink: 0 }}
                  >
                    <ChevronRight size={16} />
                  </button>

                  {/* Erledigt-Button */}
                  <button
                    type="button"
                    onClick={() => setCompleting(s)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 16px', borderRadius: 20, flexShrink: 0,
                      background: '#003366', border: 'none',
                      color: 'white', fontSize: 13, fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <CheckCircle2 size={14} />
                    Erledigt
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {completing && (
        <CompleteModal
          schedule={completing}
          onClose={() => setCompleting(null)}
          onDone={() => { setCompleting(null); router.refresh() }}
        />
      )}
    </>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 700, color: '#003366', marginBottom: 6,
}
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 12px', borderRadius: 10,
  border: '1px solid #c8d4e8', fontSize: 14, backgroundColor: 'white',
  color: '#000', outline: 'none', boxSizing: 'border-box', fontFamily: 'Arial, sans-serif',
}
