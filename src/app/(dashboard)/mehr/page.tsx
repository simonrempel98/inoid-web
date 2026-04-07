import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { LogoutButton } from '@/components/logout-button'
import { User, Building2, Users, KeyRound, CreditCard, LogOut, MapPin, Layers } from 'lucide-react'

const chevron = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="#96aed2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)

function MenuCard({ items }: { items: { href: string; label: string; icon: React.ReactNode }[] }) {
  return (
    <div style={{
      background: 'white', borderRadius: 14,
      border: '1px solid #c8d4e8',
      overflow: 'hidden',
    }}>
      {items.map((item, i) => (
        <div key={item.href}>
          {i > 0 && <div style={{ height: 1, background: '#c8d4e8', margin: '0 16px' }} />}
          <Link href={item.href} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', textDecoration: 'none', color: '#000000',
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

export default async function MehrPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, organization_id')
    .eq('id', user!.id)
    .single()

  const { data: org } = await supabase
    .from('organizations')
    .select('name, plan, asset_limit')
    .eq('id', profile?.organization_id ?? '')
    .single()

  const planLabel: Record<string, string> = {
    free: 'Free', starter: 'Starter', professional: 'Professional',
    enterprise: 'Enterprise', custom: 'Custom',
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
            backgroundColor: '#0099cc',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 700,
          }}>
            {(profile?.full_name ?? user?.email ?? 'U')[0].toUpperCase()}
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 16, margin: '0 0 2px' }}>
              {profile?.full_name ?? 'Kein Name'}
            </p>
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

      {/* Organisationsverwaltung */}
      <div style={{ marginBottom: 20 }}>
        <SectionLabel label="Organisationsverwaltung" />
        <MenuCard items={[
          { href: '/organisation', label: 'Standorte & Struktur', icon: <MapPin size={18} /> },
          { href: '/teams', label: 'Teams', icon: <Layers size={18} /> },
          { href: '/settings/invite', label: 'Einladungen', icon: <Users size={18} /> },
          { href: '/settings/roles', label: 'Rollen & Rechte', icon: <KeyRound size={18} /> },
        ]} />
      </div>

      {/* Konto */}
      <div style={{ marginBottom: 20 }}>
        <SectionLabel label="Konto" />
        <MenuCard items={[
          { href: '/settings/profile', label: 'Mein Profil', icon: <User size={18} /> },
          { href: '/settings/organization', label: 'Organisation', icon: <Building2 size={18} /> },
        ]} />
      </div>

      {/* Abonnement */}
      <div style={{ marginBottom: 20 }}>
        <SectionLabel label="Abonnement" />
        <MenuCard items={[
          { href: '/settings/billing', label: 'Plan & Abrechnung', icon: <CreditCard size={18} /> },
        ]} />
      </div>

      {/* Abmelden */}
      <div style={{
        background: 'white', borderRadius: 14,
        border: '1px solid #c8d4e8', padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <LogOut size={18} />
        <LogoutButton />
      </div>
    </div>
  )
}
