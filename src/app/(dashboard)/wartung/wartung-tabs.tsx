'use client'

import { useState } from 'react'
import { WartungTaskList } from './wartung-task-list'
import { WartungTimeline, type ScheduleWithAsset } from './wartung-timeline'
import { CheckCircle2, BarChart2 } from 'lucide-react'

export function WartungTabs({ schedules }: { schedules: ScheduleWithAsset[] }) {
  const [tab, setTab] = useState<'tasks' | 'gantt'>('tasks')

  return (
    <div>
      {/* Tab-Leiste */}
      <div style={{
        display: 'flex', padding: '0 20px',
        borderBottom: '2px solid #e8eef8',
        marginBottom: 20, gap: 4,
      }}>
        <TabButton
          active={tab === 'tasks'}
          onClick={() => setTab('tasks')}
          icon={<CheckCircle2 size={14} />}
          label="Aufgaben"
        />
        <TabButton
          active={tab === 'gantt'}
          onClick={() => setTab('gantt')}
          icon={<BarChart2 size={14} />}
          label="Gantt"
        />
      </div>

      {/* Inhalt */}
      <div style={{ padding: '0 20px' }}>
        {tab === 'tasks' && <WartungTaskList schedules={schedules} />}
        {tab === 'gantt' && <WartungTimeline schedules={schedules} />}
      </div>
    </div>
  )
}

function TabButton({ active, onClick, icon, label }: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '10px 16px',
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: 14, fontWeight: 700,
        color: active ? '#003366' : '#96aed2',
        borderBottom: active ? '2px solid #003366' : '2px solid transparent',
        marginBottom: -2,
        transition: 'color 0.15s',
      }}
    >
      {icon}{label}
    </button>
  )
}
