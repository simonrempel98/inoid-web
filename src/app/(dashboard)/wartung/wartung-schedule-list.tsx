'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  // Jahr → Monat → Woche → Tag
  const byYear = new Map<string, Map<string, Map<string, Map<string, ListItem[]>>>>()

  for (const item of items) {
    const dateStr = itemDate(item)
    const d = new Date(dateStr)
    const year = String(d.getFullYear())
    const month = String(d.getMonth()) // 0-indexed
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

function getDayItems(item: ScheduleItem | EventItem, today: string) {
  const isEvent = item._type === 'event'
  const isOverdue = !isEvent && item.next_service_date && item.next_service_date < today
  const isThisWeek = !isEvent && item.next_service_date &&
    item.next_service_date >= today &&
    item.next_service_date <= new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)

  const dotColor = isEvent ? '#8B5CF6'
    : isOverdue ? '#E74C3C'
    : isThisWeek ? '#F39C12'
    : '#0099cc'

  const badge = isEvent
    ? { label: 'Erledigt', bg: '#f3f0ff', color: '#8B5CF6' }
    : isOverdue
    ? { label: 'Überfällig', bg: '#fef2f2', color: '#E74C3C' }
    : isThisWeek
    ? { label: 'Diese Woche', bg: '#fff8e6', color: '#F39C12' }
    : { label: 'Geplant', bg: '#e8f4ff', color: '#0099cc' }

  const assetTitle = item.assets?.title ?? '–'
  const name = isEvent ? item.title : item.name
  const assetId = item.asset_id

  return { dotColor, badge, assetTitle, name, assetId, isEvent }
}

export function WartungScheduleList({
  schedules,
  events,
}: {
  schedules: ScheduleWithAsset[]
  events: LifecycleEventItem[]
}) {
  const router = useRouter()
  const today = new Date().toISOString().slice(0, 10)

  const allItems: ListItem[] = [
    ...schedules.map(s => ({ ...s, _type: 'schedule' as const })),
    ...events.map(e => ({ ...e, _type: 'event' as const })),
  ].sort((a, b) => itemDate(a).localeCompare(itemDate(b)))

  const grouped = groupItems(allItems)
  const years = [...grouped.keys()].sort((a, b) => b.localeCompare(a))

  // Aktuelles Jahr + aktuellen Monat + aktuelle Woche standardmäßig offen
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
                                const { dotColor, badge, assetTitle, name, assetId } = getDayItems(item, today)
                                return (
                                  <div
                                    key={item.id}
                                    onClick={() => router.push(`/assets/${assetId}/service`)}
                                    style={{
                                      padding: '10px 16px 10px 58px', cursor: 'pointer',
                                      borderTop: '1px solid #f8f9fb',
                                      display: 'flex', alignItems: 'center', gap: 10,
                                      background: 'white',
                                      transition: 'background 0.1s',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = '#f8fafd')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                                  >
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
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
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#c8d4e8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="9 18 15 12 9 6"/>
                                    </svg>
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
  )
}
