'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'

export type ScheduleWithAsset = {
  id: string
  name: string
  interval_days: number
  next_service_date: string | null
  last_service_date: string | null
  is_active: boolean
  asset_id: string
  assets: {
    id: string
    title: string
    category: string | null
    status: string
    serial_number?: string | null
    article_number?: string | null
    barcode?: string | null
    location_text?: string | null
  } | null
}

const PAST_DAYS = 7

function urgencyColor(daysToNext: number | null): string {
  if (daysToNext === null) return '#94a3b8'
  if (daysToNext < 0) return '#ef4444'
  if (daysToNext <= 7) return '#a855f7'
  if (daysToNext <= 21) return '#0099cc'
  return '#22c55e'
}

export function WartungTimeline({
  schedules,
  showFilters = true,
  showAssetName = true,
  rangeDays: rangeDaysProp,
}: {
  schedules: ScheduleWithAsset[]
  showFilters?: boolean
  showAssetName?: boolean
  rangeDays?: number
}) {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const [rangeDaysInternal, setRangeDaysInternal] = useState(28)
  const rangeDays = rangeDaysProp ?? rangeDaysInternal
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [pageSize, setPageSize] = useState(20)
  const [page, setPage] = useState(1)

  const isStandalone = showFilters && rangeDaysProp === undefined

  const RANGES = [
    { label: t('wartung.gantt.twoWeeks'),   days: 14 },
    { label: t('wartung.gantt.fourWeeks'),  days: 28 },
    { label: t('wartung.gantt.eightWeeks'), days: 56 },
    { label: t('wartung.gantt.sixMonths'),  days: 180 },
  ]

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const totalDays = PAST_DAYS + rangeDays
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - PAST_DAYS)

  function pct(date: Date) {
    return ((date.getTime() - startDate.getTime()) / (totalDays * 86400000)) * 100
  }

  const todayPct = pct(today)

  const axisLabels: { label: string; pct: number; isToday: boolean }[] = []
  for (let d = -PAST_DAYS; d <= rangeDays; d++) {
    const date = new Date(today)
    date.setDate(today.getDate() + d)
    const isToday = d === 0
    const showInterval = rangeDays <= 14 ? 1 : rangeDays <= 56 ? 7 : 14
    if (isToday || d % showInterval === 0) {
      axisLabels.push({
        label: isToday ? t('wartung.gantt.today') : date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' }),
        pct: pct(date),
        isToday,
      })
    }
  }

  const filtered = useMemo(() => {
    return [...schedules].sort((a, b) => {
      const da = a.next_service_date ?? '9999'
      const db = b.next_service_date ?? '9999'
      return da < db ? -1 : 1
    })
  }, [schedules])

  const totalPages  = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const displayed   = isStandalone ? filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize) : filtered

  function daysLabel(daysToNext: number): string {
    if (daysToNext < 0) return `${Math.abs(daysToNext)}${t('wartung.gantt.daysOverAbbr')}`
    if (daysToNext === 0) return t('wartung.gantt.today')
    return t('wartung.gantt.inDaysAbbr', { days: daysToNext })
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      <style>{`
        @keyframes ganttPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.6; }
        }
      `}</style>

      {isStandalone && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <select value={rangeDays} onChange={e => { setRangeDaysInternal(Number(e.target.value)); setPage(1) }}
            style={{ padding: '7px 10px', borderRadius: 10, border: '1px solid #c8d4e8', fontSize: 12, fontFamily: 'Arial, sans-serif', background: 'white', outline: 'none', cursor: 'pointer', color: '#003366', fontWeight: 700 }}>
            {RANGES.map(r => <option key={r.days} value={r.days}>{r.label}</option>)}
          </select>

          <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
            style={{ padding: '7px 10px', borderRadius: 10, border: '1px solid #c8d4e8', fontSize: 12, fontFamily: 'Arial, sans-serif', background: 'white', outline: 'none', cursor: 'pointer', color: '#666' }}>
            <option value={10}>10 / {t('common.perPage')}</option>
            <option value={20}>20 / {t('common.perPage')}</option>
            <option value={50}>50 / {t('common.perPage')}</option>
          </select>

          <span style={{ fontSize: 11, color: '#96aed2', marginLeft: 2 }}>
            {filtered.length} {t('service.intervals').toLowerCase()}
            {totalPages > 1 && ` · ${t('common.page')} ${currentPage} / ${totalPages}`}
          </span>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e8edf5', boxShadow: '0 2px 12px rgba(0,51,102,0.06)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ minWidth: Math.max(560, rangeDays * 14) }}>

            {/* Header */}
            <div style={{ display: 'flex', background: 'linear-gradient(to bottom, #f8faff, #f0f4fa)', borderBottom: '2px solid #e8edf5', position: 'sticky', top: 0, zIndex: 10 }}>
              <div style={{ width: 180, minWidth: 180, borderRight: '1px solid #e8edf5', padding: '10px 14px', display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#96aed2', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Asset · {t('service.intervals')}
                </span>
              </div>
              <div style={{ flex: 1, position: 'relative', height: 36 }}>
                <div style={{ position: 'absolute', left: 0, width: `${todayPct}%`, top: 0, bottom: 0, background: 'rgba(0,0,0,0.025)' }}/>
                <div style={{ position: 'absolute', left: `${todayPct}%`, top: 0, bottom: 0, width: 2, background: 'linear-gradient(to bottom, #ef4444, #f87171)', boxShadow: '0 0 10px rgba(239,68,68,0.5), 0 0 2px rgba(239,68,68,0.8)', zIndex: 2 }}/>
                {axisLabels.map((l, i) => (
                  <span key={i} style={{ position: 'absolute', left: `${l.pct}%`, top: '50%', transform: 'translate(-50%, -50%)', fontSize: 10, fontWeight: l.isToday ? 800 : 600, color: l.isToday ? '#ef4444' : '#96aed2', whiteSpace: 'nowrap', background: l.isToday ? '#fff0f0' : 'transparent', padding: l.isToday ? '2px 6px' : '0', borderRadius: l.isToday ? 6 : 0, border: l.isToday ? '1px solid #fecaca' : 'none', zIndex: 3 }}>{l.label}</span>
                ))}
              </div>
            </div>

            {/* Rows */}
            {displayed.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#96aed2', fontSize: 13 }}>
                {t('wartung.filter.noResults')}
              </div>
            ) : displayed.map((s, rowIdx) => {
              const next = s.next_service_date ? new Date(s.next_service_date.slice(0, 10) + 'T00:00:00') : null
              const last = s.last_service_date ? new Date(s.last_service_date.slice(0, 10) + 'T00:00:00') : null
              const daysToNext = next ? Math.ceil((next.getTime() - today.getTime()) / 86400000) : null
              const color = urgencyColor(daysToNext)
              const isOverdue = daysToNext !== null && daysToNext < 0
              const isHovered = hoveredId === s.id

              const barStartPct = last ? Math.max(0, pct(last)) : null
              const barEndPct = next ? Math.min(100, pct(next)) : null
              const barWidth = (barStartPct !== null && barEndPct !== null && barEndPct > barStartPct) ? barEndPct - barStartPct : 0

              return (
                <div key={s.id} onClick={() => router.push(`/assets/${s.asset_id}/service`)}
                  onMouseEnter={() => setHoveredId(s.id)} onMouseLeave={() => setHoveredId(null)}
                  style={{ display: 'flex', borderBottom: rowIdx < displayed.length - 1 ? '1px solid #f0f4f9' : 'none', cursor: 'pointer', background: isHovered ? (isOverdue ? 'linear-gradient(to right, #fff5f5, #ffe4e4)' : 'linear-gradient(to right, #f0f6ff, #e8f2ff)') : (isOverdue ? 'linear-gradient(to right, #fffafa, #fff5f5)' : 'white'), transition: 'background 0.15s' }}>

                  <div style={{ width: 180, minWidth: 180, padding: '11px 14px', borderRight: '1px solid #f0f4f9', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, boxShadow: isOverdue ? `0 0 0 3px ${color}33` : 'none', animation: isOverdue ? 'ganttPulse 1.8s ease-in-out infinite' : 'none' }} />
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#1a2940', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {showAssetName ? (s.assets?.title ?? '–') : s.name}
                      </p>
                    </div>
                    {showAssetName && (
                      <p style={{ fontSize: 10, color: '#96aed2', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingLeft: 14 }}>
                        {s.name}
                      </p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 14 }}>
                      {daysToNext !== null && (
                        <span style={{ fontSize: 9, fontWeight: 800, color: color, background: `${color}15`, padding: '1px 5px', borderRadius: 4, letterSpacing: '0.03em' }}>
                          {daysLabel(daysToNext)}
                        </span>
                      )}
                      {isHovered && (
                        <button type="button"
                          onClick={e => { e.stopPropagation(); router.push(`/assets/${s.asset_id}/service/neu?schedule_id=${s.id}`) }}
                          title={t('wartung.complete')}
                          style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 10, border: 'none', background: '#003366', color: 'white', fontSize: 9, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          <CheckCircle2 size={9} />
                          {t('wartung.completeBtn')}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Zeitstrahl */}
                  <div style={{ flex: 1, position: 'relative', height: 60 }}>
                    <div style={{ position: 'absolute', left: 0, width: `${todayPct}%`, top: 0, bottom: 0, background: 'rgba(0,0,0,0.018)' }} />
                    {axisLabels.filter(l => !l.isToday).map((l, i) => (
                      <div key={i} style={{ position: 'absolute', left: `${l.pct}%`, top: 0, bottom: 0, width: 1, background: '#f0f4f9' }} />
                    ))}
                    <div style={{ position: 'absolute', left: `${todayPct}%`, top: 0, bottom: 0, width: 2, background: '#ef4444', opacity: 0.3, zIndex: 1 }} />

                    {barWidth > 0 && barStartPct !== null && barEndPct !== null && (() => {
                      const fiveDaysBefore = next ? new Date(next.getTime() - 5 * 86400000) : null
                      const fiveBeforePct = fiveDaysBefore ? pct(fiveDaysBefore) : barEndPct
                      const colorStartInBar = Math.max(0, Math.min(100, ((fiveBeforePct - barStartPct) / barWidth) * 100))
                      return (
                        <div style={{ position: 'absolute', left: `${barStartPct}%`, width: `${barWidth}%`, top: '50%', transform: 'translateY(-50%)', height: 14, borderRadius: 7, background: isOverdue ? `repeating-linear-gradient(135deg, ${color}44 0px, ${color}44 4px, ${color}18 4px, ${color}18 10px)` : `linear-gradient(90deg, #dde5f0 0%, #dde5f0 ${colorStartInBar}%, ${color}22 ${colorStartInBar}%, ${color}99 ${colorStartInBar + (100 - colorStartInBar) * 0.6}%, ${color} 100%)`, border: `1px solid ${isOverdue ? color + '77' : color + '44'}`, boxShadow: isOverdue ? `0 0 10px ${color}44, inset 0 1px 0 rgba(255,255,255,0.25)` : `0 1px 6px ${color}28, inset 0 1px 0 rgba(255,255,255,0.4)`, overflow: 'hidden', zIndex: 2 }}>
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '45%', background: 'linear-gradient(to bottom, rgba(255,255,255,0.38), transparent)', borderRadius: '7px 7px 0 0' }} />
                        </div>
                      )
                    })()}

                    {barEndPct !== null && barEndPct >= -2 && barEndPct <= 102 && (
                      <div style={{ position: 'absolute', left: `${Math.min(99, barEndPct)}%`, top: '50%', transform: 'translate(-50%, -50%)', width: 28, height: 28, borderRadius: '50%', background: `radial-gradient(circle, ${color}55 0%, ${color}22 45%, transparent 70%)`, zIndex: 3, pointerEvents: 'none' }} />
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
                        const mColor = urgencyColor(mDays)
                        const isMain = m.isPrimary
                        return (
                          <div key={mi} style={{ position: 'absolute', left: `${mp}%`, top: '50%', transform: 'translate(-50%, -50%)', zIndex: 4 }}>
                            <div style={{ position: 'absolute', left: '50%', top: isMain ? -12 : -8, width: 2, height: isMain ? 12 : 8, background: mColor, opacity: 0.5, transform: 'translateX(-50%)' }} />
                            <div style={{ width: isMain ? 16 : 10, height: isMain ? 16 : 10, borderRadius: '50%', background: isMain ? `radial-gradient(circle at 35% 35%, ${mColor}ee, ${mColor})` : mColor, border: '2px solid white', boxShadow: isMain ? `0 0 0 3px ${mColor}33, 0 2px 8px ${mColor}55` : `0 1px 3px ${mColor}44`, position: 'relative', zIndex: 1 }} />
                            {isMain && (
                              <div style={{ position: 'absolute', left: '50%', top: -32, transform: 'translateX(-50%)', zIndex: 6, pointerEvents: 'none' }}>
                                <div style={{ background: mColor, color: 'white', fontSize: 10, fontWeight: 800, padding: '3px 7px', borderRadius: 8, whiteSpace: 'nowrap', boxShadow: `0 2px 8px ${mColor}55` }}>
                                  {daysLabel(mDays)}
                                </div>
                                <div style={{ width: 0, height: 0, margin: '0 auto', borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: `4px solid ${mColor}` }} />
                              </div>
                            )}
                          </div>
                        )
                      })
                    })()}

                    {next && pct(next) > 100 && (
                      <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: '#22c55e', fontWeight: 800, background: '#f0fdf4', padding: '2px 7px', borderRadius: 6, border: '1px solid #bbf7d0' }}>
                        {next.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })} →
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Legende */}
        <div style={{ padding: '10px 16px', borderTop: '1px solid #f0f4f9', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', background: '#fafbff' }}>
          {[
            { color: '#ef4444', label: t('wartung.gantt.legendOverdue') },
            { color: '#a855f7', label: t('wartung.gantt.legend7days') },
            { color: '#0099cc', label: t('wartung.gantt.legend21days') },
            { color: '#22c55e', label: t('wartung.gantt.legendOk') },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: l.color, boxShadow: `0 0 0 2px ${l.color}33` }} />
              <span style={{ fontSize: 10, color: '#96aed2', fontWeight: 700 }}>{l.label}</span>
            </div>
          ))}
          <span style={{ fontSize: 10, color: '#c8d4e8', marginLeft: 'auto' }}>
            {schedules.length} {t('service.intervals').toLowerCase()} · {t('wartung.gantt.clickHint')}
          </span>
        </div>
      </div>

      {/* Pagination (Standalone) */}
      {isStandalone && totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 }}>
          <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
            style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #c8d4e8', background: currentPage === 1 ? '#f4f6f9' : 'white', color: currentPage === 1 ? '#c8d4e8' : '#003366', cursor: currentPage === 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronLeft size={13} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} type="button" onClick={() => setPage(p)}
              style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${p === currentPage ? '#003366' : '#c8d4e8'}`, background: p === currentPage ? '#003366' : 'white', color: p === currentPage ? 'white' : '#666', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Arial, sans-serif' }}>
              {p}
            </button>
          ))}

          <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
            style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #c8d4e8', background: currentPage === totalPages ? '#f4f6f9' : 'white', color: currentPage === totalPages ? '#c8d4e8' : '#003366', cursor: currentPage === totalPages ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronRight size={13} />
          </button>
        </div>
      )}
    </div>
  )
}
