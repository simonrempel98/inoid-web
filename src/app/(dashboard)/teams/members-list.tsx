'use client'

import { useState, useMemo } from 'react'
import { ROLE_COLORS, ROLE_BG, type AppRole } from '@/lib/permissions'
import { Search, Users } from 'lucide-react'

type Member = {
  id: string
  full_name: string | null
  email: string
  app_role: AppRole
  team_id?: string | null
}

type Team = {
  id: string
  name: string
}

function initials(m: Member) {
  const name = m.full_name?.trim()
  if (name) {
    const parts = name.split(' ')
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return name[0].toUpperCase()
  }
  return m.email[0].toUpperCase()
}

export function MembersList({
  members,
  teams,
  currentUserId,
}: {
  members: Member[]
  teams: Team[]
  currentUserId: string
}) {
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterTeam, setFilterTeam] = useState('')

  const filtered = useMemo(() => {
    return members.filter(m => {
      if (search) {
        const q = search.toLowerCase()
        if (!(m.full_name ?? '').toLowerCase().includes(q) && !m.email.toLowerCase().includes(q)) return false
      }
      if (filterRole && m.app_role !== filterRole) return false
      if (filterTeam) {
        if (filterTeam === '__none__') return !m.team_id
        if (m.team_id !== filterTeam) return false
      }
      return true
    })
  }, [members, search, filterRole, filterTeam])

  // Gruppierung
  const grouped = useMemo(() => {
    if (filterTeam) return null // wenn ein Team gefiltert → keine Gruppen nötig

    const teamMap: Record<string, Member[]> = {}
    const noTeam: Member[] = []

    for (const m of filtered) {
      if (m.team_id) {
        if (!teamMap[m.team_id]) teamMap[m.team_id] = []
        teamMap[m.team_id].push(m)
      } else {
        noTeam.push(m)
      }
    }

    const groups: { label: string; members: Member[] }[] = []
    for (const team of teams) {
      if (teamMap[team.id]?.length) {
        groups.push({ label: team.name, members: teamMap[team.id] })
      }
    }
    if (noTeam.length) {
      groups.push({ label: 'Ohne Team', members: noTeam })
    }
    return groups
  }, [filtered, teams, filterTeam])

  const hasFilter = search !== '' || filterRole !== '' || filterTeam !== ''

  const inputStyle: React.CSSProperties = {
    flex: 1, minWidth: 120, padding: '9px 10px', borderRadius: 10,
    border: '1px solid #c8d4e8', fontSize: 13,
    fontFamily: 'Arial, sans-serif', backgroundColor: 'white',
    outline: 'none', cursor: 'pointer', color: '#666',
  }

  function MemberRow({ m }: { m: Member }) {
    const roleColors: Record<AppRole, string> = ROLE_COLORS
    const roleBg: Record<AppRole, string> = ROLE_BG
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg, ${roleColors[m.app_role]}, ${roleColors[m.app_role]}99)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: 'white',
        }}>
          {initials(m)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#000',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {m.full_name || m.email}
            {m.id === currentUserId && (
              <span style={{ fontSize: 11, color: '#96aed2', fontWeight: 400, marginLeft: 6 }}>du</span>
            )}
          </p>
          <p style={{ margin: '1px 0 0', fontSize: 12, color: '#888',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {m.email}
          </p>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
          backgroundColor: roleBg[m.app_role], color: roleColors[m.app_role],
        }}>
          {m.app_role}
        </span>
      </div>
    )
  }

  return (
    <div>
      <p style={{ fontSize: 12, fontWeight: 700, color: '#96aed2', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px' }}>
        Mitglieder · {members.length}
      </p>

      {/* Filter-Zeile */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {/* Suche */}
        <div style={{ position: 'relative', flex: 2, minWidth: 160 }}>
          <Search size={13} color="#96aed2" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Name oder E-Mail suchen…"
            style={{ ...inputStyle, paddingLeft: 30, width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        {/* Rolle */}
        <select
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
          style={{ ...inputStyle, color: filterRole ? '#003366' : '#666', fontWeight: filterRole ? 700 : 400, border: filterRole ? '1px solid #003366' : '1px solid #c8d4e8' }}
        >
          <option value="">Alle Rollen</option>
          <option value="admin">Admin</option>
          <option value="techniker">Techniker</option>
          <option value="leser">Leser</option>
        </select>

        {/* Team */}
        {teams.length > 0 && (
          <select
            value={filterTeam}
            onChange={e => setFilterTeam(e.target.value)}
            style={{ ...inputStyle, color: filterTeam ? '#003366' : '#666', fontWeight: filterTeam ? 700 : 400, border: filterTeam ? '1px solid #003366' : '1px solid #c8d4e8' }}
          >
            <option value="">Alle Teams</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            <option value="__none__">Ohne Team</option>
          </select>
        )}

        {hasFilter && (
          <button
            onClick={() => { setSearch(''); setFilterRole(''); setFilterTeam('') }}
            style={{ padding: '9px 14px', borderRadius: 10, border: '1px solid #c8d4e8', background: 'white', color: '#96aed2', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Arial, sans-serif', whiteSpace: 'nowrap' }}
          >
            Zurücksetzen
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #c8d4e8', padding: '32px 20px', textAlign: 'center' }}>
          <Users size={28} color="#c8d4e8" style={{ marginBottom: 8 }} />
          <p style={{ fontSize: 14, color: '#666', margin: 0 }}>Keine Mitglieder gefunden</p>
        </div>
      ) : grouped && grouped.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {grouped.map(group => (
            <div key={group.label}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#96aed2', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Users size={11} />
                {group.label} · {group.members.length}
              </p>
              <div style={{ background: 'white', borderRadius: 14, border: '1px solid #c8d4e8', overflow: 'hidden' }}>
                {group.members.map((m, i) => (
                  <div key={m.id}>
                    {i > 0 && <div style={{ height: 1, background: '#e8eef6', margin: '0 16px' }} />}
                    <MemberRow m={m} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #c8d4e8', overflow: 'hidden' }}>
          {filtered.map((m, i) => (
            <div key={m.id}>
              {i > 0 && <div style={{ height: 1, background: '#e8eef6', margin: '0 16px' }} />}
              <MemberRow m={m} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
