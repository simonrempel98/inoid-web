'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, X } from 'lucide-react'
import type { ScheduleWithAsset } from './wartung-timeline'

export type LifecycleEventItem = {
  id: string
  asset_id: string
  title: string
  event_type: string
  event_date: string
  assets: { id: string; title: string; category: string | null } | null
}

type ScheduleItem = ScheduleWithAsset & { _type: 'schedule' }
type EventItem = LifecycleEventItem & { _type: 'event' }
type ListItem = ScheduleItem | EventItem

const MONTH_NAMES = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']

const WEEK_DAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

function getWeekNumber(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

function itemDate(item: ListItem): string {
  return item._type === 'schedule'
    ? (item.next_service_date ?? '9999-12-31')
    : item.event_date.slice(0, 10)
}

function groupItems(items: ListItem[]) {
  const byYear = new Map<string, Map<string, Map<string, Map<string, ListItem[]>>>>()
  for (const item of items) {
    const dateStr = itemDate(item)
    const d = new Date(dateStr)
    const year = String(d.getFullYear())
    const month = String(d.getMonth())
    const week = String(getWeekNumber(d))
    const day = dateStr.slice(0, 10)
    if (!byYear.has(year)) byYear.set(year, new Map())
    const byMonth = byYear.get(year)!
    if (!byMonth.has(month)) byMonth.set(month, new Map())
    const byWeek = byMonth.get(month)!
    if (!byWeek.has(week)) byWeek.set(week, new Map())
    const byDay = byWeek.get(week)!
    if (!byDay.has(day)) byDay.set(day, [])
    byDay.get(day)!.push(item)
  }
  return byYear
}

function getDayItems(item: ListItem, today: string) {
  const isEvent = item._type === 'event'
  const isOverdue = !isEvent && item.next_service_date && item.next_service_date < today
  const isThisWeek = !isEvent && item.next_service_date &&
    item.next_service_date >= today &&
    item.next_service_date <= new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)

  const dotColor = isEvent ? '#27AE60'
    : isOverdue ? '#E74C3C'
    : isThisWeek ? '#F39C12'
    : '#0099cc'

  const badge = isEvent
    ? { label: 'Erledigt', bg: '#e8f5e9', color: '#27AE60' }
    : isOverdue
    ? { label: 'Überfällig', bg: '#fef2f2', color: '#E74C3C' }
    : isThisWeek
    ? { label: 'Diese Woche', bg: '#fff8e6', color: '#F39C12' }
    : { label: 'Geplant', bg: '#e8f4ff', color: '#0099cc' }

  const assetTitle = item.assets?.title ?? '–'
  const name = isEvent ? item.title : (item as ScheduleItem).name
  const assetId = item.asset_id

  return { dotColor, badge, assetTitle, name, assetId, isEvent }
}

// ─── Complete Modal ────────────────────────────────────────────────────────────

function CompleteModal({
  schedule,
  onClose,
  onDone,
}: {
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

    // organization_id holen (für RLS)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Nicht eingeloggt'); setSaving(false); return }
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    if (!profile?.organization_id) { setError('Keine Organisation gefunden'); setSaving(false); return }

    // Nächsten Termin berechnen
    const done = new Date(date)
    const next = new Date(done)
    next.setDate(done.getDate() + (schedule.interval_days ?? 365))
    const nextStr = next.toISOString().slice(0, 10)

    // 1. Serviceeintrag erstellen
    const { error: insertErr } = await supabase.from('asset_lifecycle_events').insert({
      asset_id: schedule.asset_id,
      organization_id: profile.organization_id,
      title: schedule.name ?? schedule.title ?? 'Wartung',
      event_type: schedule.event_type ?? 'maintenance',
      event_date: date,
      notes: notes || null,
    })
    if (insertErr) { setError(insertErr.message); setSaving(false); return }

    // 2. Intervall vorrücken
    const { error: updateErr } = await supabase.from('maintenance_schedules').update({
      last_service_date: date,
      next_service_date: nextStr,
      updated_at: new Date().toISOString(),
    }).eq('id', schedule.id)
    if (updateErr) { setError(updateErr.message); setSaving(false); return }

    setSaving(false)
    onDone()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)',
        }}
      />

      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 101,
        background: 'white', borderRadius: '20px 20px 0 0',
        padding: '0 20px 40px',
        boxShadow: '0 -8px 40px rgba(0,51,102,0.18)',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#c8d4e8' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, paddingTop: 8 }}>
          <div>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#000', margin: '0 0 3px' }}>Als erledigt markieren</p>
            <p style={{ fontSize: 13, color: '#96aed2', margin: 0 }}>
              {schedule.assets?.title} · {schedule.name ?? schedule.title}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#96aed2', padding: 4, display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        {/* Datum */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Durchgeführt am</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            max={today}
            style={inputStyle}
          />
        </div>

        {/* Notiz */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Notiz (optional)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="z.B. Durchgeführt von Max Mustermann…"
            rows={2}
            style={{ ...inputStyle, resize: 'none', height: 'auto' }}
          />
        </div>

        {/* Nächster Termin Vorschau */}
        {date && schedule.interval_days && (
          <div style={{
            background: '#f0f7ff', borderRadius: 12, padding: '10px 14px',
            marginBottom: 20, border: '1px solid #c8d4e8',
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#96aed2', margin: '0 0 2px' }}>NÄCHSTER TERMIN</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#003366', margin: 0 }}>
              {(() => {
                const d = new Date(date)
                d.setDate(d.getDate() + schedule.interval_days)
                return d.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
              })()}
              <span style={{ fontSize: 12, fontWeight: 400, color: '#96aed2', marginLeft: 6 }}>
                (in {schedule.interval_days} Tagen)
              </span>
            </p>
          </div>
        )}

        {error && (
          <p style={{ fontSize: 13, color: '#E74C3C', background: '#fff5f5', border: '1px solid #fcc', borderRadius: 10, padding: '8px 12px', marginBottom: 12 }}>
            {error}
          </p>
        )}

        <button
          onClick={handleComplete}
          disabled={saving || !date}
          style={{
            width: '100%', padding: '15px', borderRadius: 50, border: 'none',
            background: saving || !date ? '#c8d4e8' : '#003366',
            color: 'white', fontSize: 15, fontWeight: 700,
            cursor: saving || !date ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <CheckCircle2 size={18} />
          {saving ? 'Wird gespeichert…' : 'Erledigt markieren'}
        </button>
      </div>
    </>
  )
}

// ─── Hauptkomponente ───────────────────────────────────────────────────────────

export function WartungScheduleList({
  schedules,
  events,
}: {
  schedules: ScheduleWithAsset[]
  events: LifecycleEventItem[]
}) {
  const router = useRouter()
  const today = new Date().toISOString().slice(0, 10)
  const [completing, setCompleting] = useState<ScheduleWithAsset | null>(null)

  const allItems: ListItem[] = [
    ...schedules.map(s => ({ ...s, _type: 'schedule' as const })),
    ...events.map(e => ({ ...e, _type: 'event' as const })),
  ].sort((a, b) => itemDate(a).localeCompare(itemDate(b)))

  const grouped = groupItems(allItems)
  const years = [...grouped.keys()].sort((a, b) => b.localeCompare(a))

  const nowDate = new Date()
  const currentYear = String(nowDate.getFullYear())
  const currentMonth = String(nowDate.getMonth())
  const currentWeek = String(getWeekNumber(nowDate))

  const [openYears, setOpenYears] = useState<Set<string>>(() => new Set([currentYear]))
  const [openMonths, setOpenMonths] = useState<Set<string>>(() => new Set([`${currentYear}-${currentMonth}`]))
  const [openWeeks, setOpenWeeks] = useState<Set<string>>(() => new Set([`${currentYear}-${currentMonth}-${currentWeek}`]))

  function toggle<T>(set: Set<T>, val: T): Set<T> {
    const next = new Set(set)
    next.has(val) ? next.delete(val) : next.add(val)
    return next
  }

  if (allItems.length === 0) {
    return (
      <div style={{
        background: 'white', borderRadius: 14, padding: '32px 20px',
        border: '1px solid #c8d4e8', textAlign: 'center', color: '#96aed2', fontSize: 13,
      }}>
        Keine Einträge vorhanden
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {years.map(year => {
          const months = grouped.get(year)!
          const yearOpen = openYears.has(year)
          const totalInYear = [...months.values()].flatMap(w => [...w.values()].flatMap(d => [...d.values()].flat())).length

          return (
            <div key={year} style={{ background: 'white', borderRadius: 14, border: '1px solid #c8d4e8', overflow: 'hidden' }}>

              {/* Jahr-Header */}
              <button type="button" onClick={() => setOpenYears(toggle(openYears, year))} style={{
                width: '100%', padding: '12px 16px', background: '#f8fafd',
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#003366" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round"
                  style={{ flexShrink: 0, transition: 'transform 0.2s', transform: yearOpen ? 'rotate(90deg)' : 'none' }}>
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
                <span style={{ fontWeight: 700, fontSize: 15, color: '#000', flex: 1 }}>{year}</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: '#f0f4ff', color: '#003366' }}>
                  {totalInYear} Einträge
                </span>
              </button>

              {yearOpen && [...months.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([monthIdx, weeks]) => {
                const monthKey = `${year}-${monthIdx}`
                const monthOpen = openMonths.has(monthKey)
                const monthItems = [...weeks.values()].flatMap(d => [...d.values()].flat())
                const doneInMonth = monthItems.filter(i => i._type === 'event').length
                const openInMonth = monthItems.length - doneInMonth

                return (
                  <div key={monthKey} style={{ borderTop: '1px solid #f0f4f9' }}>

                    {/* Monat-Header */}
                    <button type="button" onClick={() => setOpenMonths(toggle(openMonths, monthKey))} style={{
                      width: '100%', padding: '10px 16px 10px 28px',
                      background: 'none', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#96aed2" strokeWidth="2.5"
                        strokeLinecap="round" strokeLinejoin="round"
                        style={{ flexShrink: 0, transition: 'transform 0.2s', transform: monthOpen ? 'rotate(90deg)' : 'none' }}>
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                      <span style={{ fontWeight: 700, fontSize: 13, color: '#333', flex: 1 }}>
                        {MONTH_NAMES[parseInt(monthIdx)]}
                      </span>
                      <div style={{ display: 'flex', gap: 5 }}>
                        {openInMonth > 0 && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: '#fef2f2', color: '#E74C3C' }}>
                            {openInMonth} offen
                          </span>
                        )}
                        {doneInMonth > 0 && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: '#e8f5e9', color: '#27AE60' }}>
                            {doneInMonth} erledigt
                          </span>
                        )}
                      </div>
                    </button>

                    {monthOpen && [...weeks.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([weekNum, days]) => {
                      const weekKey = `${monthKey}-${weekNum}`
                      const weekOpen = openWeeks.has(weekKey)
                      const weekItems = [...days.values()].flat()

                      return (
                        <div key={weekKey} style={{ borderTop: '1px solid #f8f9fb' }}>

                          {/* Woche-Header */}
                          <button type="button" onClick={() => setOpenWeeks(toggle(openWeeks, weekKey))} style={{
                            width: '100%', padding: '8px 16px 8px 44px',
                            background: 'none', border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
                          }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#c8d4e8" strokeWidth="2.5"
                              strokeLinecap="round" strokeLinejoin="round"
                              style={{ flexShrink: 0, transition: 'transform 0.2s', transform: weekOpen ? 'rotate(90deg)' : 'none' }}>
                              <polyline points="9 18 15 12 9 6"/>
                            </svg>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#96aed2' }}>KW {weekNum}</span>
                            <span style={{ fontSize: 11, color: '#c8d4e8' }}>· {weekItems.length} Einträge</span>
                          </button>

                          {weekOpen && [...days.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([dayStr, dayItems]) => {
                            const d = new Date(dayStr)
                            const dayLabel = `${WEEK_DAYS[d.getDay()]}, ${d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}`

                            return (
                              <div key={dayStr}>
                                {/* Tag-Label */}
                                <div style={{ padding: '4px 16px 4px 58px', background: '#fafbfc' }}>
                                  <span style={{ fontSize: 10, fontWeight: 700, color: '#c8d4e8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {dayLabel}
                                  </span>
                                </div>

                                {/* Items des Tages */}
                                {dayItems.map(item => {
                                  const { dotColor, badge, assetTitle, name, assetId, isEvent } = getDayItems(item, today)
                                  return (
                                    <div
                                      key={item.id}
                                      style={{
                                        padding: '10px 12px 10px 58px',
                                        borderTop: '1px solid #f8f9fb',
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        background: 'white',
                                      }}
                                    >
                                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
                                      <div
                                        style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                                        onClick={() => router.push(`/assets/${assetId}/service`)}
                                      >
                                        <p style={{ fontSize: 12, fontWeight: 700, color: '#000', margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                          {assetTitle}
                                        </p>
                                        <p style={{ fontSize: 11, color: '#96aed2', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                          {name}
                                        </p>
                                      </div>

                                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 8, background: badge.bg, color: badge.color, flexShrink: 0 }}>
                                        {badge.label}
                                      </span>

                                      {/* Erledigt-Button – nur für offene Intervalle */}
                                      {!isEvent ? (
                                        <button
                                          type="button"
                                          onClick={e => { e.stopPropagation(); setCompleting(item as ScheduleWithAsset) }}
                                          style={{
                                            display: 'flex', alignItems: 'center', gap: 5,
                                            padding: '6px 12px', borderRadius: 20, flexShrink: 0,
                                            border: '1.5px solid #27AE60', background: 'white',
                                            color: '#27AE60', fontSize: 12, fontWeight: 700,
                                            cursor: 'pointer',
                                          }}
                                        >
                                          <CheckCircle2 size={13} color="#27AE60" />
                                          Erledigt
                                        </button>
                                      ) : (
                                        <span style={{
                                          display: 'flex', alignItems: 'center', gap: 5,
                                          padding: '6px 12px', borderRadius: 20, flexShrink: 0,
                                          background: '#e8f5e9', color: '#27AE60',
                                          fontSize: 12, fontWeight: 700,
                                        }}>
                                          <CheckCircle2 size={13} color="#27AE60" />
                                          Erledigt
                                        </span>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Complete Modal */}
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
  display: 'block', fontSize: 12, fontWeight: 700,
  color: '#003366', marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 12px', borderRadius: 10,
  border: '1px solid #c8d4e8', fontSize: 14,
  backgroundColor: 'white', color: '#000', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'Arial, sans-serif',
}
