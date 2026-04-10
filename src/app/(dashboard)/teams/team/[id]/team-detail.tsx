'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { updateMember, unassignMemberFromTeam, assignMemberToTeam, setMemberRole } from '../../actions'
import {
  Users, MapPin, Pencil, X, Check, UserMinus,
  UserPlus, KeyRound, Loader, MessageSquare, Search,
} from 'lucide-react'
import { ROLE_COLORS, ROLE_BG, type AppRole } from '@/lib/permissions'

type Team = {
  id: string; name: string
  area_id: string | null; hall_id: string | null; location_id: string | null
  departments: { name: string; divisions: { name: string } | null } | null
  areas: { id: string; name: string } | null
  halls: { id: string; name: string } | null
  locations: { id: string; name: string } | null
}
type Member = {
  id: string; user_id: string | null; email: string
  first_name: string | null; last_name: string | null
  invitation_accepted_at: string | null
  team_id: string | null
  avatar_url: string | null
  roles: { id: string; name: string } | null
  app_role: AppRole
}
type Location = { id: string; name: string }
type Hall     = { id: string; name: string; location_id: string; locations: { name: string } | null }
type Area     = { id: string; name: string; hall_id: string; halls: { name: string } | null }
type Role     = { id: string; name: string }

const APP_ROLES: AppRole[] = ['admin', 'techniker', 'leser']

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

export function TeamDetail({ team, members, availableMembers, locations, halls, areas, roles, organizationId, currentUserRole, showChat }: {
  team: Team; members: Member[]; availableMembers: Member[]
  locations: Location[]; halls: Hall[]; areas: Area[]; roles: Role[]
  organizationId: string
  currentUserRole: AppRole
  showChat?: boolean
}) {
  const t = useTranslations('teams')
  const tRoles = useTranslations('roles')
  const isAdmin = currentUserRole === 'admin' || currentUserRole === 'superadmin'
  const router = useRouter()

  const roleLabels: Record<AppRole, string> = {
    admin: tRoles('admin.label'),
    techniker: tRoles('techniker.label'),
    leser: tRoles('leser.label'),
  }

  const [editingTeam, setEditingTeam] = useState(false)
  const [teamName, setTeamName] = useState(team.name)
  const [orgRef, setOrgRef] = useState(encodeRef(team))
  const [savingTeam, setSavingTeam] = useState(false)

  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', app_role: 'leser' as AppRole })
  const [savingMember, setSavingMember] = useState(false)

  const [showAssign, setShowAssign] = useState(false)
  const [assignSearch, setAssignSearch] = useState('')
  const [assigning, setAssigning] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!showChat) return
    const lastRead = localStorage.getItem(`chat_last_read_${team.id}`)
    const since = lastRead ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const supabase = createClient()
    supabase
      .from('chat_messages' as any)
      .select('id', { count: 'exact', head: true })
      .eq('team_id', team.id)
      .gt('created_at', since)
      .then(({ count }) => setUnreadCount(count ?? 0))
  }, [team.id, showChat])

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
    setEditForm({ first_name: m.first_name ?? '', last_name: m.last_name ?? '', app_role: m.app_role ?? 'leser' })
  }

  async function saveMember() {
    if (!editingMemberId) return
    setSavingMember(true)
    const member = members.find(m => m.id === editingMemberId)
    await updateMember(editingMemberId, {
      first_name: editForm.first_name || undefined,
      last_name: editForm.last_name || undefined,
    })
    if (member?.user_id && editForm.app_role !== member.app_role) {
      await setMemberRole(member.user_id, editForm.app_role)
    }
    setSavingMember(false)
    setEditingMemberId(null)
    router.refresh()
  }

  async function handleUnassign(memberId: string, name: string) {
    if (!confirm(`${name} aus dem Team entfernen?`)) return
    await unassignMemberFromTeam(memberId)
    router.refresh()
  }

  async function handleAssign(memberId: string) {
    setAssigning(memberId)
    await assignMemberToTeam(memberId, team.id)
    setAssigning(null)
    setAssignSearch('')
    router.refresh()
  }

  const filteredAvailable = availableMembers.filter(m => {
    const q = assignSearch.toLowerCase()
    if (!q) return true
    return displayName(m).toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
  })

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
              <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 5, fontWeight: 700 }}>{t('locationLabel')}</label>
              <select value={orgRef} onChange={e => setOrgRef(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none', width: '100%' }}>
                <option value="">{t('locationNone')}</option>
                {locations.length > 0 && <optgroup label={t('locationsGroup')}>{locations.map(l => <option key={l.id} value={`location:${l.id}`}>{l.name}</option>)}</optgroup>}
                {halls.length > 0 && <optgroup label={t('hallsGroup')}>{halls.map(h => <option key={h.id} value={`hall:${h.id}`}>{h.locations?.name ? `${h.locations.name} › ` : ''}{h.name}</option>)}</optgroup>}
                {areas.length > 0 && <optgroup label={t('areasGroup')}>{areas.map(a => <option key={a.id} value={`area:${a.id}`}>{a.halls?.name ? `${a.halls.name} › ` : ''}{a.name}</option>)}</optgroup>}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={saveTeam} disabled={savingTeam} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'white', color: '#003366', border: 'none', borderRadius: 20, padding: '8px 18px', fontSize: 13, cursor: 'pointer', fontWeight: 700 }}>
                <Check size={13} /> {t('save')}
              </button>
              <button onClick={() => { setEditingTeam(false); setTeamName(team.name); setOrgRef(encodeRef(team)) }}
                style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'transparent', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 20, padding: '8px 18px', fontSize: 13, cursor: 'pointer' }}>
                <X size={13} /> {t('cancel')}
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
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{t('memberCount', { count: members.length })}</span>
                </div>
                {label && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.12)', borderRadius: 20, padding: '5px 12px' }}>
                    <MapPin size={13} color="rgba(255,255,255,0.7)" />
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{label}</span>
                  </div>
                )}
              </div>
            </div>
            {isAdmin && (
              <button onClick={() => setEditingTeam(true)}
                style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '8px 10px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <Pencil size={14} /> {t('edit')}
              </button>
            )}
          </div>
        )}
      </div>

      <div style={{ padding: '20px 16px 0' }}>

        {/* ── Mitglied zuweisen ──────────────────────────────────── */}
        {isAdmin && (
          <button onClick={() => { setShowAssign(v => !v); setAssignSearch('') }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#003366', color: 'white', border: 'none', borderRadius: 50, padding: '13px', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 16, fontFamily: 'Arial, sans-serif' }}>
            <UserPlus size={15} /> Mitglied zuweisen
          </button>
        )}

        {showAssign && (
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #0099cc', overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ padding: '12px 16px', background: '#f0f8ff', borderBottom: '1px solid #c8d4e8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#003366', display: 'flex', alignItems: 'center', gap: 6 }}>
                <UserPlus size={14} /> Mitglied diesem Team zuweisen
              </span>
              <button onClick={() => setShowAssign(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#96aed2', display: 'flex' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '10px 14px', borderBottom: '1px solid #e8eef6', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Search size={14} color="#96aed2" style={{ flexShrink: 0 }} />
              <input
                value={assignSearch}
                onChange={e => setAssignSearch(e.target.value)}
                placeholder="Name oder E-Mail suchen…"
                autoFocus
                style={{ flex: 1, outline: 'none', border: 'none', fontSize: 13, fontFamily: 'Arial, sans-serif', background: 'transparent', color: '#000' }}
              />
            </div>

            {availableMembers.length === 0 ? (
              <p style={{ fontSize: 13, color: '#96aed2', padding: '14px 16px', margin: 0, fontStyle: 'italic' }}>
                Alle Mitglieder der Organisation sind bereits diesem Team zugewiesen.
              </p>
            ) : filteredAvailable.length === 0 ? (
              <p style={{ fontSize: 13, color: '#96aed2', padding: '14px 16px', margin: 0, fontStyle: 'italic' }}>
                Keine Mitglieder gefunden.
              </p>
            ) : (
              <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                {filteredAvailable.map((m, i) => (
                  <div key={m.id}>
                    {i > 0 && <div style={{ height: 1, background: '#e8eef6', margin: '0 16px' }} />}
                    <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: m.avatar_url ? 'transparent' : 'linear-gradient(135deg, #96aed2, #c8d4e8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0, overflow: 'hidden' }}>
                        {m.avatar_url
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={m.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : initials(m)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: '0 0 1px', fontSize: 13, fontWeight: 600, color: '#000', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName(m)}</p>
                        <p style={{ margin: 0, fontSize: 11, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email}</p>
                      </div>
                      <button
                        onClick={() => handleAssign(m.id)}
                        disabled={assigning === m.id}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#003366', color: 'white', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, cursor: 'pointer', fontWeight: 700, flexShrink: 0, opacity: assigning === m.id ? 0.6 : 1 }}>
                        {assigning === m.id ? <Loader size={12} /> : <Check size={12} />}
                        Zuweisen
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Mitgliederliste ────────────────────────────────────── */}
        {members.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px 2px' }}>
              {t('membersSection', { count: members.length })}
            </p>
            <div style={{ background: 'white', borderRadius: 14, border: '1px solid #c8d4e8', overflow: 'hidden' }}>
              {members.map((m, i) => (
                <div key={m.id}>
                  {i > 0 && <div style={{ height: 1, background: '#e8eef6', margin: '0 16px' }} />}
                  {editingMemberId === m.id ? (
                    <div style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: 10, color: '#96aed2', fontWeight: 700, marginBottom: 4 }}>{t('colFirstName')}</label>
                          <input value={editForm.first_name} onChange={e => setEditForm(f => ({ ...f, first_name: e.target.value }))} style={inputStyle} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 10, color: '#96aed2', fontWeight: 700, marginBottom: 4 }}>{t('colLastName')}</label>
                          <input value={editForm.last_name} onChange={e => setEditForm(f => ({ ...f, last_name: e.target.value }))} style={inputStyle} />
                        </div>
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <label style={{ display: 'block', fontSize: 10, color: '#96aed2', fontWeight: 700, marginBottom: 4 }}>{t('colRoleLabel')}</label>
                        <select value={editForm.app_role} onChange={e => setEditForm(f => ({ ...f, app_role: e.target.value as AppRole }))} style={selectStyle}>
                          {APP_ROLES.map(r => (
                            <option key={r} value={r}>{roleLabels[r]}</option>
                          ))}
                        </select>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={saveMember} disabled={savingMember}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#003366', color: 'white', border: 'none', borderRadius: 7, padding: '7px 14px', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}>
                          <Check size={12} /> {t('save')}
                        </button>
                        <button onClick={() => setEditingMemberId(null)}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'transparent', color: '#666', border: '1px solid #c8d4e8', borderRadius: 7, padding: '7px 14px', fontSize: 12, cursor: 'pointer' }}>
                          <X size={12} /> {t('cancel')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: m.avatar_url ? 'transparent' : 'linear-gradient(135deg, #003366, #0099cc)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white', flexShrink: 0, overflow: 'hidden' }}>
                        {m.avatar_url
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={m.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : initials(m)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 600, color: '#000', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName(m)}</p>
                        <p style={{ margin: 0, fontSize: 12, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email}</p>
                        <span style={{
                          display: 'inline-block', fontSize: 10, fontWeight: 700,
                          color: ROLE_COLORS[m.app_role], background: ROLE_BG[m.app_role],
                          borderRadius: 20, padding: '2px 8px', marginTop: 3
                        }}>
                          {roleLabels[m.app_role]}
                        </span>
                      </div>
                      {isAdmin && (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => startEditMember(m)}
                            style={{ background: '#f5f8fc', border: '1px solid #c8d4e8', borderRadius: 7, padding: '6px 8px', cursor: 'pointer', color: '#003366', display: 'flex' }}>
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleUnassign(m.id, displayName(m))}
                            style={{ background: '#fff5f5', border: '1px solid #fcc', borderRadius: 7, padding: '6px 8px', cursor: 'pointer', color: '#E74C3C', display: 'flex' }}>
                            <UserMinus size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {members.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 16px', background: 'white', borderRadius: 14, border: '1px solid #c8d4e8', marginBottom: 16 }}>
            <Users size={32} color="#c8d4e8" style={{ marginBottom: 10 }} />
            <p style={{ color: '#aaa', fontSize: 14, margin: '0 0 4px', fontWeight: 600 }}>Noch keine Mitglieder</p>
            <p style={{ color: '#c0ccda', fontSize: 12, margin: 0 }}>Weise Mitglieder über die Schaltfläche oben zu.</p>
          </div>
        )}

        {showChat && (
          <Link href={`/teams/team/${team.id}/chat`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#e8f4fb', borderRadius: 14, border: '1px solid #b3d9f0', padding: '14px 16px', textDecoration: 'none', color: '#000', marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <MessageSquare size={16} color="#0099cc" />
              <span style={{ fontSize: 15, fontWeight: 600, color: '#0099cc' }}>Team-Chat</span>
              {unreadCount > 0 && (
                <span style={{
                  background: '#E74C3C', color: 'white', borderRadius: 20,
                  fontSize: 11, fontWeight: 700, padding: '2px 7px', lineHeight: 1.4,
                }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0099cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </Link>
        )}

        <Link href="/settings/roles" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', borderRadius: 14, border: '1px solid #c8d4e8', padding: '14px 16px', textDecoration: 'none', color: '#000', marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <KeyRound size={16} color="#003366" />
            <span style={{ fontSize: 15, fontWeight: 600 }}>{t('rolesAndPermissions')}</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#96aed2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </Link>
      </div>
    </div>
  )
}
