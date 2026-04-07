'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createTeamWithMembers } from './actions'
import { Plus, Trash2, Users, MapPin, Check, AlertCircle, Loader, ChevronRight, ChevronDown, X } from 'lucide-react'

type Location   = { id: string; name: string }
type Hall       = { id: string; name: string; location_id: string; locations: { name: string } | null }
type Area       = { id: string; name: string; hall_id: string; halls: { name: string } | null }
type Role       = { id: string; name: string }

type MemberRow = { id: string; first_name: string; last_name: string; email: string; role_id: string; password: string }

const emptyRow = (defaultRoleId = ''): MemberRow => ({
  id: Math.random().toString(36).slice(2),
  first_name: '', last_name: '', email: '', role_id: defaultRoleId, password: '',
})

function getOrgRefLabel(
  orgRef: string,
  locations: Location[],
  halls: Hall[],
  areas: Area[],
): string {
  if (!orgRef) return ''
  const [type, id] = orgRef.split(':')
  if (type === 'location') return locations.find(l => l.id === id)?.name ?? ''
  if (type === 'hall') {
    const h = halls.find(h => h.id === id)
    if (!h) return ''
    return h.locations?.name ? `${h.locations.name} › ${h.name}` : h.name
  }
  if (type === 'area') {
    const a = areas.find(a => a.id === id)
    if (!a) return ''
    const h = halls.find(h => h.id === a.hall_id)
    const loc = h?.locations?.name
    if (loc && h) return `${loc} › ${h.name} › ${a.name}`
    if (h) return `${h.name} › ${a.name}`
    return a.name
  }
  return ''
}

function OrgTreePicker({ locations, halls, areas, value, onChange }: {
  locations: Location[]
  halls: Hall[]
  areas: Area[]
  value: string
  onChange: (v: string) => void
}) {
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const s = new Set<string>()
    locations.forEach(l => s.add(`loc-${l.id}`))
    return s
  })

  const toggle = (key: string) => setExpanded(prev => {
    const next = new Set(prev)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    return next
  })

  const select = (ref: string) => onChange(value === ref ? '' : ref)

  const hallsByLocation: Record<string, Hall[]> = {}
  const unparentedHalls: Hall[] = []
  for (const h of halls) {
    if (h.location_id) {
      if (!hallsByLocation[h.location_id]) hallsByLocation[h.location_id] = []
      hallsByLocation[h.location_id].push(h)
    } else {
      unparentedHalls.push(h)
    }
  }

  const areasByHall: Record<string, Area[]> = {}
  for (const a of areas) {
    if (!areasByHall[a.hall_id]) areasByHall[a.hall_id] = []
    areasByHall[a.hall_id].push(a)
  }

  const nodeStyle = (ref: string): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 7,
    padding: '7px 10px',
    borderRadius: 8,
    cursor: 'pointer',
    background: value === ref ? '#e6f0ff' : 'transparent',
    color: value === ref ? '#003366' : '#222',
    fontWeight: value === ref ? 700 : 400,
    userSelect: 'none',
  })

  const renderAreas = (hallId: string, depth: number) => {
    const list = areasByHall[hallId] ?? []
    if (list.length === 0) return null
    return list.map(a => {
      const ref = `area:${a.id}`
      return (
        <div key={a.id} style={{ paddingLeft: depth * 16 }}>
          <div style={nodeStyle(ref)} onClick={() => select(ref)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke={value === ref ? '#003366' : '#96aed2'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 22 22 7 12 2"/>
            </svg>
            <span style={{ fontSize: 13 }}>{a.name}</span>
            {value === ref && <Check size={12} color="#003366" style={{ marginLeft: 'auto' }} />}
          </div>
        </div>
      )
    })
  }

  const renderHalls = (hallList: Hall[], depth: number) => {
    return hallList.map(h => {
      const ref = `hall:${h.id}`
      const key = `hall-${h.id}`
      const isOpen = expanded.has(key)
      const hasAreas = (areasByHall[h.id] ?? []).length > 0
      return (
        <div key={h.id} style={{ paddingLeft: depth * 16 }}>
          <div style={nodeStyle(ref)} onClick={() => select(ref)}>
            {hasAreas ? (
              <span onClick={e => { e.stopPropagation(); toggle(key) }} style={{ display: 'flex', alignItems: 'center', color: '#96aed2' }}>
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
            ) : <span style={{ width: 14 }} />}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
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
  }

  if (locations.length === 0 && halls.length === 0 && areas.length === 0) {
    return (
      <p style={{ fontSize: 13, color: '#96aed2', margin: '4px 0 0', fontStyle: 'italic' }}>
        Noch keine Standorte oder Bereiche angelegt.
      </p>
    )
  }

  return (
    <div style={{
      border: '1px solid #c8d4e8', borderRadius: 10, background: '#f8fafd',
      maxHeight: 220, overflowY: 'auto', padding: '6px',
    }}>
      {locations.map(l => {
        const ref = `location:${l.id}`
        const key = `loc-${l.id}`
        const isOpen = expanded.has(key)
        const locHalls = hallsByLocation[l.id] ?? []
        const hasChildren = locHalls.length > 0
        return (
          <div key={l.id}>
            <div style={nodeStyle(ref)} onClick={() => select(ref)}>
              {hasChildren ? (
                <span onClick={e => { e.stopPropagation(); toggle(key) }} style={{ display: 'flex', alignItems: 'center', color: '#96aed2' }}>
                  {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </span>
              ) : <span style={{ width: 14 }} />}
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
}

export function CreateTeamForm({ locations, halls, areas, roles }: {
  locations: Location[]; halls: Hall[]; areas: Area[]; roles: Role[]
}) {
  const defaultRoleId = roles[0]?.id ?? ''

  const [teamName, setTeamName] = useState('')
  const [orgRef, setOrgRef] = useState('')
  const [members, setMembers] = useState<MemberRow[]>([emptyRow(defaultRoleId)])
  const [submitting, setSubmitting] = useState(false)
  const [results, setResults] = useState<{ email: string; success: boolean; error?: string }[] | null>(null)
  const [teamId, setTeamId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const updateRow = (id: string, field: keyof MemberRow, value: string) =>
    setMembers(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))

  const addRow = () => setMembers(prev => [...prev, emptyRow(defaultRoleId)])
  const removeRow = (id: string) => setMembers(prev => prev.filter(r => r.id !== id))

  const filledMembers = members.filter(r => r.email.trim() && r.password)

  async function handleSubmit() {
    if (!teamName.trim()) { setFormError('Bitte einen Teamnamen eingeben.'); return }
    setFormError(null)
    setSubmitting(true)

    const [type, id] = orgRef ? orgRef.split(':') : ['', '']

    const result = await createTeamWithMembers({
      name: teamName.trim(),
      location_id: type === 'location' ? id : undefined,
      hall_id: type === 'hall' ? id : undefined,
      area_id: type === 'area' ? id : undefined,
      members: filledMembers.map(r => ({
        first_name: r.first_name,
        last_name: r.last_name,
        email: r.email,
        role_id: r.role_id || defaultRoleId,
        password: r.password,
      })),
    })

    setSubmitting(false)

    if (result.error) { setFormError(result.error); return }
    if (result.teamId) { setTeamId(result.teamId); setResults(result.results ?? []) }
  }

  // ── Erfolgsmeldung ──────────────────────────────────────────────
  if (results !== null) {
    const ok  = results.filter(r => r.success)
    const err = results.filter(r => !r.success)
    return (
      <div style={{ padding: '24px 16px', fontFamily: 'Arial, sans-serif', maxWidth: 560 }}>
        <div style={{ background: '#f0fff4', border: '1px solid #27AE60', borderRadius: 14, padding: '20px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Check size={20} color="#27AE60" />
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1a5c3a', margin: 0 }}>Team erstellt!</h2>
          </div>
          <p style={{ fontSize: 14, color: '#2d7a4f', margin: 0 }}>
            {ok.length > 0 ? `${ok.length} Benutzer${ok.length > 1 ? '' : ''} erfolgreich angelegt.` : 'Team wurde angelegt.'}
          </p>
        </div>

        {err.length > 0 && (
          <div style={{ background: '#fff5f5', border: '1px solid #E74C3C', borderRadius: 14, padding: '16px', marginBottom: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#E74C3C', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertCircle size={14} /> Fehler bei {err.length} Einladung{err.length > 1 ? 'en' : ''}:
            </p>
            {err.map(e => (
              <p key={e.email} style={{ fontSize: 12, color: '#c0392b', margin: '4px 0' }}>
                {e.email}: {e.error}
              </p>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <Link href={`/teams/team/${teamId}`} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            background: '#003366', color: 'white', borderRadius: 50, padding: '13px',
            textDecoration: 'none', fontSize: 14, fontWeight: 700,
          }}>
            <Users size={15} /> Team öffnen
          </Link>
          <Link href="/teams" style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'white', color: '#003366', borderRadius: 50, padding: '13px',
            border: '2px solid #003366', textDecoration: 'none', fontSize: 14, fontWeight: 700,
          }}>
            Zur Übersicht
          </Link>
        </div>
      </div>
    )
  }

  const orgRefLabel = getOrgRefLabel(orgRef, locations, halls, areas)

  // ── Formular ────────────────────────────────────────────────────
  return (
    <div style={{ padding: '24px 16px', fontFamily: 'Arial, sans-serif', maxWidth: 600 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <Link href="/teams" style={{ color: '#96aed2', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </Link>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#000', margin: 0 }}>Neues Team</h1>
      </div>

      {/* Team-Info */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px 2px' }}>Team-Informationen</p>
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #c8d4e8', overflow: 'hidden' }}>
          <div style={{ padding: '13px 16px' }}>
            <label style={{ display: 'block', fontSize: 11, color: '#96aed2', marginBottom: 4, fontWeight: 700 }}>TEAMNAME *</label>
            <input value={teamName} onChange={e => setTeamName(e.target.value)}
              placeholder="z.B. Instandhaltung Halle 2"
              style={{ width: '100%', outline: 'none', border: 'none', fontSize: 15, fontWeight: 600, fontFamily: 'Arial, sans-serif', background: 'transparent', color: '#000' }} />
          </div>

        </div>
      </div>

      {/* Standort-Zuordnung */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 8px 2px' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
            <MapPin size={11} color="#666" /> Standort-Zuordnung
            <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#aaa', fontSize: 11 }}>(optional)</span>
          </p>
          {orgRef && (
            <button onClick={() => setOrgRef('')} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: '#e6f0ff', border: 'none', borderRadius: 20,
              padding: '3px 10px', cursor: 'pointer', color: '#003366', fontSize: 12, fontWeight: 600,
            }}>
              <span>{orgRefLabel}</span>
              <X size={12} />
            </button>
          )}
        </div>
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #c8d4e8', padding: '12px 14px' }}>
          {!orgRef && (
            <p style={{ fontSize: 12, color: '#96aed2', margin: '0 0 10px', fontStyle: 'italic' }}>
              Kein Standort ausgewählt — Team wird ohne Zuordnung angelegt.
            </p>
          )}
          <OrgTreePicker
            locations={locations}
            halls={halls}
            areas={areas}
            value={orgRef}
            onChange={setOrgRef}
          />
        </div>
      </div>

      {/* Mitglieder-Tabelle */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px 2px' }}>
          Mitglieder einladen
        </p>
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #c8d4e8', overflow: 'hidden' }}>
          {/* Tabellen-Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 1fr 1fr 36px', gap: 0, padding: '8px 14px', borderBottom: '1px solid #c8d4e8', background: '#f8fafd' }}>
            {['Vorname', 'Nachname', 'E-Mail', 'Rolle', 'Passwort', ''].map((h, i) => (
              <span key={i} style={{ fontSize: 10, fontWeight: 700, color: '#96aed2', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
            ))}
          </div>

          {/* Zeilen */}
          {members.map((row, idx) => (
            <div key={row.id}>
              {idx > 0 && <div style={{ height: 1, background: '#e8eef6' }} />}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 1fr 1fr 36px', alignItems: 'center', padding: '0 14px' }}>
                <input value={row.first_name} onChange={e => updateRow(row.id, 'first_name', e.target.value)}
                  placeholder="Max"
                  style={{ outline: 'none', border: 'none', fontSize: 13, fontFamily: 'Arial, sans-serif', padding: '11px 8px 11px 0', background: 'transparent', width: '100%' }} />
                <input value={row.last_name} onChange={e => updateRow(row.id, 'last_name', e.target.value)}
                  placeholder="Muster"
                  style={{ outline: 'none', border: 'none', fontSize: 13, fontFamily: 'Arial, sans-serif', padding: '11px 8px', background: 'transparent', width: '100%' }} />
                <input type="email" value={row.email} onChange={e => updateRow(row.id, 'email', e.target.value)}
                  placeholder="max@firma.de"
                  style={{ outline: 'none', border: 'none', fontSize: 13, fontFamily: 'Arial, sans-serif', padding: '11px 8px', background: 'transparent', width: '100%' }} />
                <select value={row.role_id} onChange={e => updateRow(row.id, 'role_id', e.target.value)}
                  style={{ outline: 'none', border: 'none', fontSize: 12, fontFamily: 'Arial, sans-serif', padding: '11px 4px', background: 'transparent', color: '#000', width: '100%' }}>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <input value={row.password} onChange={e => updateRow(row.id, 'password', e.target.value)}
                  placeholder="Temp.-Passwort"
                  style={{ outline: 'none', border: 'none', fontSize: 13, fontFamily: 'Arial, sans-serif', padding: '11px 8px', background: 'transparent', width: '100%' }} />
                <button onClick={() => members.length > 1 && removeRow(row.id)} disabled={members.length <= 1}
                  style={{ background: 'none', border: 'none', cursor: members.length > 1 ? 'pointer' : 'default', color: '#c0ccda', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, opacity: members.length <= 1 ? 0.3 : 1 }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}

          {/* Zeile hinzufügen */}
          <div style={{ borderTop: '1px solid #e8eef6' }}>
            <button onClick={addRow}
              style={{ display: 'flex', alignItems: 'center', gap: 7, width: '100%', padding: '11px 14px', background: 'none', border: 'none', cursor: 'pointer', color: '#0099cc', fontSize: 13, fontFamily: 'Arial, sans-serif' }}>
              <Plus size={14} /> Zeile hinzufügen
            </button>
          </div>
        </div>
        {filledMembers.length > 0 && (
          <p style={{ fontSize: 12, color: '#96aed2', margin: '6px 0 0 2px' }}>
            {filledMembers.length} Benutzer werden direkt angelegt. Bitte Zugangsdaten weitergeben.
          </p>
        )}
      </div>

      {formError && (
        <div style={{ background: '#fff5f5', border: '1px solid #fcc', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={14} color="#E74C3C" />
          <span style={{ fontSize: 13, color: '#c0392b' }}>{formError}</span>
        </div>
      )}

      {/* Submit */}
      <button onClick={handleSubmit} disabled={submitting || !teamName.trim()}
        style={{
          width: '100%', background: '#003366', color: 'white', border: 'none', borderRadius: 50,
          padding: '15px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          opacity: submitting || !teamName.trim() ? 0.5 : 1,
          fontFamily: 'Arial, sans-serif',
        }}>
        {submitting ? <><Loader size={16} /> Wird erstellt…</> : <><Users size={16} /> Team erstellen & Einladungen senden</>}
      </button>
    </div>
  )
}
