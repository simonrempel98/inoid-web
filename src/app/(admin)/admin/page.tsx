import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

export default async function AdminDashboardPage() {
  const supabase = createAdminClient()

  // Alle KPIs parallel laden
  const [
    { count: orgCount },
    { count: userCount },
    { count: assetCount },
    { count: activeOrgCount },
    { data: planStats },
    { data: recentOrgs },
    { data: recentActivity },
    { data: storageData },
  ] = await Promise.all([
    supabase.from('organizations').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('assets').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('organizations').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('organizations').select('plan'),
    supabase.from('organizations')
      .select('id, name, plan, asset_limit, user_limit, created_at, is_active')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('admin_audit_log')
      .select('action, target_type, details, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
    // Grober Speicher-Schätzwert via asset_documents
    supabase.from('asset_documents').select('*', { count: 'exact', head: true }),
  ])

  // Plan-Verteilung berechnen
  const planCounts: Record<string, number> = {}
  for (const row of planStats ?? []) {
    planCounts[row.plan] = (planCounts[row.plan] ?? 0) + 1
  }

  const kpiCard = (label: string, value: string | number, sub?: string, color = '#003366') => (
    <div style={{
      background: 'var(--adm-surface)', borderRadius: 14, padding: '20px 22px',
      border: '1px solid var(--adm-border)',
    }}>
      <p style={{ fontSize: 11, color: 'var(--adm-text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>
        {label}
      </p>
      <p style={{ fontSize: 32, fontWeight: 900, color, margin: '0 0 4px', lineHeight: 1 }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: 12, color: 'var(--adm-text3)', margin: 0 }}>{sub}</p>}
    </div>
  )

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--adm-text)', margin: '0 0 4px' }}>Admin Dashboard</h1>
        <p style={{ fontSize: 13, color: 'var(--adm-text3)', margin: 0 }}>
          Plattform-Übersicht — {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {kpiCard('Organisationen', orgCount ?? 0, `${activeOrgCount ?? 0} aktiv`, '#60a5fa')}
        {kpiCard('Nutzer gesamt', userCount ?? 0, 'alle Tenants', '#34d399')}
        {kpiCard('Assets gesamt', assetCount ?? 0, 'nicht gelöscht', '#f59e0b')}
        {kpiCard('Aktive Orgs', activeOrgCount ?? 0, `von ${orgCount ?? 0} gesamt`, '#a78bfa')}
      </div>

      {/* Zweite Reihe */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32 }}>
        {kpiCard('Free', planCounts['free'] ?? 0, 'Orgs', '#9ca3af')}
        {kpiCard('Starter', planCounts['starter'] ?? 0, 'Orgs', '#60a5fa')}
        {kpiCard('Professional', planCounts['professional'] ?? 0, 'Orgs', '#34d399')}
        {kpiCard('Enterprise', planCounts['enterprise'] ?? 0, 'Orgs', '#f59e0b')}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Neueste Organisationen */}
        <div style={{ background: 'var(--adm-surface)', borderRadius: 14, border: '1px solid var(--adm-border)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--adm-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--adm-text)', margin: 0 }}>Neueste Organisationen</h2>
            <Link href="/admin/orgs" style={{ fontSize: 12, color: '#0099cc', textDecoration: 'none' }}>Alle →</Link>
          </div>
          <div>
            {(recentOrgs ?? []).map(org => (
              <Link key={org.id} href={`/admin/orgs/${org.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  borderBottom: '1px solid var(--adm-border)',
                }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--adm-text)' }}>{org.name}</p>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--adm-text3)' }}>
                      {new Date(org.created_at).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                      background: org.plan === 'enterprise' ? '#451a03' : org.plan === 'professional' ? '#064e3b' : org.plan === 'starter' ? '#1e3a5f' : '#1f2937',
                      color: org.plan === 'enterprise' ? '#f59e0b' : org.plan === 'professional' ? '#34d399' : org.plan === 'starter' ? '#60a5fa' : '#6b7280',
                    }}>
                      {org.plan}
                    </span>
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: org.is_active ? '#34d399' : '#6b7280',
                      display: 'inline-block',
                    }} />
                  </div>
                </div>
              </Link>
            ))}
            {(recentOrgs ?? []).length === 0 && (
              <p style={{ padding: '20px', color: 'var(--adm-text3)', fontSize: 13, textAlign: 'center', margin: 0 }}>
                Keine Organisationen
              </p>
            )}
          </div>
        </div>

        {/* Admin-Audit-Log */}
        <div style={{ background: 'var(--adm-surface)', borderRadius: 14, border: '1px solid var(--adm-border)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--adm-border)' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--adm-text)', margin: 0 }}>Letzte Admin-Aktionen</h2>
          </div>
          <div>
            {(recentActivity ?? []).length === 0 ? (
              <p style={{ padding: '20px', color: 'var(--adm-text3)', fontSize: 13, textAlign: 'center', margin: 0 }}>
                Noch keine Aktionen
              </p>
            ) : (
              (recentActivity ?? []).map((log, i) => (
                <div key={i} style={{ padding: '10px 20px', borderBottom: '1px solid var(--adm-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--adm-text)' }}>{log.action}</p>
                      {log.details && (log.details as any).name && (
                        <p style={{ margin: 0, fontSize: 11, color: 'var(--adm-text3)' }}>{(log.details as any).name}</p>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--adm-text4)' }}>
                      {new Date(log.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Quick Actions */}
      <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
        <Link href="/admin/orgs/neu" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: '#003366', color: 'white',
          padding: '12px 20px', borderRadius: 50, textDecoration: 'none',
          fontSize: 14, fontWeight: 700,
        }}>
          + Neue Organisation anlegen
        </Link>
      </div>
    </div>
  )
}
