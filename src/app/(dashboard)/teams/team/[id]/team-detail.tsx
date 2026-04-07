'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { updateMember, removeMember, resendInvite } from '../../actions'
import {
  Users, MapPin, Pencil, X, Check, Trash2,
  UserPlus, Mail, RefreshCw, KeyRound, ChevronDown, Loader
} from 'lucide-react'

type Team = {
  id: string; name: string
  area_id: string | null; hall_id: string | null; location_id: string | null
  departments: { name: string; divisions: { name: string } | null } | null
  areas: { id: string; name: string } | null
  halls: { id: string; name: string } | null
  locations: { id: string; name: string } | null
}
type Member = {
  id: string; email: string
  first_name: string | null; last_name: string | null
  invitation_accepted_at: string | null
  roles: { id: string; name: string } | null
}
type Location = { id: string; name: string }
type Hall     = { id: string; name: string; location_id: string; locations: { name: string } | null }
type Area     = { id: string; name: string; hall_id: string; halls: { name: string } | null }
type Role     = { id: string; name: string }

function encodeRef(team: Team) {
  if (team.area_id) return `area:${team.area_id}`
  if (team.hall_id) return `hall:${team.hall_id}`
  if (team.location_id) return `location:${team.location_id}`
  return ''
}
function orgRefLabel(team: Team) {
  if (team.areas) return team.areas.name
  if (team.halls) return team.halls.name
  if (team.locations) return team.locations.name
  return null
}
function displayName(m: Member) {
  const full = [m.first_name, m.last_name].filter(Boolean).join(' ')
  return full || m.email
}
function initials(m: Member) {
  if (m.first_name && m.last_name) return (m.first_name[0] + m.last_name[0]).toUpperCase()
  return m.email[0].toUpperCase()
}

export function TeamDetail({ team, members, locations, halls, areas, roles, organizationId }: {
  team: Team; members: Member[]
  locations: Location[]; halls: Hall[]; areas: Area[]; roles: Role[]
  organizationId: string
}) {
  const router = useRouter()

  // Team bearbeiten
  const [editingTeam, setEditingTeam] = useState(false)
  const [teamName, setTeamName] = useState(team.name)
  const [orgRef, setOrgRef] = useState(encodeRef(team))
  const [savingTeam, setSavingTeam] = useState(false)

  // Mitglied bearbeiten
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', role_id: '' })
  const [savingMember, setSavingMember] = useState(false)

  // Mitglied einladen
  const [showInvite, setShowInvite] = useState(false)
  const [inviteFirst, setInviteFirst] = useState('')
  const [inviteLast, setInviteLast] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRoleId, setInviteRoleId] = useState(roles[0]?.id ?? '')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null)
  const [resending, setResending] = useState<string | null>(null)

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.inoid.app'

  async function saveTeam() {
    setSavingTeam(true)
    const supabase = createClient()
    const [type, id] = orgRef ? orgRef.split(':') : ['', '']
    await supabase.from('teams').update({
      name: teamName,
      location_id: type === 'location' ? id : null,
      hall_id: type === 'hall' ? id : null,
      area_id: type === 'area' ? id : null,
    }).eq('id', team.id)
    setSavingTeam(false)
    setEditingTeam(false)
    router.refresh()
  }

  function startEditMember(m: Member) {
    setEditingMemberId(m.id)
    setEditForm({ first_name: m.first_name ?? '', last_name: m.last_name ?? '', role_id: m.roles?.id ?? '' })
  }

  async function saveMember() {
    if (!editingMemberId) return
    setSavingMember(true)
    await updateMember(editingMemberId, {
      first_name: editForm.first_name || undefined,
      last_name: editForm.last_name || undefined,
      role_id: editForm.role_id || undefined,
    })
    setSavingMember(false)
    setEditingMemberId(null)
    router.refresh()
  }

  async function handleRemove(memberId: string, name: string) {
    if (!confirm(`${name} aus dem Team entfernen?`)) return
    await removeMember(memberId)
    router.refresh()
  }

  async function handleResend(memberId: string) {
    setResending(memberId)
    await resendInvite(memberId)
    setResending(null)
    router.refresh()
  }

  async function handleInvite() {
    if (!inviteEmail.trim()) return
    setInviting(true)
    setInviteError(null)
    setInviteSuccess(null)

    const supabase = createClient()
    const token = Array.from({ length: 32 }, () => 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'[Math.floor(Math.random() * 55)]).join('')
    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()

    const { data: existing } = await supabase
      .from('organization_members')
      .select('id, invitation_accepted_at')
      .eq('organization_id', organizationId)
      .eq('email', inviteEmail.trim())
      .single()

    if (existing?.invitation_accepted_at) {
      await supabase.from('organization_members').update({ team_id: team.id }).eq('id', existing.id)
      setInviteSuccess(`${inviteEmail} wurde dem Team hinzugefügt.`)
    } else if (existing) {
      await supabase.from('organization_members').update({
        team_id: team.id, invitation_token: token, invitation_expires_at: expiresAt,
        first_name: inviteFirst || null, last_name: inviteLast || null,
      }).eq('id', existing.id)
      setInviteSuccess(`Neue Einladung für ${inviteEmail} erstellt.`)
    } else {
      const roleId = inviteRoleId || roles[0]?.id
      if (!roleId) { setInviteError('Keine Rolle vorhanden.'); setInviting(false); return }
      const { error } = await supabase.from('organization_members').insert({
        organization_id: organizationId,
        email: inviteEmail.trim(),
        role_id: roleId,
        team_id: team.id,
        invitation_token: token,
        invitation_expires_at: expiresAt,
        first_name: inviteFirst || null,
        last_name: inviteLast || null,
      })
      if (error) { setInviteError(error.message); setInviting(false); return }
      setInviteSuccess(`Einladung an ${inviteEmail} erstellt. Link: ${origin}/invite/${token}`)
    }

    setInviteFirst(''); setInviteLast(''); setInviteEmail('')
    setInviting(false)
    setShowInvite(false)
    router.refresh()
  }

  const accepted = members.filter(m => m.invitation_accepted_at)
  const pending  = members.filter(m => !m.invitation_accepted_at)
  const breadcrumb = [team.departments?.divisions?.name, team.departments?.name].filter(Boolean).join(' › ')
  const label = orgRefLabel(team)

  const selectStyle = { width: '100%', outline: 'none', border: 'none', fontSize: 13, fontFamily: 'Arial, sans-serif', background: 'transparent', color: '#000' }
  const inputStyle = { width: '100%', outline: 'none', border: 'none', borderBottom: '1px solid #e8eef6', fontSize: 13, fontFamily: 'Arial, sans-serif', background: 'transparent', padding: '4px 0', color: '#000' }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', paddingBottom: 60 }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ position: 'sticky', top: 0, height: 0, overflow: 'visible', zIndex: 50 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 14px 0' }}>
          <Link href="/teams" style={{ height: 34, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', gap: 4, padding: '0 12px 0 8px', textDecoration: 'none' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>Teams</span>
          </Link>
        </div>
      </div>

      {/* ── Team-Hero ───────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg, #003366 0%, #005599 100%)', padding: '60px 20px 28px' }}>
        {editingTeam ? (
          <div>
            <input value={teamName} onChange={e => setTeamName(e.target.value)} autoFocus
              style={{ fontSize: 22, fontWeight: 700, color: 'white', background: 'transparent', border: 'none', borderBottom: '2px solid rgba(255,255,255,0.4)', outline: 'none', width: '100%', marginBottom: 12, fontFamily: 'Arial, sans-serif' }} />
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 5, fontWeight: 700 }}>STANDORT-ZUORDNUNG</label>
              <select value={orgRef} onChange={e => setOrgRef(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none', width: '100%' }}>
                <option value="">– Keine Zuordnung –</option>
                {locations.length > 0 && <optgroup label="Standorte">{locations.map(l => <option key={l.id} value={`location:${l.id}`}>{l.name}</option>)}</optgroup>}
                {halls.length > 0 && <optgroup label="Hallen">{halls.map(h => <option key={h.id} value={`hall:${h.id}`}>{h.locations?.name ? `${h.locations.name} › ` : ''}{h.name}</option>)}</optgroup>}
                {areas.length > 0 && <optgroup label="Bereiche">{areas.map(a => <option key={a.id} value={`area:${a.id}`}>{a.halls?.name ? `${a.halls.name} › ` : ''}{a.name}</option>)}</optgroup>}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={saveTeam} disabled={savingTeam} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'white', color: '#003366', border: 'none', borderRadius: 20, padding: '8px 18px', fontSize: 13, cursor: 'pointer', fontWeight: 700 }}>
                <Check size={13} /> Speichern
              </button>
              <button onClick={() => { setEditingTeam(false); setTeamName(team.name); setOrgRef(encodeRef(team)) }}
                style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'transparent', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 20, padding: '8px 18px', fontSize: 13, cursor: 'pointer' }}>
                <X size={13} /> Abbrechen
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              {breadcrumb && <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 4px' }}>{breadcrumb}</p>}
              <h1 style={{ fontSize: 26, fontWeight: 700, color: 'white', margin: '0 0 10px' }}>{team.name}</h1>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.12)', borderRadius: 20, padding: '5px 12px' }}>
                  <Users size={13} color="rgba(255,255,255,0.7)" />
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{accepted.length} Mitglied{accepted.length !== 1 ? 'er' : ''}</span>
                </div>
                {label && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.12)', borderRadius: 20, padding: '5px 12px' }}>
                    <MapPin size={13} color="rgba(255,255,255,0.7)" />
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{label}</span>
                  </div>
                )}
              </div>
            </div>
            <button onClick={() => setEditingTeam(true)}
              style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '8px 10px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <Pencil size={14} /> Bearbeiten
            </button>
          </div>
        )}
      </div>

      <div style={{ padding: '20px 16px 0' }}>

        {/* ── Mitglied hinzufügen Button ──────────────────────────── */}
        {!showInvite && (
          <button onClick={() => setShowInvite(true)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#003366', color: 'white', border: 'none', borderRadius: 50, padding: '13px', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 20, fontFamily: 'Arial, sans-serif' }}>
            <UserPlus size={15} /> Mitglied einladen
          </button>
        )}

        {/* ── Einlade-Formular ───────────────────────────────────── */}
        {showInvite && (
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #0099cc', overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ padding: '12px 16px', background: '#f0f8ff', borderBottom: '1px solid #c8d4e8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#003366', display: 'flex', alignItems: 'center', gap: 6 }}>
                <UserPlus size={14} /> Neues Mitglied einladen
              </span>
              <button onClick={() => { setShowInvite(false); setInviteError(null) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#96aed2', display: 'flex' }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
              <div style={{ padding: '11px 14px', borderRight: '1px solid #e8eef6' }}>
                <label style={{ display: 'block', fontSize: 10, color: '#96aed2', fontWeight: 700, marginBottom: 4 }}>VORNAME</label>
                <input value={inviteFirst} onChange={e => setInviteFirst(e.target.value)} placeholder="Max"
                  style={{ ...inputStyle, fontSize: 14 }} />
              </div>
              <div style={{ padding: '11px 14px' }}>
                <label style={{ display: 'block', fontSize: 10, color: '#96aed2', fontWeight: 700, marginBottom: 4 }}>NACHNAME</label>
                <input value={inviteLast} onChange={e => setInviteLast(e.target.value)} placeholder="Mustermann"
                  style={{ ...inputStyle, fontSize: 14 }} />
              </div>
            </div>
            <div style={{ height: 1, background: '#e8eef6' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 0 }}>
              <div style={{ padding: '11px 14px', borderRight: '1px solid #e8eef6' }}>
                <label style={{ display: 'block', fontSize: 10, color: '#96aed2', fontWeight: 700, marginBottom: 4 }}>E-MAIL *</label>
                <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleInvite()}
                  placeholder="max@firma.de"
                  style={{ ...inputStyle, fontSize: 14 }} />
              </div>
              <div style={{ padding: '11px 14px' }}>
                <label style={{ display: 'block', fontSize: 10, color: '#96aed2', fontWeight: 700, marginBottom: 4 }}>ROLLE</label>
                <select value={inviteRoleId} onChange={e => setInviteRoleId(e.target.value)} style={{ ...selectStyle, fontSize: 14 }}>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
            </div>
            {inviteError && <p style={{ color: '#E74C3C', fontSize: 12, padding: '0 14px 10px', margin: 0 }}>{inviteError}</p>}
            <div style={{ padding: '10px 14px', borderTop: '1px solid #e8eef6' }}>
              <button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#003366', color: 'white', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, cursor: 'pointer', fontWeight: 700, opacity: inviting || !inviteEmail.trim() ? 0.5 : 1 }}>
                {inviting ? <Loader size={13} /> : <Mail size={13} />}
                {inviting ? 'Wird eingeladen…' : 'Einladung erstellen'}
              </button>
            </div>
          </div>
        )}

        {inviteSuccess && (
          <div style={{ background: '#f0fff4', border: '1px solid #27AE60', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#1a5c3a' }}>
            {inviteSuccess}
          </div>
        )}

        {/* ── Aktive Mitglieder ──────────────────────────────────── */}
        {accepted.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px 2px' }}>
              Mitglieder · {accepted.length}
            </p>
            <div style={{ background: 'white', borderRadius: 14, border: '1px solid #c8d4e8', overflow: 'hidden' }}>
              {accepted.map((m, i) => (
                <div key={m.id}>
                  {i > 0 && <div style={{ height: 1, background: '#e8eef6', margin: '0 16px' }} />}
                  {editingMemberId === m.id ? (
                    <div style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: 10, color: '#96aed2', fontWeight: 700, marginBottom: 4 }}>VORNAME</label>
                          <input value={editForm.first_name} onChange={e => setEditForm(f => ({ ...f, first_name: e.target.value }))} style={inputStyle} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 10, color: '#96aed2', fontWeight: 700, marginBottom: 4 }}>NACHNAME</label>
                          <input value={editForm.last_name} onChange={e => setEditForm(f => ({ ...f, last_name: e.target.value }))} style={inputStyle} />
                        </div>
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <label style={{ display: 'block', fontSize: 10, color: '#96aed2', fontWeight: 700, marginBottom: 4 }}>ROLLE</label>
                        <select value={editForm.role_id} onChange={e => setEditForm(f => ({ ...f, role_id: e.target.value }))} style={selectStyle}>
                          {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={saveMember} disabled={savingMember}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#003366', color: 'white', border: 'none', borderRadius: 7, padding: '7px 14px', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}>
                          <Check size={12} /> Speichern
                        </button>
                        <button onClick={() => setEditingMemberId(null)}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'transparent', color: '#666', border: '1px solid #c8d4e8', borderRadius: 7, padding: '7px 14px', fontSize: 12, cursor: 'pointer' }}>
                          <X size={12} /> Abbrechen
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #003366, #0099cc)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                        {initials(m)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 600, color: '#000', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName(m)}</p>
                        <p style={{ margin: 0, fontSize: 12, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email}</p>
                        {m.roles && <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, color: '#0099cc', background: '#e8f4fc', borderRadius: 20, padding: '2px 8px', marginTop: 3 }}>{m.roles.name}</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => startEditMember(m)} title="Bearbeiten"
                          style={{ background: '#f5f8fc', border: '1px solid #c8d4e8', borderRadius: 7, padding: '6px 8px', cursor: 'pointer', color: '#003366', display: 'flex' }}>
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleRemove(m.id, displayName(m))} title="Entfernen"
                          style={{ background: '#fff5f5', border: '1px solid #fcc', borderRadius: 7, padding: '6px 8px', cursor: 'pointer', color: '#E74C3C', display: 'flex' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Ausstehende Einladungen ───────────────────────────── */}
        {pending.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px 2px' }}>
              Ausstehende Einladungen · {pending.length}
            </p>
            <div style={{ background: 'white', borderRadius: 14, border: '1px solid #c8d4e8', overflow: 'hidden' }}>
              {pending.map((m, i) => (
                <div key={m.id}>
                  {i > 0 && <div style={{ height: 1, background: '#e8eef6', margin: '0 16px' }} />}
                  <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f0f4ff', border: '2px dashed #c8d4e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#96aed2', flexShrink: 0 }}>
                      {initials(m)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: '0 0 1px', fontSize: 14, fontWeight: 600, color: '#000', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {[m.first_name, m.last_name].filter(Boolean).join(' ') || m.email}
                      </p>
                      <p style={{ margin: 0, fontSize: 12, color: '#888' }}>{m.email}</p>
                      <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, color: '#F39C12', background: '#fef9e7', borderRadius: 20, padding: '2px 8px', marginTop: 3 }}>Einladung ausstehend</span>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => handleResend(m.id)} title="Erneut einladen" disabled={resending === m.id}
                        style={{ background: '#f5f8fc', border: '1px solid #c8d4e8', borderRadius: 7, padding: '6px 8px', cursor: 'pointer', color: '#0099cc', display: 'flex' }}>
                        {resending === m.id ? <Loader size={14} /> : <RefreshCw size={14} />}
                      </button>
                      <button onClick={() => handleRemove(m.id, m.email)} title="Entfernen"
                        style={{ background: '#fff5f5', border: '1px solid #fcc', borderRadius: 7, padding: '6px 8px', cursor: 'pointer', color: '#E74C3C', display: 'flex' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {members.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 16px', background: 'white', borderRadius: 14, border: '1px solid #c8d4e8' }}>
            <Users size={32} color="#c8d4e8" style={{ marginBottom: 10 }} />
            <p style={{ color: '#aaa', fontSize: 14, margin: '0 0 4px', fontWeight: 600 }}>Noch keine Mitglieder</p>
            <p style={{ color: '#c0ccda', fontSize: 12, margin: 0 }}>Lade dein erstes Teammitglied ein.</p>
          </div>
        )}

        {/* ── Rollen & Rechte Link ──────────────────────────────── */}
        <Link href="/settings/roles" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', borderRadius: 14, border: '1px solid #c8d4e8', padding: '14px 16px', textDecoration: 'none', color: '#000', marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <KeyRound size={16} color="#003366" />
            <span style={{ fontSize: 15, fontWeight: 600 }}>Rollen & Rechte</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#96aed2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </Link>
      </div>
    </div>
  )
}
