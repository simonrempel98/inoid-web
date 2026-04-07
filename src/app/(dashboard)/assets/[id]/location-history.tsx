'use client'

import { useState } from 'react'
import { MapPin, ChevronDown, ChevronUp, MoveRight } from 'lucide-react'

type HistoryEntry = {
  id: string
  location: string | null
  changed_at: string
}

export function LocationHistory({ current, history }: {
  current: string
  history: HistoryEntry[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{
      background: 'white', borderRadius: 14,
      border: open ? '1px solid #0099cc' : '1px solid #e8eef6',
      overflow: 'hidden', transition: 'border-color 0.15s',
    }}>
      {/* Aktuelle Zeile – klickbar */}
      <div
        onClick={() => history.length > 0 && setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px',
          cursor: history.length > 0 ? 'pointer' : 'default',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: '#f0f4ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <MapPin size={14} color="#003366" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: '#96aed2', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Standort</p>
            <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 600, color: '#000' }}>{current}</p>
          </div>
        </div>
        {history.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: '#96aed2' }}>{history.length} Änderung{history.length !== 1 ? 'en' : ''}</span>
            {open ? <ChevronUp size={14} color="#96aed2" /> : <ChevronDown size={14} color="#96aed2" />}
          </div>
        )}
      </div>

      {/* Verlauf */}
      {open && (
        <div style={{ borderTop: '1px solid #e8eef6' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#96aed2', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0, padding: '10px 16px 6px' }}>
            Standortverlauf
          </p>
          {/* Aktuell */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 16px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#27AE60', flexShrink: 0, marginLeft: 3 }} />
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#000' }}>{current}</p>
              <p style={{ margin: 0, fontSize: 11, color: '#96aed2' }}>Aktuell</p>
            </div>
          </div>
          {/* Historie – älteste zuerst (reversed) */}
          {[...history].map((entry, i) => (
            <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 16px' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#c8d4e8', flexShrink: 0, marginLeft: 3 }} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 13, color: '#555' }}>{entry.location ?? '–'}</p>
                <p style={{ margin: 0, fontSize: 11, color: '#96aed2' }}>
                  bis {new Date(entry.changed_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </p>
              </div>
              <MoveRight size={12} color="#c8d4e8" />
            </div>
          ))}
          <div style={{ height: 8 }} />
        </div>
      )}
    </div>
  )
}
