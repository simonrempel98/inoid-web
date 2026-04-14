'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, X } from 'lucide-react'
import type { ScheduleWithAsset } from './wartung-timeline'

const ALLOWED_EVENT_TYPES = ['maintenance','overhaul','coating','repair','cleaning','incident','inspection','installation','decommission','other']

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
  const t = useTranslations()
  const locale = useLocale()
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
    if (!user) { setError(t('common.error')); setSaving(false); return }
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    if (!profile?.organization_id) { setError(t('common.error')); setSaving(false); return }

    const done = new Date(date)
    const next = new Date(done)
    next.setDate(done.getDate() + (schedule.interval_days ?? 365))
    const nextStr = next.toISOString().slice(0, 10)

    const { error: insertErr } = await supabase.from('asset_lifecycle_events').insert({
      asset_id: schedule.asset_id,
      organization_id: profile.organization_id,
      title: schedule.name ?? schedule.title ?? 'Wartung',
      event_type: ALLOWED_EVENT_TYPES.includes(schedule.event_type ?? '') ? schedule.event_type : 'maintenance',
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
        background: 'var(--ds-surface)', borderRadius: '20px 20px 0 0',
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
            <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--ds-text)', margin: '0 0 3px' }}>{t('wartung.scheduleList.markDone')}</p>
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
          <label style={labelStyle}>{t('wartung.scheduleList.performedOn')}</label>
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
          <label style={labelStyle}>{t('wartung.scheduleList.note')}</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder={t('wartung.scheduleList.notePlaceholder')}
            rows={2}
            style={{ ...inputStyle, resize: 'none', height: 'auto' }}
          />
        </div>

        {/* Nächster Termin Vorschau */}
        {date && schedule.interval_days && (
          <div style={{
            background: '#f0f7ff', borderRadius: 12, padding: '10px 14px',
            marginBottom: 20, border: '1px solid var(--ds-border)',
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#96aed2', margin: '0 0 2px' }}>{t('wartung.scheduleList.nextDate')}</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#003366', margin: 0 }}>
              {(() => {
                const d = new Date(date)
                d.setDate(d.getDate() + schedule.interval_days)
                return d.toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' })
              })()}
              <span style={{ fontSize: 12, fontWeight: 400, color: '#96aed2', marginLeft: 6 }}>
                ({t('wartung.scheduleList.nextDateIn', { n: schedule.interval_days })})
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
          {saving ? t('wartung.scheduleList.saving') : t('wartung.scheduleList.confirmBtn')}
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
  const t = useTranslations()
  const locale = useLocale()
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

  const [openYears, setOpenYears] = useState<Record<string, boolean>>(() => ({ [currentYear]: true }))
  const [openMonths, setOpenMonths] = useState<Record<string, boolean>>(() => ({ [`${currentYear}-${currentMonth}`]: true }))
  const [openWeeks, setOpenWeeks] = useState<Record<string, boolean>>(() => ({ [`${currentYear}-${currentMonth}-${currentWeek}`]: true }))

  if (allItems.length === 0) {
    return (
      <div style={{
        background: 'var(--ds-surface)', borderRadius: 14, padding: '32px 20px',
        border: '1px solid var(--ds-border)', textAlign: 'center', color: '#96aed2', fontSize: 13,
      }}>
        {t('wartung.scheduleList.noEntries')}
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {years.map(year => {
          const months = grouped.get(year)!
          const yearOpen = !!openYears[year]
          const totalInYear = [...months.values()].flatMap(w => [...w.values()].flatMap(d => [...d.values()].flat())).length

          return (
            <div key={year} style={{ background: 'var(--ds-surface)', borderRadius: 14, border: '1px solid var(--ds-border)', overflow: 'hidden' }}>

              {/* Jahr-Header */}
              <button type="button" onClick={() => setOpenYears(prev => ({ ...prev, [year]: !prev[year] }))} style={{
                width: '100%', padding: '12px 16px', background: '#f8fafd',
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#003366" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round"
                  style={{ flexShrink: 0, transition: 'transform 0.2s', transform: yearOpen ? 'rotate(90deg)' : 'none' }}>
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
                <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--ds-text)', flex: 1 }}>{year}</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: '#f0f4ff', color: '#003366' }}>
                  {t('wartung.scheduleList.entries', { n: totalInYear })}
                </span>
              </button>

              {yearOpen && [...months.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([monthIdx, weeks]) => {
                const monthKey = `${year}-${monthIdx}`
                const monthOpen = !!openMonths[monthKey]
                const monthItems = [...weeks.values()].flatMap(d => [...d.values()].flat())
                const doneInMonth = monthItems.filter(i => i._type === 'event').length
                const openInMonth = monthItems.length - doneInMonth

                const monthDate = new Date(parseInt(year), parseInt(monthIdx), 1)
                const monthLabel = monthDate.toLocaleDateString(locale, { month: 'long' })

                return (
                  <div key={monthKey} style={{ borderTop: '1px solid #f0f4f9' }}>

                    {/* Monat-Header */}
                    <button type="button" onClick={() => setOpenMonths(prev => ({ ...prev, [monthKey]: !prev[monthKey] }))} style={{
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
                        {monthLabel}
                      </span>
                      <div style={{ display: 'flex', gap: 5 }}>
                        {openInMonth > 0 && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: '#fef2f2', color: '#E74C3C' }}>
                            {openInMonth} {t('wartung.scheduleList.open')}
                          </span>
                        )}
                        {doneInMonth > 0 && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: '#e8f5e9', color: '#27AE60' }}>
                            {doneInMonth} {t('wartung.scheduleList.done')}
                          </span>
                        )}
                      </div>
                    </button>

                    {monthOpen && [...weeks.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([weekNum, days]) => {
                      const weekKey = `${monthKey}-${weekNum}`
                      const weekOpen = !!openWeeks[weekKey]
                      const weekItems = [...days.values()].flat()

                      return (
                        <div key={weekKey} style={{ borderTop: '1px solid #f8f9fb' }}>

                          {/* Woche-Header */}
                          <button type="button" onClick={() => setOpenWeeks(prev => ({ ...prev, [weekKey]: !prev[weekKey] }))} style={{
                            width: '100%', padding: '8px 16px 8px 44px',
                            background: 'none', border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
                          }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#c8d4e8" strokeWidth="2.5"
                              strokeLinecap="round" strokeLinejoin="round"
                              style={{ flexShrink: 0, transition: 'transform 0.2s', transform: weekOpen ? 'rotate(90deg)' : 'none' }}>
                              <polyline points="9 18 15 12 9 6"/>
                            </svg>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#96aed2' }}>{t('wartung.scheduleList.weekAbbr')} {weekNum}</span>
                            <span style={{ fontSize: 11, color: '#c8d4e8' }}>· {t('wartung.scheduleList.entries', { n: weekItems.length })}</span>
                          </button>

                          {weekOpen && [...days.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([dayStr, dayItems]) => {
                            const d = new Date(dayStr + 'T00:00:00')
                            const isEvent = (item: ListItem) => item._type === 'event'
                            const isOverdue = (item: ListItem) => !isEvent(item) && (item as ScheduleItem).next_service_date && (item as ScheduleItem).next_service_date! < today
                            const isThisWeek = (item: ListItem) => !isEvent(item) && (item as ScheduleItem).next_service_date &&
                              (item as ScheduleItem).next_service_date! >= today &&
                              (item as ScheduleItem).next_service_date! <= new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)

                            const dayLabel = d.toLocaleDateString(locale, { weekday: 'short', day: '2-digit', month: '2-digit' })

                            return (
                              <div key={dayStr}>
                                {/* Tag-Label */}
                                <div style={{ padding: '4px 16px 4px 58px', background: 'var(--ds-surface2)' }}>
                                  <span style={{ fontSize: 10, fontWeight: 700, color: '#c8d4e8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {dayLabel}
                                  </span>
                                </div>

                                {/* Items des Tages */}
                                {dayItems.map(item => {
                                  const ev = isEvent(item)
                                  const ov = isOverdue(item)
                                  const tw = isThisWeek(item)

                                  const dotColor = ev ? '#27AE60' : ov ? '#E74C3C' : tw ? '#a855f7' : '#0099cc'
                                  const badge = ev
                                    ? { label: t('wartung.scheduleList.badgeDone'), bg: '#e8f5e9', color: '#27AE60' }
                                    : ov
                                    ? { label: t('wartung.scheduleList.badgeOverdue'), bg: '#fef2f2', color: '#E74C3C' }
                                    : tw
                                    ? { label: t('wartung.scheduleList.badgeThisWeek'), bg: '#faf5ff', color: '#a855f7' }
                                    : { label: t('wartung.scheduleList.badgePlanned'), bg: '#e8f4ff', color: '#0099cc' }

                                  const assetTitle = item.assets?.title ?? '–'
                                  const name = ev ? (item as EventItem).title : (item as ScheduleItem).name
                                  const assetId = item.asset_id

                                  return (
                                    <div
                                      key={item.id}
                                      style={{
                                        padding: '10px 12px 10px 58px',
                                        borderTop: '1px solid #f8f9fb',
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        background: 'var(--ds-surface)',
                                      }}
                                    >
                                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
                                      <div
                                        style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                                        onClick={() => router.push(`/assets/${assetId}/service`)}
                                      >
                                        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--ds-text)', margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                          {assetTitle}
                                        </p>
                                        <p style={{ fontSize: 11, color: '#96aed2', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                          {name}
                                        </p>
                                      </div>

                                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 8, background: badge.bg, color: badge.color, flexShrink: 0 }}>
                                        {badge.label}
                                      </span>

                                      {!ev ? (
                                        <button
                                          type="button"
                                          onClick={e => { e.stopPropagation(); setCompleting(item as ScheduleWithAsset) }}
                                          style={{
                                            display: 'flex', alignItems: 'center', gap: 5,
                                            padding: '6px 12px', borderRadius: 20, flexShrink: 0,
                                            border: '1.5px solid #27AE60', background: 'var(--ds-surface)',
                                            color: '#27AE60', fontSize: 12, fontWeight: 700,
                                            cursor: 'pointer',
                                          }}
                                        >
                                          <CheckCircle2 size={13} color="#27AE60" />
                                          {t('wartung.scheduleList.doneBtn')}
                                        </button>
                                      ) : (
                                        <span style={{
                                          display: 'flex', alignItems: 'center', gap: 5,
                                          padding: '6px 12px', borderRadius: 20, flexShrink: 0,
                                          background: '#e8f5e9', color: '#27AE60',
                                          fontSize: 12, fontWeight: 700,
                                        }}>
                                          <CheckCircle2 size={13} color="#27AE60" />
                                          {t('wartung.scheduleList.doneBtn')}
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
  border: '1px solid var(--ds-border)', fontSize: 14,
  backgroundColor: 'white', color: 'var(--ds-text)', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'Arial, sans-serif',
}
