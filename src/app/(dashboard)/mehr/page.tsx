import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { LogoutButton } from '@/components/logout-button'
import { User, KeyRound, CreditCard, LogOut, BookOpen, Crown, Shield } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { ROLE_COLORS, ROLE_BG, type AppRole } from '@/lib/permissions'

const chevron = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="#96aed2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)

function MenuCard({ items }: { items: { href: string; label: string; icon: React.ReactNode }[] }) {
  return (
    <div style={{
      background: 'var(--ds-surface)', borderRadius: 14,
      border: '1px solid var(--ds-border)',
      overflow: 'hidden',
    }}>
      {items.map((item, i) => (
        <div key={item.href}>
          {i > 0 && <div style={{ height: 1, background: '#c8d4e8', margin: '0 16px' }} />}
          <Link href={item.href} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', textDecoration: 'none', color: 'var(--ds-text)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>
              <span style={{ fontSize: 15, fontFamily: 'Arial, sans-serif' }}>{item.label}</span>
            </div>
            {chevron}
          </Link>
        </div>
      ))}
    </div>
  )
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p style={{
      fontSize: 11, fontWeight: 700, color: '#666666',
      textTransform: 'uppercase', letterSpacing: '0.06em',
      margin: '0 0 8px 4px',
    }}>
      {label}
    </p>
  )
}

const ROLE_ICON: Record<AppRole, React.ReactNode> = {
  superadmin: <Crown size={11} />,
  admin:      <Shield size={11} />,
  techniker:  <Shield size={11} />,
  leser:      <Shield size={11} />,
}

export default async function MehrPage() {
  const supabase = await createClient()
  const t = await getTranslations()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, organization_id, app_role')
    .eq('id', user!.id)
    .single()

  const { data: org } = await supabase
    .from('organizations')
    .select('name, plan, asset_limit')
    .eq('id', profile?.organization_id ?? '')
    .single()

  const appRole = (profile?.app_role as AppRole) ?? 'leser'

  const planLabel: Record<string, string> = {
    free: 'Free', starter: 'Starter', professional: 'Professional',
    enterprise: 'Enterprise', custom: 'Custom',
  }

  const roleLabel: Record<AppRole, string> = {
    superadmin: t('roles.superadmin.label'),
    admin:      t('roles.admin.label'),
    techniker:  t('roles.techniker.label'),
    leser:      t('roles.leser.label'),
  }

  return (
    <div style={{ padding: '24px 16px', fontFamily: 'Arial, sans-serif', maxWidth: 480 }}>
      {/* User Card */}
      <div style={{
        background: '#003366', borderRadius: 16, padding: '20px',
        marginBottom: 24, color: 'white',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            backgroundColor: ROLE_COLORS[appRole] ?? '#0099cc',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 700,
          }}>
            {(profile?.full_name ?? user?.email ?? 'U')[0].toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <p style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>
                {profile?.full_name ?? user?.email}
              </p>
              {/* Rollen-Badge */}
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 10, fontWeight: 700,
                padding: '2px 8px', borderRadius: 20,
                backgroundColor: ROLE_BG[appRole],
                color: ROLE_COLORS[appRole],
              }}>
                {ROLE_ICON[appRole]}
                {roleLabel[appRole]}
              </span>
            </div>
            <p style={{ fontSize: 12, opacity: 0.7, margin: 0 }}>{user?.email}</p>
          </div>
        </div>
        {org && (
          <div style={{
            marginTop: 14, paddingTop: 14,
            borderTop: '1px solid rgba(150,174,210,0.3)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 13, opacity: 0.8 }}>{org.name}</span>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '3px 10px',
              borderRadius: 20, backgroundColor: '#0099cc',
            }}>
              {planLabel[org.plan] ?? org.plan}
            </span>
          </div>
        )}
      </div>

      {/* Einstellungen */}
      <div style={{ marginBottom: 20 }}>
        <SectionLabel label={t('settings.title')} />
        <MenuCard items={[
          { href: '/settings/profile', label: t('settings.profile.title'), icon: <User size={18} /> },
          { href: '/settings/roles', label: t('nav.roles'), icon: <KeyRound size={18} /> },
          { href: '/settings/billing', label: t('settings.billing.title'), icon: <CreditCard size={18} /> },
        ]} />
      </div>

      {/* Hilfe */}
      <div style={{ marginBottom: 20 }}>
        <SectionLabel label={t('mehr.help')} />
        <MenuCard items={[
          { href: '/docs', label: t('docs.title'), icon: <BookOpen size={18} /> },
        ]} />
      </div>

      {/* Abmelden */}
      <div style={{
        background: 'var(--ds-surface)', borderRadius: 14,
        border: '1px solid var(--ds-border)', padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <LogOut size={18} />
        <LogoutButton />
      </div>
    </div>
  )
}
