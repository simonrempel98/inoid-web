'use client'

import { useState, useRef, useEffect } from 'react'
import { MapPin, ChevronRight, ChevronDown, Check, X } from 'lucide-react'

export type OrgLocation = { id: string; name: string }
export type OrgHall     = { id: string; name: string; location_id: string; locations: { name: string } | null }
export type OrgArea     = { id: string; name: string; hall_id: string;     halls:     { name: string } | null }

export function getOrgRefLabel(
  orgRef: string,
  locations: OrgLocation[],
  halls: OrgHall[],
  areas: OrgArea[],
): string {
  if (!orgRef) return ''
  const [type, id] = orgRef.split(':')
  if (type === 'location') {
    return locations.find(l => l.id === id)?.name ?? ''
  }
  if (type === 'hall') {
    const h = halls.find(h => h.id === id)
    if (!h) return ''
    return h.locations?.name ? `${h.locations.name} › ${h.name}` : h.name
  }
  if (type === 'area') {
    const a = areas.find(a => a.id === id)
    if (!a) return ''
    const h = halls.find(h => h.id === a.hall_id)
    if (h?.locations?.name) return `${h.locations.name} › ${h.name} › ${a.name}`
    if (h) return `${h.name} › ${a.name}`
    return a.name
  }
  return ''
}

export function OrgTreePicker({ locations, halls, areas, value, onChange, inputStyle }: {
  locations: OrgLocation[]
  halls: OrgHall[]
  areas: OrgArea[]
  value: string
  onChange: (orgRef: string) => void
  inputStyle?: React.CSSProperties
}) {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const toggle = (key: string) => setExpanded(prev => {
    const next = new Set(prev)
    if (next.has(key)) next.delete(key); else next.add(key)
    return next
  })

  const select = (ref: string) => {
    onChange(value === ref ? '' : ref)
    setOpen(false)
  }

  const hallsByLocation: Record<string, OrgHall[]> = {}
  const unparentedHalls: OrgHall[] = []
  for (const h of halls) {
    if (h.location_id) {
      if (!hallsByLocation[h.location_id]) hallsByLocation[h.location_id] = []
      hallsByLocation[h.location_id].push(h)
    } else {
      unparentedHalls.push(h)
    }
  }

  const areasByHall: Record<string, OrgArea[]> = {}
  for (const a of areas) {
    if (!areasByHall[a.hall_id]) areasByHall[a.hall_id] = []
    areasByHall[a.hall_id].push(a)
  }

  const nodeStyle = (ref: string): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 7,
    padding: '7px 10px', borderRadius: 8, cursor: 'pointer',
    background: value === ref ? '#e6f0ff' : 'transparent',
    color: value === ref ? '#003366' : '#222',
    fontWeight: value === ref ? 700 : 400,
    userSelect: 'none',
  })

  const renderAreas = (hallId: string, depth: number) =>
    (areasByHall[hallId] ?? []).map(a => {
      const ref = `area:${a.id}`
      return (
        <div key={a.id} style={{ paddingLeft: depth * 16 }}>
          <div style={nodeStyle(ref)} onClick={() => select(ref)}>
            <span style={{ width: 14, display: 'inline-block' }} />
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke={value === ref ? '#003366' : '#96aed2'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 22 22 7 12 2"/>
            </svg>
            <span style={{ fontSize: 13 }}>{a.name}</span>
            {value === ref && <Check size={12} color="#003366" style={{ marginLeft: 'auto' }} />}
          </div>
        </div>
      )
    })

  const renderHalls = (hallList: OrgHall[], depth: number) =>
    hallList.map(h => {
      const ref = `hall:${h.id}`
      const key = `hall-${h.id}`
      const isOpen = expanded.has(key)
      const hasAreas = (areasByHall[h.id] ?? []).length > 0
      return (
        <div key={h.id} style={{ paddingLeft: depth * 16 }}>
          <div style={nodeStyle(ref)} onClick={() => select(ref)}>
            {hasAreas
              ? <span onClick={e => { e.stopPropagation(); toggle(key) }} style={{ display: 'flex', alignItems: 'center', color: '#96aed2' }}>
                  {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </span>
              : <span style={{ width: 14 }} />
            }
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke={value === ref ? '#003366' : '#96aed2'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span style={{ fontSize: 13 }}>{h.name}</span>
            {value === ref && <Check size={12} color="#003366" style={{ marginLeft: 'auto' }} />}
          </div>
          {isOpen && renderAreas(h.id, 1)}
        </div>
      )
    })

  const label = getOrgRefLabel(value, locations, halls, areas)

  const tree = (
    <div style={{ padding: 6 }}>
      {locations.map(l => {
        const ref = `location:${l.id}`
        const key = `loc-${l.id}`
        const isOpen = expanded.has(key)
        const locHalls = hallsByLocation[l.id] ?? []
        return (
          <div key={l.id}>
            <div style={nodeStyle(ref)} onClick={() => select(ref)}>
              {locHalls.length > 0
                ? <span onClick={e => { e.stopPropagation(); toggle(key) }} style={{ display: 'flex', alignItems: 'center', color: '#96aed2' }}>
                    {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </span>
                : <span style={{ width: 14 }} />
              }
              <MapPin size={14} color={value === ref ? '#003366' : '#96aed2'} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>{l.name}</span>
              {value === ref && <Check size={12} color="#003366" style={{ marginLeft: 'auto' }} />}
            </div>
            {isOpen && renderHalls(locHalls, 1)}
          </div>
        )
      })}
      {unparentedHalls.length > 0 && renderHalls(unparentedHalls, 0)}
    </div>
  )

  if (locations.length === 0 && halls.length === 0 && areas.length === 0) {
    return (
      <p style={{ fontSize: 12, color: '#96aed2', margin: 0, fontStyle: 'italic' }}>
        Noch keine Standorte angelegt.
      </p>
    )
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Trigger */}
      <div onClick={() => setOpen(o => !o)} style={{
        ...inputStyle,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        cursor: 'pointer', userSelect: 'none',
        color: label ? '#000' : '#aaa',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {label && <MapPin size={13} color="#96aed2" />}
          {label || '– Kein Standort –'}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {value && (
            <span onClick={e => { e.stopPropagation(); onChange('') }}
              style={{ display: 'flex', alignItems: 'center', color: '#96aed2' }}>
              <X size={13} />
            </span>
          )}
          <ChevronDown size={14} color="#96aed2" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
        </div>
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: 'var(--ds-surface)', border: '1px solid var(--ds-border)', borderRadius: 10,
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          maxHeight: 220, overflowY: 'auto',
          marginTop: 4,
        }}>
          {tree}
        </div>
      )}
    </div>
  )
}
