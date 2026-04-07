'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Users, MapPin, Mail, Copy, Check, Trash2,
  Clock, Pencil, X, KeyRound, UserPlus
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
  invitation_token: string | null
  invitation_expires_at: string | null
  invitation_accepted_at: string | null
  roles: { name: string } | null
}
type Location = { id: string; name: string }
type Hall     = { id: string; name: string; location_id: string; locations: { name: string } | null }
type Area     = { id: string; name: string; hall_id: string; halls: { name: string } | null }
type Role     = { id: string; name: string }

function randomToken() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}
function isExpired(m: Member) {
  if (m.invitation_accepted_at || !m.invitation_expires_at) return false
  return new Date(m.invitation_expires_at) < new Date()
}
function timeLeft(m: Member) {
  if (m.invitation_accepted_at) return 'Aktiv'
  if (!m.invitation_expires_at) return ''
  const diff = new Date(m.invitation_expires_at).getTime() - Date.now()
  if (diff <= 0) return 'Abgelaufen'
  const h = Math.floor(diff / 3600000), min = Math.floor((diff % 3600000) / 60000)
  return `${h}h ${min}m`
}

// Kombinierter Wert: "location:uuid" | "hall:uuid" | "area:uuid" | ""
function encodeRef(team: Team): string {
  if (team.area_id) return `area:${team.area_id}`
  if (team.hall_id) return `hall:${team.hall_id}`
  if (team.location_id) return `location:${team.location_id}`
  return ''
}
function orgRefLabel(team: Team): string | null {
  if (team.areas) return team.areas.name
  if (team.halls) return team.halls.name
  if (team.locations) return team.locations.name
  return null
}

export function TeamDetail({ team, members, locations, halls, areas, roles, organizationId }: {
  team: Team; members: Member[]
  locations: Location[]; halls: Hall[]; areas: Area[]
  roles: Role[]; organizationId: string
}) {
  const router = useRouter()
  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState(team.name)
  const [orgRef, setOrgRef] = useState(encodeRef(team))
  const [saving, setSaving] = useState(false)

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRoleId, setInviteRoleId] = useState(roles[0]?.id ?? '')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.inoid.app'

  async function saveTeam() {
    setSaving(true)
    const supabase = createClient()
    const [type, id] = orgRef ? orgRef.split(':') : ['', '']
    await supabase.from('teams').update({
      name,
      location_id: type === 'location' ? id : null,
      hall_id:     type === 'hall'     ? id : null,
      area_id:     type === 'area'     ? id : null,
    }).eq('id', team.id)
    setSaving(false)
    setEditingName(false)
    router.refresh()
  }

  async function invite() {
    if (!inviteEmail.trim()) return
    setInviting(true)
    setInviteError(null)
    const supabase = createClient()
    const token = randomToken()
    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
    const roleId = inviteRoleId || roles[0]?.id

    if (!roleId) { setInviteError('Keine Rolle vorhanden.'); setInviting(false); return }

    const { data: existing } = await supabase
      .from('organization_members')
      .select('id, invitation_accepted_at')
      .eq('organization_id', organizationId)
      .eq('email', inviteEmail.trim())
      .single()

    if (existing?.invitation_accepted_at) {
      // Bereits Mitglied → nur Team zuweisen
      await supabase.from('organization_members').update({ team_id: team.id }).eq('id', existing.id)
    } else if (existing) {
      await supabase.from('organization_members').update({ invitation_token: token, invitation_expires_at: expiresAt, team_id: team.id }).eq('id', existing.id)
    } else {
      const { error } = await supabase.from('organization_members').insert({
        organization_id: organizationId,
        email: inviteEmail.trim(),
        role_id: roleId,
        invitation_token: token,
        invitation_expires_at: expiresAt,
        team_id: team.id,
      })
      if (error) { setInviteError(error.message); setInviting(false); return }
    }

    setInviteEmail('')
    setInviting(false)
    router.refresh()
  }

  async function removeMember(memberId: string) {
    if (!confirm('Mitglied aus diesem Team entfernen?')) return
    const supabase = createClient()
    await supabase.from('organization_members').update({ team_id: null }).eq('id', memberId)
    router.refresh()
  }

  async function copyLink(token: string) {
    await navigator.clipboard.writeText(`${origin}/invite/${token}`)
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
  }

  const accepted = members.filter(m => m.invitation_accepted_at)
  const pending  = members.filter(m => !m.invitation_accepted_at)

  const breadcrumb = [team.departments?.divisions?.name, team.departments?.name].filter(Boolean).join(' › ')

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', paddingBottom: 40 }}>
      {/* Zurück */}
      <div style={{ position: 'sticky', top: 0, height: 0, overflow: 'visible', zIndex: 50 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 14px 0' }}>
          <Link href="/teams" style={{
            height: 34, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', gap: 4, padding: '0 12px 0 8px', textDecoration: 'none',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>Teams</span>
          </Link>
          <div style={{ height: 28, borderRadius: 20, backgroundColor: 'rgba(139,92,246,0.75)', display: 'flex', alignItems: 'center', gap: 5, padding: '0 12px' }}>
            <Users size={12} color="white" />
            <span style={{ color: 'white', fontSize: 11, fontWeight: 700 }}>Team</span>
          </div>
        </div>
      </div>

      {/* Header-Bereich (kein Bild) */}
      <div style={{ background: '#003366', padding: '60px 16px 24px', marginBottom: 0 }}>
        {editingName ? (
          <div>
            <input value={name} onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveTeam(); if (e.key === 'Escape') { setEditingName(false); setName(team.name) } }}
              autoFocus
              style={{ fontSize: 22, fontWeight: 700, color: 'white', background: 'transparent', border: 'none', borderBottom: '2px solid rgba(255,255,255,0.5)', outline: 'none', width: '100%', marginBottom: 8, fontFamily: 'Arial, sans-serif' }} />
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>
                Standort zuordnen (optional)
              </label>
              <select value={orgRef} onChange={e => setOrgRef(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, padding: '6px 10px', fontSize: 13, outline: 'none', width: '100%' }}>
                <option value="">– Keine Zuordnung –</option>
                {locations.length > 0 && (
                  <optgroup label="Standorte">
                    {locations.map(l => (
                      <option key={l.id} value={`location:${l.id}`}>{l.name}</option>
                    ))}
                  </optgroup>
                )}
                {halls.length > 0 && (
                  <optgroup label="Hallen">
                    {halls.map(h => (
                      <option key={h.id} value={`hall:${h.id}`}>
                        {h.locations?.name ? `${h.locations.name} › ` : ''}{h.name}
                      </option>
                    ))}
                  </optgroup>
                )}
                {areas.length > 0 && (
                  <optgroup label="Bereiche">
                    {areas.map(a => (
                      <option key={a.id} value={`area:${a.id}`}>
                        {a.halls?.name ? `${a.halls.name} › ` : ''}{a.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={saveTeam} disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'white', color: '#003366', border: 'none', borderRadius: 20, padding: '7px 16px', fontSize: 13, cursor: 'pointer', fontWeight: 700, opacity: saving ? 0.6 : 1 }}>
                <Check size={13} /> Speichern
              </button>
              <button onClick={() => { setEditingName(false); setName(team.name); setOrgRef(encodeRef(team)) }}
                style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'transparent', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 20, padding: '7px 16px', fontSize: 13, cursor: 'pointer' }}>
                <X size={13} /> Abbrechen
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              {breadcrumb && <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, margin: '0 0 4px' }}>{breadcrumb}</p>}
              <h1 style={{ fontSize: 24, fontWeight: 700, color: 'white', margin: '0 0 6px' }}>{team.name}</h1>
              {orgRefLabel(team) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <MapPin size={12} color="rgba(255,255,255,0.6)" />
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{orgRefLabel(team)}</span>
                </div>
              )}
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={14} color="white" />
                </div>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                  {accepted.length} {accepted.length === 1 ? 'Mitglied' : 'Mitglieder'}
                </span>
              </div>
            </div>
            <button onClick={() => setEditingName(true)}
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '7px', cursor: 'pointer', color: 'white', display: 'flex' }}>
              <Pencil size={15} />
            </button>
          </div>
        )}
      </div>

      <div style={{ padding: '20px 16px 0' }}>

        {/* Mitglied einladen */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#000', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <UserPlus size={14} /> Mitglied einladen
          </h2>
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #c8d4e8', overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px' }}>
              <label style={{ display: 'block', fontSize: 11, color: '#666', marginBottom: 4 }}>E-Mail-Adresse</label>
              <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && invite()}
                placeholder="name@firma.de"
                style={{ width: '100%', outline: 'none', border: 'none', fontSize: 14, fontFamily: 'Arial, sans-serif', background: 'transparent' }} />
            </div>
            {roles.length > 0 && (
              <>
                <div style={{ height: 1, background: '#c8d4e8' }} />
                <div style={{ padding: '12px 14px' }}>
                  <label style={{ display: 'block', fontSize: 11, color: '#666', marginBottom: 4 }}>Rolle</label>
                  <select value={inviteRoleId} onChange={e => setInviteRoleId(e.target.value)}
                    style={{ width: '100%', outline: 'none', border: 'none', fontSize: 14, fontFamily: 'Arial, sans-serif', background: 'transparent' }}>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
              </>
            )}
          </div>
          {inviteError && <p style={{ color: '#E74C3C', fontSize: 12, margin: '6px 0 0' }}>{inviteError}</p>}
          <button onClick={invite} disabled={inviting || !inviteEmail.trim()}
            style={{ width: '100%', marginTop: 10, background: '#003366', color: 'white', border: 'none', borderRadius: 50, padding: '13px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, opacity: inviting || !inviteEmail.trim() ? 0.5 : 1 }}>
            <Mail size={15} /> {inviting ? 'Wird eingeladen…' : 'Einladung senden'}
          </button>
        </div>

        {/* Ausstehende Einladungen */}
        {pending.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px 4px' }}>
              Ausstehend ({pending.length})
            </p>
            <div style={{ background: 'white', borderRadius: 14, border: '1px solid #c8d4e8', overflow: 'hidden' }}>
              {pending.map((m, i) => (
                <div key={m.id}>
                  {i > 0 && <div style={{ height: 1, background: '#c8d4e8', margin: '0 14px' }} />}
                  <div style={{ padding: '11px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email}</p>
                      <p style={{ margin: 0, fontSize: 11, color: isExpired(m) ? '#E74C3C' : '#0099cc', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Clock size={10} /> {timeLeft(m)}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {m.invitation_token && !isExpired(m) && (
                        <button onClick={() => copyLink(m.invitation_token!)}
                          style={{ background: copied === m.invitation_token ? '#f0fff4' : '#f5f8fc', border: '1px solid #c8d4e8', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: copied === m.invitation_token ? '#27AE60' : '#003366' }}>
                          {copied === m.invitation_token ? <Check size={12} /> : <Copy size={12} />}
                          Link
                        </button>
                      )}
                      <button onClick={() => removeMember(m.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#c0ccda', display: 'flex' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Aktive Mitglieder */}
        {accepted.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px 4px' }}>
              Mitglieder ({accepted.length})
            </p>
            <div style={{ background: 'white', borderRadius: 14, border: '1px solid #c8d4e8', overflow: 'hidden' }}>
              {accepted.map((m, i) => (
                <div key={m.id}>
                  {i > 0 && <div style={{ height: 1, background: '#c8d4e8', margin: '0 14px' }} />}
                  <div style={{ padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e8eef6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#003366', flexShrink: 0 }}>
                      {m.email[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: '0 0 2px', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email}</p>
                      {m.roles && <p style={{ margin: 0, fontSize: 11, color: '#0099cc', fontWeight: 600 }}>{m.roles.name}</p>}
                    </div>
                    <button onClick={() => removeMember(m.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#c0ccda', display: 'flex' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {accepted.length === 0 && pending.length === 0 && (
          <p style={{ textAlign: 'center', color: '#aaa', fontSize: 13, marginTop: 8 }}>
            Noch keine Mitglieder in diesem Team.
          </p>
        )}

        {/* Rollen & Rechte Link */}
        <Link href="/settings/roles" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'white', borderRadius: 14, border: '1px solid #c8d4e8', padding: '14px 16px',
          textDecoration: 'none', color: '#000', marginTop: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <KeyRound size={16} color="#003366" />
            <span style={{ fontSize: 15, fontWeight: 600 }}>Rollen & Rechte</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#96aed2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </Link>
      </div>
    </div>
  )
}
