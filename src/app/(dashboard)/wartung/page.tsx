import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { WartungTimeline, type ScheduleWithAsset } from './wartung-timeline'
import { WartungTaskList } from './wartung-task-list'
import { WartungTabs } from './wartung-tabs'
import { Wrench } from 'lucide-react'

export default async function WartungPage() {
  const supabase = await createClient()

  const { data: schedules } = await supabase
    .from('maintenance_schedules')
    .select('*, assets(id, title, category, status)')
    .eq('is_active', true)
    .order('next_service_date', { ascending: true })

  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()
  const { count: doneThisMonth } = await supabase
    .from('asset_lifecycle_events')
    .select('*', { count: 'exact', head: true })
    .gte('event_date', startOfMonth)

  const todayStr = today.toISOString().slice(0, 10)
  const in7Str = new Date(today.getTime() + 7 * 86400000).toISOString().slice(0, 10)
  const in30Str = new Date(today.getTime() + 30 * 86400000).toISOString().slice(0, 10)

  const overdueCount   = schedules?.filter(s => s.next_service_date && s.next_service_date < todayStr).length ?? 0
  const thisWeekCount  = schedules?.filter(s => s.next_service_date && s.next_service_date >= todayStr && s.next_service_date <= in7Str).length ?? 0
  const thisMonthCount = schedules?.filter(s => s.next_service_date && s.next_service_date > in7Str && s.next_service_date <= in30Str).length ?? 0

  const stats = [
    { label: 'Überfällig',       count: overdueCount,        color: '#E74C3C' },
    { label: 'Diese Woche',      count: thisWeekCount,       color: '#F39C12' },
    { label: 'Nächste 30 Tage',  count: thisMonthCount,      color: '#0099cc' },
    { label: 'Erledigt (Monat)', count: doneThisMonth ?? 0,  color: '#27AE60' },
  ]

  if (!schedules || schedules.length === 0) {
    return (
      <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#000', margin: '0 0 20px' }}>Wartung & Service</h1>
        <div style={{ background: 'white', borderRadius: 16, padding: 40, border: '1px solid #c8d4e8', textAlign: 'center' }}>
          <div style={{ marginBottom: 12, color: '#003366' }}><Wrench size={40} /></div>
          <p style={{ fontWeight: 700, color: '#000', fontSize: 15, margin: '0 0 8px' }}>Keine Wartungsintervalle</p>
          <p style={{ color: '#666', fontSize: 13, margin: '0 0 20px', lineHeight: 1.5 }}>
            Lege Wartungsintervalle im Serviceheft eines Assets an.
          </p>
          <Link href="/assets" style={{ backgroundColor: '#003366', color: 'white', padding: '12px 24px', borderRadius: 50, textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
            Zu den Assets
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', paddingBottom: 40 }}>

      {/* Header */}
      <div style={{ padding: '20px 20px 16px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#000', margin: '0 0 2px' }}>Wartung & Service</h1>
        <p style={{ fontSize: 13, color: '#666', margin: 0 }}>
          {schedules.length} aktive Intervalle · {overdueCount > 0 ? `${overdueCount} überfällig` : 'alles im Plan'}
        </p>
      </div>

      {/* Stats */}
      <div style={{ padding: '0 20px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {stats.map(s => (
          <div key={s.label} style={{
            background: 'white', borderRadius: 14, padding: '14px 16px',
            border: '1px solid #c8d4e8', borderLeft: `4px solid ${s.color}`,
          }}>
            <p style={{ fontSize: 26, fontWeight: 700, color: s.color, margin: '0 0 2px' }}>{s.count}</p>
            <p style={{ fontSize: 11, color: '#666', margin: 0, fontWeight: 600 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tab-Ansichten */}
      <WartungTabs
        schedules={schedules as ScheduleWithAsset[]}
      />
    </div>
  )
}
