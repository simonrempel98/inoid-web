'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createTeamWithMembers } from './actions'
import { Plus, Trash2, Users, MapPin, Check, AlertCircle, Loader } from 'lucide-react'

type Division   = { id: string; name: string }
type Department = { id: string; name: string; division_id: string }
type Location   = { id: string; name: string }
type Hall       = { id: string; name: string; location_id: string; locations: { name: string } | null }
type Area       = { id: string; name: string; hall_id: string; halls: { name: string } | null }
type Role       = { id: string; name: string }

type MemberRow = { id: string; first_name: string; last_name: string; email: string; role_id: string }

const emptyRow = (defaultRoleId = ''): MemberRow => ({
  id: Math.random().toString(36).slice(2),
  first_name: '', last_name: '', email: '', role_id: defaultRoleId,
})

export function CreateTeamForm({ divisions, departments, locations, halls, areas, roles }: {
  divisions: Division[]; departments: Department[]
  locations: Location[]; halls: Hall[]; areas: Area[]; roles: Role[]
}) {
  const router = useRouter()
  const defaultRoleId = roles[0]?.id ?? ''

  const [teamName, setTeamName] = useState('')
  const [divisionId, setDivisionId] = useState(divisions[0]?.id ?? '')
  const [departmentId, setDepartmentId] = useState('')
  const [orgRef, setOrgRef] = useState('')
  const [members, setMembers] = useState<MemberRow[]>([emptyRow(defaultRoleId)])
  const [submitting, setSubmitting] = useState(false)
  const [results, setResults] = useState<{ email: string; success: boolean; error?: string }[] | null>(null)
  const [teamId, setTeamId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const filteredDepts = departments.filter(d => !divisionId || d.division_id === divisionId)

  const updateRow = (id: string, field: keyof MemberRow, value: string) =>
    setMembers(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))

  const addRow = () => setMembers(prev => [...prev, emptyRow(defaultRoleId)])
  const removeRow = (id: string) => setMembers(prev => prev.filter(r => r.id !== id))

  const filledMembers = members.filter(r => r.email.trim())

  async function handleSubmit() {
    if (!teamName.trim()) { setFormError('Bitte einen Teamnamen eingeben.'); return }
    if (!departmentId) { setFormError('Bitte eine Abteilung auswählen.'); return }
    setFormError(null)
    setSubmitting(true)

    const [type, id] = orgRef ? orgRef.split(':') : ['', '']

    const result = await createTeamWithMembers({
      name: teamName.trim(),
      department_id: departmentId,
      location_id: type === 'location' ? id : undefined,
      hall_id: type === 'hall' ? id : undefined,
      area_id: type === 'area' ? id : undefined,
      members: filledMembers.map(r => ({
        first_name: r.first_name,
        last_name: r.last_name,
        email: r.email,
        role_id: r.role_id || defaultRoleId,
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
            {ok.length > 0 ? `${ok.length} Einladung${ok.length > 1 ? 'en' : ''} erfolgreich versendet.` : 'Team wurde angelegt.'}
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

          <div style={{ height: 1, background: '#c8d4e8' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            <div style={{ padding: '13px 16px', borderRight: '1px solid #c8d4e8' }}>
              <label style={{ display: 'block', fontSize: 11, color: '#96aed2', marginBottom: 4, fontWeight: 700 }}>BEREICH *</label>
              <select value={divisionId} onChange={e => { setDivisionId(e.target.value); setDepartmentId('') }}
                style={{ width: '100%', outline: 'none', border: 'none', fontSize: 14, fontFamily: 'Arial, sans-serif', background: 'transparent', color: '#000' }}>
                <option value="">– Auswählen –</option>
                {divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div style={{ padding: '13px 16px' }}>
              <label style={{ display: 'block', fontSize: 11, color: '#96aed2', marginBottom: 4, fontWeight: 700 }}>ABTEILUNG *</label>
              <select value={departmentId} onChange={e => setDepartmentId(e.target.value)}
                style={{ width: '100%', outline: 'none', border: 'none', fontSize: 14, fontFamily: 'Arial, sans-serif', background: 'transparent', color: filteredDepts.length === 0 ? '#aaa' : '#000' }}>
                <option value="">– Auswählen –</option>
                {filteredDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ height: 1, background: '#c8d4e8' }} />
          <div style={{ padding: '13px 16px' }}>
            <label style={{ display: 'block', fontSize: 11, color: '#96aed2', marginBottom: 4, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
              <MapPin size={11} /> STANDORT-ZUORDNUNG (OPTIONAL)
            </label>
            <select value={orgRef} onChange={e => setOrgRef(e.target.value)}
              style={{ width: '100%', outline: 'none', border: 'none', fontSize: 14, fontFamily: 'Arial, sans-serif', background: 'transparent', color: '#000' }}>
              <option value="">– Keine Zuordnung –</option>
              {locations.length > 0 && (
                <optgroup label="Standorte">
                  {locations.map(l => <option key={l.id} value={`location:${l.id}`}>{l.name}</option>)}
                </optgroup>
              )}
              {halls.length > 0 && (
                <optgroup label="Hallen">
                  {halls.map(h => <option key={h.id} value={`hall:${h.id}`}>{h.locations?.name ? `${h.locations.name} › ` : ''}{h.name}</option>)}
                </optgroup>
              )}
              {areas.length > 0 && (
                <optgroup label="Bereiche">
                  {areas.map(a => <option key={a.id} value={`area:${a.id}`}>{a.halls?.name ? `${a.halls.name} › ` : ''}{a.name}</option>)}
                </optgroup>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Mitglieder-Tabelle */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px 2px' }}>
          Mitglieder einladen
        </p>
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #c8d4e8', overflow: 'hidden' }}>
          {/* Tabellen-Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 1fr 36px', gap: 0, padding: '8px 14px', borderBottom: '1px solid #c8d4e8', background: '#f8fafd' }}>
            {['Vorname', 'Nachname', 'E-Mail', 'Rolle', ''].map((h, i) => (
              <span key={i} style={{ fontSize: 10, fontWeight: 700, color: '#96aed2', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
            ))}
          </div>

          {/* Zeilen */}
          {members.map((row, idx) => (
            <div key={row.id}>
              {idx > 0 && <div style={{ height: 1, background: '#e8eef6' }} />}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 1fr 36px', alignItems: 'center', padding: '0 14px' }}>
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
            {filledMembers.length} Einladung{filledMembers.length > 1 ? 'en' : ''} werden per E-Mail versendet.
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
      <button onClick={handleSubmit} disabled={submitting || !teamName.trim() || !departmentId}
        style={{
          width: '100%', background: '#003366', color: 'white', border: 'none', borderRadius: 50,
          padding: '15px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          opacity: submitting || !teamName.trim() || !departmentId ? 0.5 : 1,
          fontFamily: 'Arial, sans-serif',
        }}>
        {submitting ? <><Loader size={16} /> Wird erstellt…</> : <><Users size={16} /> Team erstellen & Einladungen senden</>}
      </button>
    </div>
  )
}
