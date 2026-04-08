import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { UserAdminActions } from './user-admin-actions'

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, organization_id, is_active, must_change_password, last_seen_at, created_at, organizations(id, name)')
    .eq('id', id)
    .single()

  if (!profile) notFound()

  const org = profile.organizations as { id: string; name: string } | null

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ marginBottom: 24 }}>
        <Link href="/admin/users" style={{ color: '#6b7280', fontSize: 13, textDecoration: 'none' }}>
          ← Nutzer
        </Link>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: 'white', margin: '8px 0 4px' }}>
          {profile.full_name ?? profile.email}
        </h1>
        <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{profile.email}</p>
      </div>

      <div style={{ background: '#111827', borderRadius: 14, border: '1px solid #1f2937', padding: '20px', marginBottom: 16 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px' }}>Details</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            ['Organisation', org ? <Link key="org" href={`/admin/orgs/${org.id}`} style={{ color: '#0099cc', textDecoration: 'none' }}>{org.name}</Link> : '–'],
            ['Erstellt', new Date(profile.created_at).toLocaleDateString('de-DE')],
            ['Zuletzt aktiv', profile.last_seen_at ? new Date(profile.last_seen_at).toLocaleDateString('de-DE') : '–'],
            ['PW-Änderung', profile.must_change_password ? 'ausstehend' : 'OK'],
            ['Status', profile.is_active !== false ? 'aktiv' : 'gesperrt'],
          ].map(([label, value]) => (
            <div key={String(label)}>
              <p style={{ margin: '0 0 2px', fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
              <p style={{ margin: 0, fontSize: 14, color: 'white' }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      <UserAdminActions
        userId={id}
        isActive={profile.is_active !== false}
        mustChangePassword={profile.must_change_password ?? false}
      />
    </div>
  )
}
