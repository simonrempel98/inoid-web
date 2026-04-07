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

function urgencyColor(daysToNext: number | null): string {
  if (daysToNext === null) return '#94a3b8'
  if (daysToNext < 0) return '#ef4444'
  if (daysToNext <= 7) return '#f59e0b'
  if (daysToNext <= 21) return '#0099cc'
  return '#22c55e'
}

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
  const [hoveredId, setHoveredId] = useState<string | null>(null)

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

  // Achsenbeschriftung
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

  const categories = useMemo(() => {
    const cats = schedules.map(s => s.assets?.category).filter((c): c is string => !!c)
    return [...new Set(cats)].sort()
  }, [schedules])

  const filtered = useMemo(() => {
    return schedules
      .filter(s => {
        if (filterCategory && s.assets?.category !== filterCategory) return false
        if (search) {
          const q = search.toLowerCase()
          if (!s.assets?.title?.toLowerCase().includes(q) && !s.name?.toLowerCase().includes(q)) return false
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
    { value: 'all',     label: 'Alle',           color: '#003366' },
    { value: 'overdue', label: 'Überfällig',      color: '#ef4444' },
    { value: 'week',    label: 'Diese Woche',     color: '#f59e0b' },
    { value: 'month',   label: 'Nächste 30 Tage', color: '#0099cc' },
  ]

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>

      {/* ── Filter ── */}
      {showFilters && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#96aed2" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
                style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Asset oder Intervall suchen…"
                style={{
                  width: '100%', padding: '8px 10px 8px 32px', borderRadius: 10,
                  border: '1px solid #c8d4e8', fontSize: 13, fontFamily: 'Arial, sans-serif',
                  backgroundColor: 'white', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 4, background: '#f4f6f9', borderRadius: 10, padding: '3px' }}>
              {RANGES.map(r => (
                <button key={r.days} type="button" onClick={() => setRangeDays(r.days)} style={{
                  padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 700,
                  background: rangeDays === r.days ? 'white' : 'transparent',
                  color: rangeDays === r.days ? '#003366' : '#96aed2',
                  boxShadow: rangeDays === r.days ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s',
                }}>{r.label}</button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {urgencyOptions.map(o => (
              <button key={o.value} type="button" onClick={() => setFilterUrgency(o.value)} style={{
                padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 700,
                background: filterUrgency === o.value ? o.color : '#f4f6f9',
                color: filterUrgency === o.value ? 'white' : '#666',
                transition: 'all 0.15s',
              }}>{o.label}</button>
            ))}
            {categories.length > 1 && categories.map(cat => (
              <button key={cat} type="button" onClick={() => setFilterCategory(cat === filterCategory ? '' : cat)} style={{
                padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 700,
                background: filterCategory === cat ? '#1B4F72' : '#f4f6f9',
                color: filterCategory === cat ? 'white' : '#666',
              }}>{cat}</button>
            ))}
            {(search || filterCategory || filterUrgency !== 'all') && (
              <button type="button" onClick={() => { setSearch(''); setFilterCategory(''); setFilterUrgency('all') }} style={{
                padding: '5px 10px', borderRadius: 20, border: '1px solid #c8d4e8',
                background: 'white', color: '#96aed2', fontSize: 11, fontWeight: 700, cursor: 'pointer',
              }}>× Filter löschen</button>
            )}
          </div>
        </div>
      )}

      {/* ── Gantt-Chart ── */}
      <div style={{
        background: 'white', borderRadius: 16,
        border: '1px solid #e8edf5',
        boxShadow: '0 2px 12px rgba(0,51,102,0.06)',
        overflow: 'hidden',
      }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ minWidth: Math.max(560, rangeDays * 14) }}>

            {/* Kopfzeile */}
            <div style={{
              display: 'flex',
              background: 'linear-gradient(to bottom, #f8faff, #f0f4fa)',
              borderBottom: '2px solid #e8edf5',
              position: 'sticky', top: 0, zIndex: 10,
            }}>
              <div style={{ width: 180, minWidth: 180, borderRight: '1px solid #e8edf5', padding: '10px 14px', display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#96aed2', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Asset · Intervall
                </span>
              </div>
              <div style={{ flex: 1, position: 'relative', height: 36 }}>
                {/* Hintergrund-Streifen für vergangene Zeit */}
                <div style={{
                  position: 'absolute', left: 0, width: `${todayPct}%`,
                  top: 0, bottom: 0,
                  background: 'rgba(0,0,0,0.025)',
                }}/>
                {/* Heute-Linie */}
                <div style={{
                  position: 'absolute', left: `${todayPct}%`, top: 0, bottom: 0,
                  width: 2, background: '#ef4444',
                  boxShadow: '0 0 6px rgba(239,68,68,0.4)',
                  zIndex: 2,
                }}/>
                {axisLabels.map((l, i) => (
                  <span key={i} style={{
                    position: 'absolute', left: `${l.pct}%`,
                    top: '50%', transform: 'translate(-50%, -50%)',
                    fontSize: 10, fontWeight: l.isToday ? 800 : 600,
                    color: l.isToday ? '#ef4444' : '#96aed2',
                    whiteSpace: 'nowrap',
                    background: l.isToday ? '#fff0f0' : 'transparent',
                    padding: l.isToday ? '2px 6px' : '0',
                    borderRadius: l.isToday ? 6 : 0,
                    border: l.isToday ? '1px solid #fecaca' : 'none',
                    zIndex: 3,
                  }}>{l.label}</span>
                ))}
              </div>
            </div>

            {/* Zeilen */}
            {filtered.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#96aed2', fontSize: 13 }}>
                Keine Einträge für diesen Filter
              </div>
            ) : filtered.map((s, rowIdx) => {
              const next = s.next_service_date ? new Date(s.next_service_date) : null
              const last = s.last_service_date ? new Date(s.last_service_date) : null
              const daysToNext = next ? Math.ceil((next.getTime() - today.getTime()) / 86400000) : null
              const color = urgencyColor(daysToNext)
              const isOverdue = daysToNext !== null && daysToNext < 0
              const isHovered = hoveredId === s.id

              const barStartPct = last ? Math.max(0, pct(last)) : null
              const barEndPct = next ? Math.min(100, pct(next)) : null
              const barWidth = (barStartPct !== null && barEndPct !== null && barEndPct > barStartPct)
                ? barEndPct - barStartPct : 0

              return (
                <div
                  key={s.id}
                  onClick={() => router.push(`/assets/${s.asset_id}/service`)}
                  onMouseEnter={() => setHoveredId(s.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    display: 'flex',
                    borderBottom: rowIdx < filtered.length - 1 ? '1px solid #f0f4f9' : 'none',
                    cursor: 'pointer',
                    background: isHovered
                      ? (isOverdue ? '#fff0f0' : '#f5f8ff')
                      : (isOverdue ? '#fffafa' : 'white'),
                    transition: 'background 0.12s',
                  }}
                >
                  {/* Name-Spalte */}
                  <div style={{
                    width: 180, minWidth: 180, padding: '11px 14px',
                    borderRight: '1px solid #f0f4f9',
                    display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#1a2940', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.assets?.title ?? '–'}
                      </p>
                    </div>
                    <p style={{ fontSize: 10, color: '#96aed2', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingLeft: 12 }}>
                      {s.name}
                    </p>
                  </div>

                  {/* Zeitstrahl */}
                  <div style={{ flex: 1, position: 'relative', height: 52 }}>
                    {/* Hintergrund vergangene Zeit */}
                    <div style={{ position: 'absolute', left: 0, width: `${todayPct}%`, top: 0, bottom: 0, background: 'rgba(0,0,0,0.015)' }} />

                    {/* Vertikale Gitternetzlinien */}
                    {axisLabels.filter(l => !l.isToday).map((l, i) => (
                      <div key={i} style={{ position: 'absolute', left: `${l.pct}%`, top: 0, bottom: 0, width: 1, background: '#f0f4f9' }} />
                    ))}

                    {/* Heute-Linie */}
                    <div style={{
                      position: 'absolute', left: `${todayPct}%`, top: 0, bottom: 0,
                      width: 2, background: '#ef4444', opacity: 0.25, zIndex: 1,
                    }} />

                    {/* Intervall-Balken (letzter → nächster Termin) */}
                    {barWidth > 0 && barStartPct !== null && barEndPct !== null && (
                      <div style={{
                        position: 'absolute',
                        left: `${barStartPct}%`,
                        width: `${barWidth}%`,
                        top: '50%', transform: 'translateY(-50%)',
                        height: 10, borderRadius: 5,
                        background: `linear-gradient(90deg, ${color}22, ${color}55)`,
                        border: `1px solid ${color}44`,
                        zIndex: 2,
                      }} />
                    )}

                    {/* Termin-Marker (wiederkehrend) */}
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
                        const mColor = urgencyColor(mDays)
                        const isMain = m.isPrimary

                        return (
                          <div key={mi} style={{
                            position: 'absolute', left: `${mp}%`,
                            top: '50%', transform: 'translate(-50%, -50%)',
                            zIndex: 4,
                          }}>
                            {/* Verbindungslinie nach oben */}
                            <div style={{
                              position: 'absolute', left: '50%', top: isMain ? -12 : -8,
                              width: 2, height: isMain ? 12 : 8,
                              background: mColor, opacity: 0.5,
                              transform: 'translateX(-50%)',
                            }} />
                            {/* Marker-Punkt */}
                            <div style={{
                              width: isMain ? 16 : 10,
                              height: isMain ? 16 : 10,
                              borderRadius: '50%',
                              background: isMain
                                ? `radial-gradient(circle at 35% 35%, ${mColor}ee, ${mColor})`
                                : mColor,
                              border: `2px solid white`,
                              boxShadow: isMain
                                ? `0 0 0 3px ${mColor}33, 0 2px 8px ${mColor}55`
                                : `0 1px 3px ${mColor}44`,
                              position: 'relative', zIndex: 1,
                            }} />
                            {/* Label beim Haupttermin */}
                            {isMain && (
                              <div style={{
                                position: 'absolute', left: '50%', top: -32,
                                transform: 'translateX(-50%)',
                                zIndex: 6, pointerEvents: 'none',
                              }}>
                                <div style={{
                                  background: mColor,
                                  color: 'white',
                                  fontSize: 10, fontWeight: 800,
                                  padding: '3px 7px', borderRadius: 8,
                                  whiteSpace: 'nowrap',
                                  boxShadow: `0 2px 8px ${mColor}55`,
                                }}>
                                  {mDays < 0 ? `${Math.abs(mDays)}T über` : mDays === 0 ? 'heute' : `${mDays}T`}
                                </div>
                                {/* Pfeil nach unten */}
                                <div style={{
                                  width: 0, height: 0, margin: '0 auto',
                                  borderLeft: '4px solid transparent',
                                  borderRight: '4px solid transparent',
                                  borderTop: `4px solid ${mColor}`,
                                }} />
                              </div>
                            )}
                          </div>
                        )
                      })
                    })()}

                    {/* Datum außerhalb Sichtbereich */}
                    {next && pct(next) > 100 && (
                      <div style={{
                        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                        fontSize: 10, color: '#22c55e', fontWeight: 800,
                        background: '#f0fdf4', padding: '2px 7px', borderRadius: 6,
                        border: '1px solid #bbf7d0',
                      }}>
                        {next.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} →
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Legende + Zähler */}
        <div style={{
          padding: '10px 16px',
          borderTop: '1px solid #f0f4f9',
          display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center',
          background: '#fafbff',
        }}>
          {[
            { color: '#ef4444', label: 'Überfällig' },
            { color: '#f59e0b', label: '≤ 7 Tage' },
            { color: '#0099cc', label: '≤ 21 Tage' },
            { color: '#22c55e', label: 'OK' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%', background: l.color,
                boxShadow: `0 0 0 2px ${l.color}33`,
              }} />
              <span style={{ fontSize: 10, color: '#96aed2', fontWeight: 700 }}>{l.label}</span>
            </div>
          ))}
          <span style={{ fontSize: 10, color: '#c8d4e8', marginLeft: 'auto' }}>
            {filtered.length} Intervalle · Klick → Serviceheft
          </span>
        </div>
      </div>
    </div>
  )
}
