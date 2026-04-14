'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { setMemberRole } from '../../teams/actions'
import { ROLE_COLORS, ROLE_BG, type AppRole } from '@/lib/permissions'
import { Shield, Crown, ChevronDown } from 'lucide-react'

type Member = {
  id: string
  full_name: string | null
  email: string
  app_role: AppRole
}

// Rollen die ein normaler Admin vergeben kann (nicht superadmin)
const ADMIN_ROLES: AppRole[] = ['admin', 'techniker', 'leser']
// Rollen die ein Superadmin vergeben kann
const SUPERADMIN_ROLES: AppRole[] = ['superadmin', 'admin', 'techniker', 'leser']

function initials(m: Member) {
  const name = m.full_name?.trim()
  if (name) {
    const parts = name.split(' ')
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return name[0].toUpperCase()
  }
  return m.email[0].toUpperCase()
}

function RoleBadge({ role, label }: { role: AppRole; label: string }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
      backgroundColor: ROLE_BG[role], color: ROLE_COLORS[role],
      display: 'inline-flex', alignItems: 'center', gap: 4,
    }}>
      {role === 'superadmin' && <Crown size={10} />}
      {label}
    </span>
  )
}

function RoleSelector({ memberId, currentRole, targetRole, isCurrentUser, isSuperadmin, roleLabels, youLabel }: {
  memberId: string
  currentRole: AppRole   // Rolle des eingeloggten Users
  targetRole: AppRole    // Rolle des angezeigten Members
  isCurrentUser: boolean
  isSuperadmin: boolean  // Ist der eingeloggte User Superadmin?
  roleLabels: Record<AppRole, string>
  youLabel: string
}) {
  const [role, setRole] = useState<AppRole>(targetRole)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  // Superadmin kann nur von Superadmin geändert werden
  const isProtected = targetRole === 'superadmin' && !isSuperadmin

  function handleChange(newRole: AppRole) {
    if (newRole === role) return
    setRole(newRole)
    setSaved(false)
    setErr(null)
    startTransition(async () => {
      const res = await setMemberRole(memberId, newRole)
      if (res?.error) {
        setRole(targetRole) // zurücksetzen
        setErr(res.error)
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    })
  }

  if (isCurrentUser || isProtected) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <RoleBadge role={role} label={roleLabels[role]} />
        {isCurrentUser && <span style={{ fontSize: 11, color: '#96aed2' }}>({youLabel})</span>}
        {isProtected && !isCurrentUser && (
          <span style={{ fontSize: 10, color: '#7c3aed', fontWeight: 600 }}>🔒</span>
        )}
      </div>
    )
  }

  const availableRoles = isSuperadmin ? SUPERADMIN_ROLES : ADMIN_ROLES

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexDirection: 'column', alignItems: 'flex-end' }}>
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
            {availableRoles.map(r => (
              <option key={r} value={r}>{roleLabels[r]}</option>
            ))}
          </select>
          <ChevronDown size={11} color={ROLE_COLORS[role]} style={{
            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none',
          }} />
        </div>
        {saved && <span style={{ fontSize: 11, color: '#27AE60', fontWeight: 700 }}>✓</span>}
        {isPending && <span style={{ fontSize: 11, color: '#96aed2' }}>…</span>}
      </div>
      {err && <span style={{ fontSize: 11, color: '#dc2626' }}>{err}</span>}
    </div>
  )
}

export function RolesManager({ members, currentUserId, isAdmin, isSuperadmin }: {
  members: Member[]
  currentUserId: string
  isAdmin: boolean
  isSuperadmin: boolean
}) {
  const t = useTranslations('roles')

  const roleLabels: Record<AppRole, string> = {
    superadmin: t('superadmin.label'),
    admin: t('admin.label'),
    techniker: t('techniker.label'),
    leser: t('leser.label'),
  }

  const roleDescriptions: Record<AppRole, string> = {
    superadmin: t('superadmin.description'),
    admin: t('admin.description'),
    techniker: t('techniker.description'),
    leser: t('leser.description'),
  }

  const displayRoles: AppRole[] = ['superadmin', 'admin', 'techniker', 'leser']

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>

      {/* Rollen-Erklärung */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
        {displayRoles.map(role => (
          <div key={role} style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            background: 'var(--ds-surface)', borderRadius: 12, padding: '12px 16px',
            border: `1px solid ${ROLE_BG[role]}`,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9, flexShrink: 0,
              background: ROLE_BG[role],
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {role === 'superadmin'
                ? <Crown size={15} color={ROLE_COLORS[role]} />
                : <Shield size={15} color={ROLE_COLORS[role]} />
              }
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: ROLE_COLORS[role] }}>
                {roleLabels[role]}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#666' }}>
                {roleDescriptions[role]}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Mitglieder-Liste */}
      {isAdmin && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {members.map(m => (
            <div key={m.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 12, background: 'var(--ds-surface)', borderRadius: 12,
              padding: '12px 16px', border: '1px solid var(--ds-border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                  background: ROLE_BG[m.app_role] ?? '#e8edf5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: ROLE_COLORS[m.app_role] ?? '#003366',
                  fontSize: 13, fontWeight: 700,
                }}>
                  {initials(m)}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--ds-text)' }}>
                    {m.full_name ?? m.email}
                  </p>
                  {m.full_name && (
                    <p style={{ margin: 0, fontSize: 11, color: '#96aed2' }}>{m.email}</p>
                  )}
                </div>
              </div>
              <RoleSelector
                memberId={m.id}
                currentRole={isSuperadmin ? 'superadmin' : 'admin'}
                targetRole={m.app_role}
                isCurrentUser={m.id === currentUserId}
                isSuperadmin={isSuperadmin}
                roleLabels={roleLabels}
                youLabel={t('you')}
              />
            </div>
          ))}
        </div>
      )}

      {!isAdmin && (
        <p style={{ fontSize: 12, color: '#96aed2', textAlign: 'center', marginTop: 16 }}>
          {t('onlyAdmins')}
        </p>
      )}
    </div>
  )
}
