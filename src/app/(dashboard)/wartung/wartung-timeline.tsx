'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'

export type ScheduleWithAsset = {
  id: string
  name: string
  interval_days: number
  next_service_date: string | null
  last_service_date: string | null
  is_active: boolean
  asset_id: string
  assets: { id: string; title: string; category: string | null; status: string } | null
}

const RANGES = [
  { label: '2W',  days: 14 },
  { label: '4W',  days: 28 },
  { label: '8W',  days: 56 },
  { label: '6M',  days: 180 },
]

const PAST_DAYS = 7

type UrgencyFilter = 'all' | 'overdue' | 'week' | 'month'

export function WartungTimeline({
  schedules,
  showFilters = true,
}: {
  schedules: ScheduleWithAsset[]
  showFilters?: boolean
}) {
  const router = useRouter()
  const [rangeDays, setRangeDays] = useState(28)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterUrgency, setFilterUrgency] = useState<UrgencyFilter>('all')

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().slice(0, 10)
  const in7Str = new Date(today.getTime() + 7 * 86400000).toISOString().slice(0, 10)
  const in30Str = new Date(today.getTime() + 30 * 86400000).toISOString().slice(0, 10)

  const totalDays = PAST_DAYS + rangeDays
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - PAST_DAYS)

  function pct(date: Date) {
    return ((date.getTime() - startDate.getTime()) / (totalDays * 86400000)) * 100
  }

  const todayPct = pct(today)

  // Achse
  const axisLabels: { label: string; pct: number; isToday: boolean }[] = []
  for (let d = -PAST_DAYS; d <= rangeDays; d++) {
    const date = new Date(today)
    date.setDate(today.getDate() + d)
    const isToday = d === 0
    const showInterval = rangeDays <= 14 ? 1 : rangeDays <= 56 ? 7 : 14
    if (isToday || d % showInterval === 0) {
      axisLabels.push({
        label: isToday ? 'Heute' : date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
        pct: pct(date),
        isToday,
      })
    }
  }

  // Einzigartige Kategorien für Filter
  const categories = useMemo(() => {
    const cats = schedules
      .map(s => s.assets?.category)
      .filter((c): c is string => !!c)
    return [...new Set(cats)].sort()
  }, [schedules])

  // Gefilterte + sortierte Schedules
  const filtered = useMemo(() => {
    return schedules
      .filter(s => {
        if (filterCategory && s.assets?.category !== filterCategory) return false
        if (search) {
          const q = search.toLowerCase()
          if (
            !s.assets?.title?.toLowerCase().includes(q) &&
            !s.name?.toLowerCase().includes(q) &&
            !s.assets?.category?.toLowerCase().includes(q)
          ) return false
        }
        if (filterUrgency !== 'all') {
          const d = s.next_service_date
          if (filterUrgency === 'overdue') return d && d < todayStr
          if (filterUrgency === 'week') return d && d >= todayStr && d <= in7Str
          if (filterUrgency === 'month') return d && d > in7Str && d <= in30Str
        }
        return true
      })
      .sort((a, b) => {
        const da = a.next_service_date ?? '9999'
        const db = b.next_service_date ?? '9999'
        return da < db ? -1 : 1
      })
  }, [schedules, filterCategory, search, filterUrgency, todayStr, in7Str, in30Str])

  const urgencyOptions: { value: UrgencyFilter; label: string; color: string }[] = [
    { value: 'all',      label: 'Alle',          color: '#003366' },
    { value: 'overdue',  label: 'Überfällig',     color: '#E74C3C' },
    { value: 'week',     label: 'Diese Woche',    color: '#F39C12' },
    { value: 'month',    label: 'Nächste 30 Tage', color: '#0099cc' },
  ]

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>

      {/* ── Filter-Bereich ── */}
      {showFilters && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>

          {/* Zeile 1: Suche + Zeitraum */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Suche */}
            <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#96aed2" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
                style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Asset, Intervall…"
                style={{
                  width: '100%', padding: '7px 10px 7px 30px', borderRadius: 10,
                  border: '1px solid #c8d4e8', fontSize: 13, fontFamily: 'Arial, sans-serif',
                  backgroundColor: 'white', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Zeitraum */}
            <div style={{ display: 'flex', gap: 4 }}>
              {RANGES.map(r => (
                <button key={r.days} type="button" onClick={() => setRangeDays(r.days)} style={{
                  padding: '6px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 700,
                  background: rangeDays === r.days ? '#003366' : '#f4f6f9',
                  color: rangeDays === r.days ? 'white' : '#666',
                }}>{r.label}</button>
              ))}
            </div>
          </div>

          {/* Zeile 2: Dringlichkeit */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {urgencyOptions.map(o => (
              <button key={o.value} type="button" onClick={() => setFilterUrgency(o.value)} style={{
                padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 700,
                background: filterUrgency === o.value ? o.color : '#f4f6f9',
                color: filterUrgency === o.value ? 'white' : '#666',
              }}>{o.label}</button>
            ))}
          </div>

          {/* Zeile 3: Kategorien (nur wenn mehrere vorhanden) */}
          {categories.length > 1 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#96aed2', fontWeight: 700 }}>Kategorie:</span>
              <button type="button" onClick={() => setFilterCategory('')} style={{
                padding: '4px 10px', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontSize: 11, fontWeight: 700,
                background: filterCategory === '' ? '#003366' : '#f4f6f9',
                color: filterCategory === '' ? 'white' : '#666',
              }}>Alle</button>
              {categories.map(cat => (
                <button key={cat} type="button" onClick={() => setFilterCategory(cat === filterCategory ? '' : cat)} style={{
                  padding: '4px 10px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  fontSize: 11, fontWeight: 700,
                  background: filterCategory === cat ? '#1B4F72' : '#f4f6f9',
                  color: filterCategory === cat ? 'white' : '#666',
                }}>{cat}</button>
              ))}
            </div>
          )}

          {/* Ergebnis-Zähler */}
          {(search || filterCategory || filterUrgency !== 'all') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#96aed2' }}>
                {filtered.length} von {schedules.length} Intervallen
              </span>
              <button type="button" onClick={() => { setSearch(''); setFilterCategory(''); setFilterUrgency('all') }} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 12, color: '#0099cc', fontWeight: 700, padding: 0,
              }}>× Filter zurücksetzen</button>
            </div>
          )}
        </div>
      )}

      {/* ── Gantt ── */}
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #c8d4e8', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ minWidth: Math.max(520, rangeDays * 14) }}>

            {/* Achse */}
            <div style={{
              display: 'flex', borderBottom: '2px solid #e8eef8',
              background: '#f8fafd', position: 'sticky', top: 0, zIndex: 10,
            }}>
              <div style={{ width: 160, minWidth: 160, borderRight: '1px solid #e8eef8', padding: '8px 12px' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#96aed2', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Asset / Intervall
                </span>
              </div>
              <div style={{ flex: 1, position: 'relative', height: 32 }}>
                <div style={{ position: 'absolute', left: `${todayPct}%`, top: 0, bottom: 0, width: 2, background: '#E74C3C', opacity: 0.6 }} />
                {axisLabels.map((l, i) => (
                  <span key={i} style={{
                    position: 'absolute', left: `${l.pct}%`,
                    top: '50%', transform: 'translate(-50%, -50%)',
                    fontSize: 10, fontWeight: l.isToday ? 700 : 600,
                    color: l.isToday ? '#E74C3C' : '#96aed2',
                    whiteSpace: 'nowrap',
                    background: l.isToday ? '#fff5f5' : 'transparent',
                    padding: l.isToday ? '1px 4px' : '0', borderRadius: 4,
                  }}>{l.label}</span>
                ))}
              </div>
            </div>

            {/* Zeilen */}
            {filtered.length === 0 ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: '#96aed2', fontSize: 13 }}>
                Keine Einträge für diesen Filter
              </div>
            ) : filtered.map((s, rowIdx) => {
              const next = s.next_service_date ? new Date(s.next_service_date) : null
              const last = s.last_service_date ? new Date(s.last_service_date) : null
              const daysToNext = next ? Math.ceil((next.getTime() - today.getTime()) / 86400000) : null

              const color =
                daysToNext === null ? '#96aed2' :
                daysToNext < 0 ? '#E74C3C' :
                daysToNext <= 7 ? '#F39C12' :
                daysToNext <= 21 ? '#0099cc' : '#27AE60'

              const isOverdue = daysToNext !== null && daysToNext < 0
              const barStartPct = last ? Math.max(0, pct(last)) : null
              const barEndPct = next ? Math.min(100, pct(next)) : null

              return (
                <div
                  key={s.id}
                  onClick={() => router.push(`/assets/${s.asset_id}/service`)}
                  style={{
                    display: 'flex',
                    borderBottom: rowIdx < filtered.length - 1 ? '1px solid #f4f6f9' : 'none',
                    cursor: 'pointer',
                    background: isOverdue ? '#fff8f8' : 'white',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = isOverdue ? '#fff0f0' : '#f8fafd')}
                  onMouseLeave={e => (e.currentTarget.style.background = isOverdue ? '#fff8f8' : 'white')}
                >
                  {/* Name-Spalte */}
                  <div style={{
                    width: 160, minWidth: 160, padding: '10px 12px',
                    borderRight: '1px solid #f0f4f9',
                    display: 'flex', flexDirection: 'column', justifyContent: 'center',
                  }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#000', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.assets?.title ?? '–'}
                    </p>
                    <p style={{ fontSize: 10, color: '#96aed2', margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.name}
                    </p>
                    {s.assets?.category && (
                      <p style={{ fontSize: 9, color: '#c8d4e8', margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.assets.category}
                      </p>
                    )}
                  </div>

                  {/* Zeitstrahl */}
                  <div style={{ flex: 1, position: 'relative', height: 48 }}>
                    {axisLabels.filter(l => !l.isToday).map((l, i) => (
                      <div key={i} style={{ position: 'absolute', left: `${l.pct}%`, top: 0, bottom: 0, width: 1, background: '#f4f6f9' }} />
                    ))}
                    <div style={{ position: 'absolute', left: `${todayPct}%`, top: 0, bottom: 0, width: 2, background: '#E74C3C', opacity: 0.2, zIndex: 1 }} />
                    <div style={{ position: 'absolute', left: 0, width: `${todayPct}%`, top: 0, bottom: 0, background: 'rgba(0,0,0,0.02)' }} />

                    {barStartPct !== null && barEndPct !== null && barEndPct > barStartPct && (
                      <div style={{
                        position: 'absolute', left: `${barStartPct}%`, width: `${barEndPct - barStartPct}%`,
                        top: '50%', transform: 'translateY(-50%)', height: 6, borderRadius: 3,
                        background: `${color}30`, zIndex: 2,
                      }} />
                    )}

                    {next && s.interval_days > 0 && (() => {
                      const endDate = new Date(today.getTime() + rangeDays * 86400000)
                      const markers: { date: Date; isPrimary: boolean }[] = []
                      let cursor = new Date(next)
                      while (cursor.getTime() > startDate.getTime()) {
                        cursor = new Date(cursor.getTime() - s.interval_days * 86400000)
                      }
                      cursor = new Date(cursor.getTime() + s.interval_days * 86400000)
                      while (cursor.getTime() <= endDate.getTime()) {
                        markers.push({ date: new Date(cursor), isPrimary: cursor.toDateString() === next.toDateString() })
                        cursor = new Date(cursor.getTime() + s.interval_days * 86400000)
                      }
                      return markers.map((m, mi) => {
                        const mp = pct(m.date)
                        if (mp < -1 || mp > 101) return null
                        const mDays = Math.ceil((m.date.getTime() - today.getTime()) / 86400000)
                        const mColor = mDays < 0 ? '#E74C3C' : mDays <= 7 ? '#F39C12' : mDays <= 21 ? '#0099cc' : '#27AE60'
                        return (
                          <div key={mi} style={{ position: 'absolute', left: `${mp}%`, top: '50%', transform: 'translate(-50%, -50%)', zIndex: 4 }}>
                            <div style={{ position: 'absolute', left: '50%', top: -8, width: 1, height: 22, background: mColor, opacity: 0.35, transform: 'translateX(-50%)' }} />
                            <div style={{
                              width: m.isPrimary ? 14 : 9, height: m.isPrimary ? 14 : 9,
                              borderRadius: '50%', background: mColor, border: '2px solid white',
                              boxShadow: m.isPrimary ? `0 0 0 2px ${mColor}55` : 'none',
                              position: 'relative', zIndex: 1,
                            }} />
                            {m.isPrimary && (
                              <div style={{ position: 'absolute', left: '140%', top: '50%', transform: 'translateY(-50%)', zIndex: 5 }}>
                                <span style={{ fontSize: 10, fontWeight: 700, color: 'white', background: mColor, padding: '2px 5px', borderRadius: 5, whiteSpace: 'nowrap' }}>
                                  {mDays < 0 ? `${Math.abs(mDays)}T über` : mDays === 0 ? 'heute' : `${mDays}T`}
                                </span>
                              </div>
                            )}
                          </div>
                        )
                      })
                    })()}

                    {next && pct(next) > 100 && (
                      <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: '#27AE60', fontWeight: 700 }}>
                        {next.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} →
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Legende */}
        <div style={{ padding: '8px 14px', borderTop: '1px solid #f4f6f9', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { color: '#E74C3C', label: 'Überfällig' },
            { color: '#F39C12', label: '≤ 7 Tage' },
            { color: '#0099cc', label: '≤ 21 Tage' },
            { color: '#27AE60', label: 'OK' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
              <span style={{ fontSize: 10, color: '#96aed2', fontWeight: 600 }}>{l.label}</span>
            </div>
          ))}
          <span style={{ fontSize: 10, color: '#c8d4e8', marginLeft: 'auto' }}>Klick → Serviceheft</span>
        </div>
      </div>
    </div>
  )
}
