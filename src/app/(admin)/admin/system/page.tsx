import { createAdminClient } from '@/lib/supabase/admin'

export default async function AdminSystemPage() {
  const supabase = createAdminClient()

  const [
    { count: totalOrgs },
    { count: activeOrgs },
    { count: totalUsers },
    { count: totalAssets },
    { count: totalDocs },
    { count: totalServiceEntries },
    { count: pendingPwChange },
    { data: recentLogs },
  ] = await Promise.all([
    supabase.from('organizations').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('organizations').select('*', { count: 'exact', head: true }).eq('is_active', true).is('deleted_at', null),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('assets').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('asset_documents').select('*', { count: 'exact', head: true }),
    supabase.from('service_entries').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('must_change_password', true),
    supabase.from('admin_audit_log')
      .select('admin_id, action, target_type, created_at')
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const statRow = (label: string, value: number | null, sub?: string, alert = false) => (
    <div style={{
      background: '#111827', borderRadius: 10, padding: '16px 18px',
      border: `1px solid ${alert && (value ?? 0) > 0 ? '#451a03' : '#1f2937'}`,
    }}>
      <p style={{ margin: '0 0 4px', fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
        {label}
      </p>
      <p style={{ margin: 0, fontSize: 28, fontWeight: 900, color: alert && (value ?? 0) > 0 ? '#f59e0b' : 'white', lineHeight: 1 }}>
        {value ?? 0}
      </p>
      {sub && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#4b5563' }}>{sub}</p>}
    </div>
  )

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: 'white', margin: '0 0 4px' }}>System-Status</h1>
        <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
          Stand: {new Date().toLocaleString('de-DE')}
        </p>
      </div>

      {/* DB Stats */}
      <h2 style={{ fontSize: 12, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>
        Datenbank
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 28 }}>
        {statRow('Organisationen', totalOrgs, `${activeOrgs} aktiv`)}
        {statRow('Nutzer', totalUsers)}
        {statRow('Assets', totalAssets)}
        {statRow('Service-Einträge', totalServiceEntries)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 32 }}>
        {statRow('Dokumente', totalDocs)}
        {statRow('PW-Änderung ausstehend', pendingPwChange, 'Nutzer müssen PW ändern', true)}
        {statRow('Inaktive Orgs', (totalOrgs ?? 0) - (activeOrgs ?? 0), 'gesperrt oder inaktiv')}
        {statRow('Gelöschte Assets', 0, 'hard-deleted (kein Zähler)')}
      </div>

      {/* Audit Log */}
      <h2 style={{ fontSize: 12, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>
        Admin-Audit-Log (letzte 20)
      </h2>
      <div style={{ background: '#111827', borderRadius: 14, border: '1px solid #1f2937', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '10px 20px', borderBottom: '1px solid #1f2937' }}>
          {['Aktion', 'Ziel', 'Zeit'].map(h => (
            <p key={h} style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</p>
          ))}
        </div>
        {(recentLogs ?? []).map((log, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '10px 20px', borderBottom: '1px solid #1f2937' }}>
            <p style={{ margin: 0, fontSize: 13, color: 'white', fontWeight: 600 }}>{log.action}</p>
            <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>{log.target_type ?? '–'}</p>
            <p style={{ margin: 0, fontSize: 11, color: '#6b7280' }}>
              {new Date(log.created_at).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        ))}
        {(recentLogs ?? []).length === 0 && (
          <p style={{ padding: '20px', color: '#6b7280', fontSize: 13, textAlign: 'center', margin: 0 }}>
            Keine Logs vorhanden
          </p>
        )}
      </div>
    </div>
  )
}
