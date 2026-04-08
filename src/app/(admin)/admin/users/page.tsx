import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

export default async function AdminUsersPage() {
  const supabase = createAdminClient()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, full_name, organization_id, is_active, must_change_password, last_seen_at, created_at, organizations(name)')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: 'white', margin: '0 0 4px' }}>Nutzer</h1>
        <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>{(profiles ?? []).length} Nutzer gesamt</p>
      </div>

      <div style={{ background: '#111827', borderRadius: 14, border: '1px solid #1f2937', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 80px 80px', padding: '10px 20px', borderBottom: '1px solid #1f2937' }}>
          {['Nutzer', 'Organisation', 'Zuletzt aktiv', 'PW', 'Status'].map(h => (
            <p key={h} style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</p>
          ))}
        </div>

        {(profiles ?? []).map(p => (
          <Link key={p.id} href={`/admin/users/${p.id}`} style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 80px 80px',
              padding: '12px 20px', borderBottom: '1px solid #1f2937',
              alignItems: 'center', cursor: 'pointer',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#1f2937')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'white' }}>{p.full_name ?? p.email}</p>
                {p.full_name && <p style={{ margin: 0, fontSize: 11, color: '#6b7280' }}>{p.email}</p>}
              </div>
              <p style={{ margin: 0, fontSize: 13, color: '#9ca3af' }}>
                {(p.organizations as { name?: string } | null)?.name ?? <span style={{ color: '#4b5563' }}>–</span>}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: '#6b7280' }}>
                {p.last_seen_at ? new Date(p.last_seen_at).toLocaleDateString('de-DE') : '–'}
              </p>
              {p.must_change_password ? (
                <span style={{ fontSize: 10, background: '#451a03', color: '#f59e0b', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                  ausstehend
                </span>
              ) : (
                <span style={{ fontSize: 11, color: '#4b5563' }}>OK</span>
              )}
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: p.is_active !== false ? '#34d399' : '#6b7280',
                display: 'inline-block',
              }} />
            </div>
          </Link>
        ))}

        {(profiles ?? []).length === 0 && (
          <p style={{ padding: '40px', color: '#6b7280', fontSize: 14, textAlign: 'center', margin: 0 }}>
            Keine Nutzer
          </p>
        )}
      </div>
    </div>
  )
}
