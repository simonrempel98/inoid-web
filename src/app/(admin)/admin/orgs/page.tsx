import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

export default async function AdminOrgsPage() {
  const supabase = createAdminClient()

  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name, slug, plan, asset_limit, user_limit, is_active, created_at, contact_email')
    .order('created_at', { ascending: false })

  const { data: memberCounts } = await supabase
    .from('organization_members')
    .select('organization_id')

  const { data: assetCounts } = await supabase
    .from('assets')
    .select('organization_id')
    .is('deleted_at', null)

  const membersPerOrg: Record<string, number> = {}
  for (const m of memberCounts ?? []) {
    membersPerOrg[m.organization_id] = (membersPerOrg[m.organization_id] ?? 0) + 1
  }
  const assetsPerOrg: Record<string, number> = {}
  for (const a of assetCounts ?? []) {
    assetsPerOrg[a.organization_id] = (assetsPerOrg[a.organization_id] ?? 0) + 1
  }

  const planColor = (plan: string) => ({
    enterprise: { bg: '#451a03', color: '#f59e0b' },
    professional: { bg: '#064e3b', color: '#34d399' },
    starter: { bg: '#1e3a5f', color: '#60a5fa' },
    free: { bg: '#1f2937', color: '#9ca3af' },
    custom: { bg: '#3b1f5f', color: '#a78bfa' },
  }[plan] ?? { bg: '#1f2937', color: '#9ca3af' })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'white', margin: '0 0 4px' }}>Organisationen</h1>
          <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>{(orgs ?? []).length} Tenants gesamt</p>
        </div>
        <Link href="/admin/orgs/neu" style={{
          background: '#003366', color: 'white', padding: '10px 20px',
          borderRadius: 50, textDecoration: 'none', fontSize: 14, fontWeight: 700,
        }}>
          + Neue Organisation
        </Link>
      </div>

      <div style={{ background: '#111827', borderRadius: 14, border: '1px solid #1f2937', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 1fr 80px 80px 80px 60px',
          padding: '10px 20px', borderBottom: '1px solid #1f2937',
        }}>
          {['Organisation', 'Plan', 'Assets', 'Nutzer', 'Limit', 'Status'].map(h => (
            <p key={h} style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</p>
          ))}
        </div>

        {(orgs ?? []).map(org => {
          const pc = planColor(org.plan)
          const assetCount = assetsPerOrg[org.id] ?? 0
          const memberCount = membersPerOrg[org.id] ?? 0
          return (
            <Link key={org.id} href={`/admin/orgs/${org.id}`} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 80px 80px 80px 60px',
                padding: '14px 20px', borderBottom: '1px solid #1f2937',
                alignItems: 'center',
              }}>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'white' }}>{org.name}</p>
                  <p style={{ margin: 0, fontSize: 11, color: '#6b7280' }}>{org.slug}</p>
                </div>
                <span style={{
                  display: 'inline-block', fontSize: 11, fontWeight: 700,
                  padding: '3px 10px', borderRadius: 20,
                  background: pc.bg, color: pc.color,
                }}>
                  {org.plan}
                </span>
                <p style={{ margin: 0, fontSize: 14, color: '#d1d5db' }}>
                  {assetCount}<span style={{ color: '#4b5563', fontSize: 11 }}>/{org.asset_limit}</span>
                </p>
                <p style={{ margin: 0, fontSize: 14, color: '#d1d5db' }}>
                  {memberCount}<span style={{ color: '#4b5563', fontSize: 11 }}>/{org.user_limit ?? '∞'}</span>
                </p>
                <p style={{ margin: 0, fontSize: 11, color: '#6b7280' }}>
                  {new Date(org.created_at).toLocaleDateString('de-DE')}
                </p>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: org.is_active !== false ? '#34d399' : '#6b7280',
                  display: 'inline-block',
                }} />
              </div>
            </Link>
          )
        })}

        {(orgs ?? []).length === 0 && (
          <p style={{ padding: '40px', color: '#6b7280', fontSize: 14, textAlign: 'center', margin: 0 }}>
            Noch keine Organisationen
          </p>
        )}
      </div>
    </div>
  )
}
