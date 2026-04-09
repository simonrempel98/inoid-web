'use client'

import { useRouter } from 'next/navigation'
import { CheckCircle2, ChevronRight, CalendarClock } from 'lucide-react'
import type { ScheduleWithAsset } from './wartung-timeline'
import { useTranslations } from 'next-intl'

type Group = {
  label: string
  color: string
  items: ScheduleWithAsset[]
}

function buildGroups(schedules: ScheduleWithAsset[], today: string, in7: string, in30: string, labels: { overdue: string; thisWeek: string; next30Days: string; later: string }): Group[] {
  const overdue:   ScheduleWithAsset[] = []
  const thisWeek:  ScheduleWithAsset[] = []
  const thisMonth: ScheduleWithAsset[] = []
  const later:     ScheduleWithAsset[] = []

  for (const s of schedules) {
    const d = s.next_service_date ?? '9999-12-31'
    if (d < today)      overdue.push(s)
    else if (d <= in7)  thisWeek.push(s)
    else if (d <= in30) thisMonth.push(s)
    else                later.push(s)
  }

  const groups: Group[] = []
  if (overdue.length)    groups.push({ label: labels.overdue,    color: '#E74C3C', items: overdue })
  if (thisWeek.length)   groups.push({ label: labels.thisWeek,   color: '#a855f7', items: thisWeek })
  if (thisMonth.length)  groups.push({ label: labels.next30Days, color: '#0099cc', items: thisMonth })
  if (later.length)      groups.push({ label: labels.later,      color: '#96aed2', items: later })
  return groups
}

export function WartungTaskList({ schedules }: { schedules: ScheduleWithAsset[] }) {
  const t = useTranslations()
  const router = useRouter()
  const today = new Date().toISOString().slice(0, 10)
  const in7   = new Date(Date.now() + 7  * 86400000).toISOString().slice(0, 10)
  const in30  = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)

  function daysLabel(dateStr: string): string {
    const diff = Math.ceil((new Date(dateStr.slice(0, 10) + 'T00:00:00').getTime() - new Date(today + 'T00:00:00').getTime()) / 86400000)
    if (diff === 0)  return t('wartung.urgency.today')
    if (diff === 1)  return t('wartung.urgency.tomorrow')
    if (diff === -1) return t('wartung.urgency.yesterday')
    if (diff < 0)   return t('wartung.urgency.overdueDays', { days: Math.abs(diff) })
    return t('wartung.urgency.inDays', { days: diff })
  }

  const groupLabels = {
    overdue:    t('wartung.groups.overdue'),
    thisWeek:   t('wartung.groups.thisWeek'),
    next30Days: t('wartung.groups.next30Days'),
    later:      t('wartung.groups.later'),
  }

  const groups = buildGroups(schedules, today, in7, in30, groupLabels)

  if (schedules.length === 0) {
    return (
      <div style={{ background: 'white', borderRadius: 16, padding: '40px 20px', border: '1px solid #c8d4e8', textAlign: 'center' }}>
        <CheckCircle2 size={32} color="#c8d4e8" style={{ marginBottom: 10 }} />
        <p style={{ fontWeight: 700, color: '#000', fontSize: 15, margin: '0 0 6px' }}>{t('wartung.noSchedules')}</p>
        <p style={{ color: '#666', fontSize: 13, margin: 0 }}>{t('wartung.noSchedulesDesc')}</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {groups.map(group => (
        <div key={group.label}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: group.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: group.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {group.label}
            </span>
            <span style={{ fontSize: 12, color: '#c8d4e8', fontWeight: 600 }}>· {group.items.length}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {group.items.map(s => (
              <div key={s.id} style={{
                background: 'white', borderRadius: 14,
                border: `1px solid ${group.color}33`,
                borderLeft: `4px solid ${group.color}`,
                padding: '12px 14px',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => router.push(`/assets/${s.asset_id}/service`)}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#000', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.assets?.title ?? '–'}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: '#666' }}>{s.name}</span>
                    {s.assets?.category && (
                      <span style={{ fontSize: 11, color: '#96aed2', background: '#f4f6f9', padding: '1px 7px', borderRadius: 8 }}>
                        {s.assets.category}
                      </span>
                    )}
                    {s.next_service_date && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: group.color, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <CalendarClock size={11} />
                        {daysLabel(s.next_service_date)}
                      </span>
                    )}
                  </div>
                </div>

                <button type="button" onClick={() => router.push(`/assets/${s.asset_id}/service`)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c8d4e8', padding: 4, display: 'flex', flexShrink: 0 }}>
                  <ChevronRight size={16} />
                </button>

                <button type="button" onClick={() => router.push(`/assets/${s.asset_id}/service/neu?schedule_id=${s.id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 20, flexShrink: 0, background: '#003366', border: 'none', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  <CheckCircle2 size={14} />
                  {t('wartung.complete')}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
