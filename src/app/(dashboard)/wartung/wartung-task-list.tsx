'use client'

import { useRouter } from 'next/navigation'
import { CheckCircle2, ChevronRight, CalendarClock } from 'lucide-react'
import type { ScheduleWithAsset } from './wartung-timeline'

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

export function WartungTaskList({ schedules }: { schedules: ScheduleWithAsset[] }) {
  const router = useRouter()
  const today = new Date().toISOString().slice(0, 10)
  const in7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)

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
                      <span style={{ fontSize: 11, fontWeight: 700, color: group.color, display: 'flex', alignItems: 'center', gap: 3 }}>
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

                {/* Erledigt → öffnet vollen Serviceeintrag mit vorausgefüllten Daten */}
                <button
                  type="button"
                  onClick={() => router.push(
                    `/assets/${s.asset_id}/service/neu?schedule_id=${s.id}`
                  )}
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
  )
}
