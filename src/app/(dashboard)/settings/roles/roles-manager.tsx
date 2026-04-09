'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { setMemberRole } from '../../teams/actions'
import { ROLE_COLORS, ROLE_BG, type AppRole } from '@/lib/permissions'
import { Shield, ChevronDown } from 'lucide-react'

type Member = {
  id: string
  full_name: string | null
  email: string
  app_role: AppRole
}

const APP_ROLES: AppRole[] = ['admin', 'techniker', 'leser']

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
      display: 'inline-block',
    }}>
      {label}
    </span>
  )
}

function RoleSelector({ memberId, currentRole, isCurrentUser, roleLabels, youLabel }: {
  memberId: string
  currentRole: AppRole
  isCurrentUser: boolean
  roleLabels: Record<AppRole, string>
  youLabel: string
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
        <RoleBadge role={role} label={roleLabels[role]} />
        <span style={{ fontSize: 11, color: '#96aed2' }}>({youLabel})</span>
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
          {APP_ROLES.map(r => (
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
  )
}

export function RolesManager({ members, currentUserId, isAdmin }: {
  members: Member[]
  currentUserId: string
  isAdmin: boolean
}) {
  const t = useTranslations('roles')

  const roleLabels: Record<AppRole, string> = {
    admin: t('admin.label'),
    techniker: t('techniker.label'),
    leser: t('leser.label'),
  }

  const roleDescriptions: Record<AppRole, string> = {
    admin: t('admin.description'),
    techniker: t('techniker.description'),
    leser: t('leser.description'),
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>

      {/* Rollen-Erklärung */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
        {APP_ROLES.map(role => (
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
                {roleLabels[role]}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#666' }}>
                {roleDescriptions[role]}
              </p>
            </div>
          </div>
        ))}
      </div>

      {!isAdmin && (
        <p style={{ fontSize: 12, color: '#96aed2', textAlign: 'center', marginTop: 16 }}>
          {t('onlyAdmins')}
        </p>
      )}
    </div>
  )
}
