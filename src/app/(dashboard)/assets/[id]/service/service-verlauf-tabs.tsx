'use client'

import { useState } from 'react'
import { List, BarChart2 } from 'lucide-react'
import { ServiceTimeline } from './service-timeline'
import { WartungTimeline, type ScheduleWithAsset } from '@/app/(dashboard)/wartung/wartung-timeline'

type Event = {
  id: string
  event_type: string
  title: string
  event_date: string
  description: string | null
  performed_by: string | null
  external_company: string | null
  cost_eur: number | null
  notes: string | null
  attachments: string[] | null
  next_service_date: string | null
}

type Props = {
  events: Event[]
  assetId: string
  schedules: ScheduleWithAsset[]
}

export function ServiceVerlaufTabs({ events, assetId, schedules }: Props) {
  const [tab, setTab] = useState<'list' | 'gantt'>('list')

  return (
    <div>
      {/* Tab-Switcher */}
      <div style={{
        display: 'inline-flex', background: '#f4f6f9', borderRadius: 10,
        padding: '3px', marginBottom: 14, gap: 2,
      }}>
        {([
          { key: 'list', label: 'Liste', icon: <List size={13} /> },
          { key: 'gantt', label: 'Gantt', icon: <BarChart2 size={13} /> },
        ] as const).map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 700,
              background: tab === t.key ? 'white' : 'transparent',
              color: tab === t.key ? '#003366' : '#96aed2',
              boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Inhalte */}
      {tab === 'list' && (
        <ServiceTimeline events={events} assetId={assetId} />
      )}

      {tab === 'gantt' && schedules.length > 0 && (
        <WartungTimeline schedules={schedules} showFilters={false} />
      )}

      {tab === 'gantt' && schedules.length === 0 && (
        <div style={{
          background: 'white', borderRadius: 14, padding: '32px 20px',
          border: '1px dashed #c8d4e8', textAlign: 'center',
        }}>
          <BarChart2 size={28} color="#c8d4e8" style={{ marginBottom: 10 }} />
          <p style={{ fontSize: 13, color: '#96aed2', margin: 0, fontFamily: 'Arial, sans-serif' }}>
            Keine aktiven Wartungsintervalle für den Gantt-Chart.
          </p>
        </div>
      )}
    </div>
  )
}
