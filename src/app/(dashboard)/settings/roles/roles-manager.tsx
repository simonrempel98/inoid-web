'use client'

import { useState, useTransition } from 'react'
import { setMemberRole } from '../../teams/actions'
import { ROLE_LABELS, ROLE_COLORS, ROLE_BG, ROLE_DESCRIPTIONS, type AppRole } from '@/lib/permissions'
import { Shield, ChevronDown } from 'lucide-react'

type Member = {
  id: string
  full_name: string | null
  email: string
  app_role: AppRole
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

function RoleBadge({ role }: { role: AppRole }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
      backgroundColor: ROLE_BG[role], color: ROLE_COLORS[role],
      display: 'inline-block',
    }}>
      {ROLE_LABELS[role]}
    </span>
  )
}

function RoleSelector({ memberId, currentRole, isCurrentUser }: {
  memberId: string
  currentRole: AppRole
  isCurrentUser: boolean
}) {
  const [role, setRole] = useState<AppRole>(currentRole)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  function handleChange(newRole: AppRole) {
    if (newRole === role) return
    setRole(newRole)
    setSaved(false)
    startTransition(async () => {
      await setMemberRole(memberId, newRole)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  if (isCurrentUser) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <RoleBadge role={role} />
        <span style={{ fontSize: 11, color: '#96aed2' }}>(du)</span>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative' }}>
        <select
          value={role}
          onChange={e => handleChange(e.target.value as AppRole)}
          disabled={isPending}
          style={{
            appearance: 'none',
            backgroundColor: ROLE_BG[role],
            color: ROLE_COLORS[role],
            border: 'none',
            borderRadius: 20,
            padding: '3px 28px 3px 10px',
            fontSize: 11,
            fontWeight: 700,
            fontFamily: 'Arial, sans-serif',
            cursor: 'pointer',
            outline: 'none',
            opacity: isPending ? 0.6 : 1,
          }}
        >
          {(Object.keys(ROLE_LABELS) as AppRole[]).map(r => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>
        <ChevronDown size={11} color={ROLE_COLORS[role]} style={{
          position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none',
        }} />
      </div>
      {saved && <span style={{ fontSize: 11, color: '#27AE60', fontWeight: 700 }}>✓</span>}
      {isPending && <span style={{ fontSize: 11, color: '#96aed2' }}>…</span>}
    </div>
  )
}

export function RolesManager({ members, currentUserId, isAdmin }: {
  members: Member[]
  currentUserId: string
  isAdmin: boolean
}) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>

      {/* Rollen-Erklärung */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
        {(Object.keys(ROLE_LABELS) as AppRole[]).map(role => (
          <div key={role} style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            background: 'white', borderRadius: 12, padding: '12px 16px',
            border: `1px solid ${ROLE_BG[role]}`,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9, flexShrink: 0,
              background: ROLE_BG[role],
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Shield size={15} color={ROLE_COLORS[role]} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: ROLE_COLORS[role] }}>
                {ROLE_LABELS[role]}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#666' }}>
                {ROLE_DESCRIPTIONS[role]}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Mitgliederliste */}
      <p style={{ fontSize: 12, fontWeight: 700, color: '#96aed2', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>
        Mitglieder · {members.length}
      </p>
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #c8d4e8', overflow: 'hidden' }}>
        {members.map((m, i) => (
          <div key={m.id}>
            {i > 0 && <div style={{ height: 1, background: '#e8eef6', margin: '0 16px' }} />}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
              {/* Avatar */}
              <div style={{
                width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                background: `linear-gradient(135deg, ${ROLE_COLORS[m.app_role]}, ${ROLE_COLORS[m.app_role]}99)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700, color: 'white',
              }}>
                {initials(m)}
              </div>

              {/* Name + Email */}
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

              {/* Rolle */}
              {isAdmin ? (
                <RoleSelector
                  memberId={m.id}
                  currentRole={m.app_role}
                  isCurrentUser={m.id === currentUserId}
                />
              ) : (
                <RoleBadge role={m.app_role} />
              )}
            </div>
          </div>
        ))}
      </div>

      {!isAdmin && (
        <p style={{ fontSize: 12, color: '#96aed2', textAlign: 'center', marginTop: 16 }}>
          Nur Admins können Rollen ändern.
        </p>
      )}
    </div>
  )
}
