import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { OrgEditForm } from './org-edit-form'
import { DeleteOrgButton } from './delete-org-button'
import { FeatureToggles } from './feature-toggles'
import { ImageCompressionSettings } from './image-compression-settings'
import { DocumentUploadSettings } from './document-upload-settings'

export default async function AdminOrgDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const [{ data: org }, { data: members }, { data: assets }] = await Promise.all([
    supabase
      .from('organizations')
      .select('id, name, slug, plan, asset_limit, user_limit, is_active, contact_email, notes, created_at, features, settings')
      .eq('id', id)
      .single(),
    supabase
      .from('organization_members')
      .select('id, email, user_id, created_at, roles(name)')
      .eq('organization_id', id)
      .order('created_at'),
    supabase
      .from('assets')
      .select('id, title, status, created_at')
      .eq('organization_id', id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  if (!org) notFound()

  const { data: userProfiles } = await supabase
    .from('profiles')
    .select('id, email, full_name, is_active, must_change_password, last_seen_at, app_role')
    .eq('organization_id', id)

  const profileMap: Record<string, { full_name: string | null; is_active: boolean | null; must_change_password: boolean | null; last_seen_at: string | null; app_role: string | null }> = {}
  for (const p of userProfiles ?? []) {
    profileMap[p.id] = { full_name: p.full_name, is_active: p.is_active, must_change_password: p.must_change_password, last_seen_at: p.last_seen_at, app_role: p.app_role }
  }

  const ROLE_LABELS: Record<string, { label: string; color: string }> = {
    superadmin:  { label: 'Superadmin', color: '#a78bfa' },
    admin:       { label: 'Admin',      color: '#ffd700' },
    technician:  { label: 'Techniker',  color: '#a8b2c0' },
    viewer:      { label: 'Leser',      color: '#cd7f32' },
    member:      { label: 'Member',     color: '#9ca3af' },
  }

  return (
    <div>
      {/* Header */}
      <div className="adm-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Link href="/admin/orgs" style={{ color: 'var(--adm-text3)', fontSize: 13, textDecoration: 'none' }}>
              ← Organisationen
            </Link>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--adm-text)', margin: '0 0 4px' }}>{org.name}</h1>
          <p style={{ fontSize: 12, color: 'var(--adm-text3)', margin: 0 }}>Slug: {org.slug}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <a href={`/admin/view/${id}`} style={{
            background: 'var(--adm-border2)', color: 'var(--adm-text5)',
            padding: '10px 18px', borderRadius: 50, textDecoration: 'none',
            fontSize: 13, fontWeight: 600, border: '1px solid var(--adm-border2)',
            whiteSpace: 'nowrap',
          }}>
            Als Kunde ansehen →
          </a>
          <DeleteOrgButton orgId={id} orgName={org.name} />
        </div>
      </div>

      <div className="rg-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Org bearbeiten */}
        <div>
          <OrgEditForm org={org} />
          <FeatureToggles
            orgId={id}
            features={(org.features as Record<string, boolean>) ?? { serviceheft: true, wartung: true }}
          />
          <ImageCompressionSettings
            orgId={id}
            settings={(org.settings as Record<string, unknown>) ?? null}
          />
          <DocumentUploadSettings
            orgId={id}
            settings={(org.settings as Record<string, unknown>) ?? null}
          />
        </div>

        {/* Nutzer */}
        <div>
          <div style={{ background: 'var(--adm-surface)', borderRadius: 14, border: '1px solid var(--adm-border)', overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--adm-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--adm-text)', margin: 0 }}>Nutzer ({(members ?? []).length})</h2>
              <Link href={`/admin/orgs/${id}/nutzer-anlegen`} style={{ fontSize: 12, color: '#0099cc', textDecoration: 'none' }}>+ Anlegen</Link>
            </div>
            {(members ?? []).map(m => {
              const p = m.user_id ? profileMap[m.user_id] : null
              return (
                <div key={m.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--adm-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--adm-text)' }}>{p?.full_name ?? m.email}</p>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--adm-text3)' }}>{m.email}</p>
                    {p?.must_change_password && (
                      <span style={{ fontSize: 10, background: '#451a03', color: '#f59e0b', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                        PW-Änderung ausstehend
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    {(() => {
                      const role = p?.app_role ?? null
                      const r = role ? ROLE_LABELS[role] : null
                      return (
                        <span style={{ fontSize: 11, fontWeight: 700, color: r?.color ?? 'var(--adm-text3)' }}>
                          {r?.label ?? '–'}
                        </span>
                      )
                    })()}
                    {m.user_id && (
                      <Link href={`/admin/users/${m.user_id}`} style={{ fontSize: 11, color: '#0099cc', textDecoration: 'none' }}>
                        Verwalten
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
            {(members ?? []).length === 0 && (
              <p style={{ padding: '20px', color: 'var(--adm-text3)', fontSize: 13, textAlign: 'center', margin: 0 }}>Keine Nutzer</p>
            )}
          </div>

          {/* Assets */}
          <div style={{ background: 'var(--adm-surface)', borderRadius: 14, border: '1px solid var(--adm-border)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--adm-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--adm-text)', margin: 0 }}>Letzte Assets ({(assets ?? []).length})</h2>
              <Link href={`/admin/orgs/${id}/assets/neu`} style={{ fontSize: 12, color: '#0099cc', textDecoration: 'none' }}>+ Asset anlegen</Link>
            </div>
            {(assets ?? []).map(a => (
              <div key={a.id} style={{ padding: '10px 20px', borderBottom: '1px solid var(--adm-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--adm-text)' }}>{a.title}</p>
                <span style={{ fontSize: 11, color: 'var(--adm-text3)' }}>{a.status}</span>
              </div>
            ))}
            {(assets ?? []).length === 0 && (
              <p style={{ padding: '20px', color: 'var(--adm-text3)', fontSize: 13, textAlign: 'center', margin: 0 }}>Keine Assets</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
