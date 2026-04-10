import { createAdminClient } from '@/lib/supabase/admin'
import { CleanupButton } from './cleanup-button'
import { OrgStorageNukeButton } from './org-storage-nuke-button'
import { OrphanedStorageButton } from './orphaned-storage-button'

// ── Typen ─────────────────────────────────────────────────────────────────────

type SupabaseStatus = { status: { indicator: string; description: string } }
type VercelStatus   = { status: { indicator: string; description: string } }
type OrgStorageRow  = {
  organization_id: string; organization_name: string; org_slug: string
  image_count: number; document_count: number; service_entry_count: number
  asset_image_bytes: number; asset_doc_bytes: number
  service_photo_bytes: number; service_doc_bytes: number; area_file_bytes: number
  storage_bytes: number
}
type UnattributedRow = { bucket_id: string; file_path: string; bytes: number }
type BucketRow      = { bucket_id: string; file_count: number; total_bytes: number }

// ── Hilfsfunktionen ───────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function statusColor(indicator: string) {
  if (indicator === 'none') return { bg: '#052e16', text: '#4ade80', dot: '#22c55e', label: 'Betrieb normal' }
  if (indicator === 'minor') return { bg: '#451a03', text: '#fbbf24', dot: '#f59e0b', label: 'Beeinträchtigung' }
  if (indicator === 'major') return { bg: '#450a0a', text: '#f87171', dot: '#ef4444', label: 'Teilausfall' }
  return { bg: '#1f2937', text: '#6b7280', dot: '#4b5563', label: 'Unbekannt' }
}

// ── Seite ─────────────────────────────────────────────────────────────────────

export default async function AdminSystemPage() {
  const supabase = createAdminClient()

  // DB-Stats
  const [
    { count: totalOrgs },
    { count: activeOrgs },
    { count: totalUsers },
    { count: totalAssets },
    { count: totalDocs },
    { count: totalServiceEntries },
    { count: pendingPwChange },
    { count: softDeletedAssets },
    { data: recentLogs },
  ] = await Promise.all([
    supabase.from('organizations').select('*', { count: 'exact', head: true }),
    supabase.from('organizations').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('assets').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('asset_documents').select('*', { count: 'exact', head: true }),
    supabase.from('asset_lifecycle_events').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('must_change_password', true),
    supabase.from('assets').select('*', { count: 'exact', head: true }).not('deleted_at', 'is', null),
    supabase.from('admin_audit_log')
      .select('admin_id, action, target_type, created_at')
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  // Storage-Stats
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: orgStorage } = await (supabase as any).rpc('admin_get_org_storage_stats') as { data: OrgStorageRow[] | null }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: bucketStats } = await (supabase as any).rpc('admin_get_bucket_stats') as { data: BucketRow[] | null }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: unattributed } = await (supabase as any).rpc('admin_get_unattributed_storage') as { data: UnattributedRow[] | null }

  // Externe Status-APIs (graceful fallback)
  let supabaseStatus: SupabaseStatus | null = null
  let vercelStatus: VercelStatus | null = null
  try {
    const [sb, vc] = await Promise.all([
      fetch('https://status.supabase.com/api/v2/status.json', { cache: 'no-store' }),
      fetch('https://www.vercel-status.com/api/v2/status.json', { cache: 'no-store' }),
    ])
    if (sb.ok) supabaseStatus = await sb.json()
    if (vc.ok) vercelStatus = await vc.json()
  } catch {
    // Status-APIs nicht erreichbar – ignorieren
  }

  // Aktuelles Vercel-Deployment (automatische Env-Vars)
  const deployment = {
    sha:     process.env.VERCEL_GIT_COMMIT_SHA     ?? null,
    message: process.env.VERCEL_GIT_COMMIT_MESSAGE ?? null,
    author:  process.env.VERCEL_GIT_COMMIT_AUTHOR_NAME ?? null,
    branch:  process.env.VERCEL_GIT_BRANCH         ?? null,
    url:     process.env.VERCEL_URL                 ?? null,
    env:     process.env.VERCEL_ENV                 ?? null,
    id:      process.env.VERCEL_DEPLOYMENT_ID       ?? null,
  }
  const isVercel = !!deployment.sha

  // Totals
  const totalStorageBytes = (bucketStats ?? []).reduce((s, b) => s + (b.total_bytes ?? 0), 0)

  // ── Render ──────────────────────────────────────────────────────────────────

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h2 style={{ fontSize: 12, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>
      {children}
    </h2>
  )

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

      {/* ── Service-Status ──────────────────────────────────────────────────── */}
      <SectionTitle>Service-Status</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 32 }}>

        {/* Supabase */}
        {(() => {
          const s = statusColor(supabaseStatus?.status.indicator ?? 'unknown')
          return (
            <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 14, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="22" height="22" viewBox="0 0 109 113" fill="none">
                  <path d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z" fill="#3ecf8e"/>
                  <path d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z" fill="url(#a)" fillOpacity="0.2"/>
                  <path d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.041L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4175L45.317 2.07103Z" fill="#3ecf8e"/>
                  <defs><linearGradient id="a" x1="53.9738" y1="40.0627" x2="99.1935" y2="40.0627" gradientUnits="userSpaceOnUse"><stop stopColor="white"/><stop offset="1" stopColor="white" stopOpacity="0"/></linearGradient></defs>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: 'white' }}>Supabase</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.dot }} />
                  <span style={{ fontSize: 12, color: s.text, fontWeight: 600 }}>
                    {supabaseStatus ? (supabaseStatus.status.description || s.label) : 'Nicht erreichbar'}
                  </span>
                </div>
              </div>
              <a href="https://status.supabase.com" target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#4b5563', textDecoration: 'none' }}>status.supabase.com →</a>
            </div>
          )
        })()}

        {/* Vercel */}
        {(() => {
          const s = statusColor(vercelStatus?.status.indicator ?? 'unknown')
          return (
            <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 14, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="22" height="22" viewBox="0 0 76 65" fill="white">
                  <path d="M37.5274 0L75.0548 65H0L37.5274 0Z"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: 'white' }}>Vercel</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.dot }} />
                  <span style={{ fontSize: 12, color: s.text, fontWeight: 600 }}>
                    {vercelStatus ? (vercelStatus.status.description || s.label) : 'Nicht erreichbar'}
                  </span>
                </div>
              </div>
              <a href="https://www.vercel-status.com" target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#4b5563', textDecoration: 'none' }}>vercel-status.com →</a>
            </div>
          )
        })()}
      </div>

      {/* ── Aktives Deployment ─────────────────────────────────────────────── */}
      <SectionTitle>Aktives Deployment</SectionTitle>
      <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 14, padding: '20px', marginBottom: 32 }}>
        {isVercel ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: 11, color: '#4b5563', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Umgebung</p>
              <span style={{
                fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                background: deployment.env === 'production' ? '#052e16' : '#1e3a5f',
                color: deployment.env === 'production' ? '#4ade80' : '#60a5fa',
              }}>
                {deployment.env ?? '–'}
              </span>
            </div>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: 11, color: '#4b5563', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Branch</p>
              <p style={{ margin: 0, fontSize: 13, color: '#9ca3af', fontFamily: 'monospace' }}>{deployment.branch ?? '–'}</p>
            </div>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: 11, color: '#4b5563', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Deployment-URL</p>
              {deployment.url ? (
                <a href={`https://${deployment.url}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#0099cc', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {deployment.url}
                </a>
              ) : <p style={{ margin: 0, fontSize: 12, color: '#4b5563' }}>–</p>}
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <p style={{ margin: '0 0 4px', fontSize: 11, color: '#4b5563', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Commit</p>
              <p style={{ margin: '0 0 4px', fontSize: 13, color: 'white', fontWeight: 600 }}>{deployment.message ?? '–'}</p>
              <p style={{ margin: 0, fontSize: 11, color: '#6b7280' }}>
                {deployment.author ?? ''}{deployment.sha ? ` · ${deployment.sha.slice(0, 8)}` : ''}
              </p>
            </div>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: 11, color: '#4b5563', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Deployment-ID</p>
              <p style={{ margin: 0, fontSize: 11, color: '#6b7280', fontFamily: 'monospace', wordBreak: 'break-all' }}>{deployment.id ?? '–'}</p>
            </div>
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
            Deployment-Infos nur in der Vercel-Produktionsumgebung verfügbar.
          </p>
        )}
      </div>

      {/* ── Cleanup-Alert ───────────────────────────────────────────────────── */}
      {(softDeletedAssets ?? 0) > 0 && (
        <div style={{
          background: '#451a03', borderRadius: 12, border: '1px solid #92400e',
          padding: '16px 20px', marginBottom: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#fbbf24', fontSize: 14 }}>
              {softDeletedAssets} soft-gelöschte Assets gefunden
            </p>
            <p style={{ margin: 0, fontSize: 12, color: '#d97706' }}>
              Diese zeigen noch Kosten &amp; Wartungsvorgänge im Dashboard. Bereinigung löscht sie unwiderruflich.
            </p>
          </div>
          <CleanupButton count={softDeletedAssets ?? 0} />
        </div>
      )}

      {/* ── Gesamt-Speicher pro Bucket ──────────────────────────────────────── */}
      <SectionTitle>Speicherverbrauch (Supabase Storage)</SectionTitle>
      {bucketStats && bucketStats.length > 0 ? (
        <div style={{ background: '#111827', borderRadius: 14, border: '1px solid #1f2937', overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '10px 20px', borderBottom: '1px solid #1f2937' }}>
            {['Bucket', 'Dateien', 'Speicher'].map(h => (
              <p key={h} style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</p>
            ))}
          </div>
          {bucketStats.map((b, i) => (
            <div key={b.bucket_id} style={{
              display: 'grid', gridTemplateColumns: '2fr 1fr 1fr',
              padding: '12px 20px', borderBottom: i < bucketStats.length - 1 ? '1px solid #1f2937' : 'none',
              alignItems: 'center',
            }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'white', fontFamily: 'monospace' }}>{b.bucket_id}</p>
              <p style={{ margin: 0, fontSize: 13, color: '#9ca3af' }}>{b.file_count?.toLocaleString('de-DE')}</p>
              <p style={{ margin: 0, fontSize: 13, color: '#60a5fa', fontWeight: 700 }}>{formatBytes(b.total_bytes ?? 0)}</p>
            </div>
          ))}
          <div style={{ padding: '12px 20px', borderTop: '2px solid #1f2937', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr' }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Gesamt</p>
            <p style={{ margin: 0, fontSize: 13, color: '#9ca3af' }}>
              {bucketStats.reduce((s, b) => s + (b.file_count ?? 0), 0).toLocaleString('de-DE')}
            </p>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: '#34d399' }}>{formatBytes(totalStorageBytes)}</p>
          </div>
        </div>
      ) : (
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 14, padding: '20px', marginBottom: 32 }}>
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
            Keine Daten — bitte Migration 016 im Supabase SQL-Editor ausführen, um die Statistik-Funktionen anzulegen.
          </p>
        </div>
      )}

      {/* ── Nicht zugeordnete Dateien ───────────────────────────────────────── */}
      {unattributed && unattributed.length > 0 && (() => {
        const totalOrphanBytes = unattributed.reduce((s, f) => s + (f.bytes ?? 0), 0)
        return (
          <div style={{
            background: '#451a03', borderRadius: 12, border: '1px solid #92400e',
            padding: '16px 20px', marginBottom: 24,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#fbbf24', fontSize: 14 }}>
                  {unattributed.length} verwaiste Datei{unattributed.length !== 1 ? 'en' : ''} · {formatBytes(totalOrphanBytes)}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: '#d97706' }}>
                  Diese Dateien können keiner Organisation zugeordnet werden — das Asset oder der Bereich wurde gelöscht ohne dass der Storage bereinigt wurde.
                </p>
              </div>
              <OrphanedStorageButton count={unattributed.length} totalBytes={totalOrphanBytes} />
            </div>
            <div style={{ maxHeight: 180, overflowY: 'auto' }}>
              {unattributed.map((f, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderTop: i > 0 ? '1px solid #78350f' : 'none' }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', fontFamily: 'monospace', background: '#78350f', padding: '1px 6px', borderRadius: 3, marginRight: 8 }}>{f.bucket_id}</span>
                    <span style={{ fontSize: 11, color: '#d97706', fontFamily: 'monospace' }}>{f.file_path}</span>
                  </div>
                  <span style={{ fontSize: 11, color: '#92400e', flexShrink: 0, marginLeft: 12 }}>{formatBytes(f.bytes ?? 0)}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* ── Speicher pro Organisation ───────────────────────────────────────── */}
      <SectionTitle>Speicher & Uploads pro Organisation</SectionTitle>
      {orgStorage && orgStorage.length > 0 ? (
        <div style={{ background: '#111827', borderRadius: 14, border: '1px solid #1f2937', overflow: 'hidden', marginBottom: 32 }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr 1fr 1.6fr 110px', padding: '10px 20px', borderBottom: '1px solid #1f2937' }}>
            {['Organisation', 'Bilder', 'Dokumente', 'Service', 'Speicher-Aufschlüsselung', ''].map(h => (
              <p key={h} style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</p>
            ))}
          </div>
          {orgStorage.map((row, i) => {
            const maxBytes = Math.max(...(orgStorage ?? []).map(r => r.storage_bytes ?? 1), 1)
            const totalRow = (row.asset_image_bytes ?? 0) + (row.asset_doc_bytes ?? 0) + (row.service_photo_bytes ?? 0) + (row.service_doc_bytes ?? 0) + (row.area_file_bytes ?? 0)
            return (
              <div key={row.organization_id} style={{
                display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr 1fr 1.6fr 110px',
                padding: '14px 20px', borderBottom: i < orgStorage.length - 1 ? '1px solid #1f2937' : 'none',
                alignItems: 'center',
              }}>
                {/* Org */}
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'white' }}>{row.organization_name}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: '#4b5563', fontFamily: 'monospace' }}>{row.org_slug}</p>
                </div>
                {/* Bilder */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b' }}>{row.image_count ?? 0}</span>
                  {(row.image_count ?? 0) > 0 && (
                    <div style={{ flex: 1, maxWidth: 50, height: 3, borderRadius: 3, background: '#1f2937' }}>
                      <div style={{ height: '100%', borderRadius: 3, background: '#f59e0b', width: `${Math.min(100, ((row.image_count ?? 0) / Math.max(...orgStorage.map(r => r.image_count ?? 1))) * 100)}%` }} />
                    </div>
                  )}
                </div>
                {/* Dokumente */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#60a5fa' }}>{row.document_count ?? 0}</span>
                  {(row.document_count ?? 0) > 0 && (
                    <div style={{ flex: 1, maxWidth: 50, height: 3, borderRadius: 3, background: '#1f2937' }}>
                      <div style={{ height: '100%', borderRadius: 3, background: '#60a5fa', width: `${Math.min(100, ((row.document_count ?? 0) / Math.max(...orgStorage.map(r => r.document_count ?? 1))) * 100)}%` }} />
                    </div>
                  )}
                </div>
                {/* Service-Einträge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#a78bfa' }}>{row.service_entry_count ?? 0}</span>
                  {(row.service_entry_count ?? 0) > 0 && (
                    <div style={{ flex: 1, maxWidth: 50, height: 3, borderRadius: 3, background: '#1f2937' }}>
                      <div style={{ height: '100%', borderRadius: 3, background: '#a78bfa', width: `${Math.min(100, ((row.service_entry_count ?? 0) / Math.max(...orgStorage.map(r => r.service_entry_count ?? 1))) * 100)}%` }} />
                    </div>
                  )}
                </div>
                {/* Speicher-Aufschlüsselung */}
                <div>
                  <p style={{ margin: '0 0 5px', fontSize: 13, fontWeight: 900, color: '#34d399' }}>{formatBytes(totalRow)}</p>
                  {totalRow > 0 && (
                    <>
                      {/* Stacked Bar */}
                      <div style={{ display: 'flex', height: 5, borderRadius: 3, overflow: 'hidden', maxWidth: 160, marginBottom: 5 }}>
                        {[
                          { bytes: row.asset_image_bytes ?? 0,   color: '#f59e0b' },
                          { bytes: row.service_photo_bytes ?? 0, color: '#fbbf24' },
                          { bytes: row.asset_doc_bytes ?? 0,     color: '#60a5fa' },
                          { bytes: row.service_doc_bytes ?? 0,   color: '#818cf8' },
                          { bytes: row.area_file_bytes ?? 0,     color: '#34d399' },
                        ].filter(s => s.bytes > 0).map((s, si) => (
                          <div key={si} style={{ width: `${(s.bytes / totalRow) * 100}%`, background: s.color, height: '100%' }} />
                        ))}
                      </div>
                      {/* Legende */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 10px' }}>
                        {(row.asset_image_bytes ?? 0) > 0 && <span style={{ fontSize: 10, color: '#f59e0b' }}>● Asset-Bilder {formatBytes(row.asset_image_bytes)}</span>}
                        {(row.service_photo_bytes ?? 0) > 0 && <span style={{ fontSize: 10, color: '#fbbf24' }}>● Service-Fotos {formatBytes(row.service_photo_bytes)}</span>}
                        {(row.asset_doc_bytes ?? 0) > 0 && <span style={{ fontSize: 10, color: '#60a5fa' }}>● Dokumente {formatBytes(row.asset_doc_bytes)}</span>}
                        {(row.service_doc_bytes ?? 0) > 0 && <span style={{ fontSize: 10, color: '#818cf8' }}>● Service-Docs {formatBytes(row.service_doc_bytes)}</span>}
                        {(row.area_file_bytes ?? 0) > 0 && <span style={{ fontSize: 10, color: '#34d399' }}>● Bereich {formatBytes(row.area_file_bytes)}</span>}
                      </div>
                    </>
                  )}
                </div>
                {/* Aktionen */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <OrgStorageNukeButton orgId={row.organization_id} orgName={row.organization_name} />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 14, padding: '20px', marginBottom: 32 }}>
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Keine Organisationen vorhanden.</p>
        </div>
      )}

      {/* ── DB-Statistiken ──────────────────────────────────────────────────── */}
      <SectionTitle>Datenbank</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        {statRow('Organisationen', totalOrgs, `${activeOrgs} aktiv`)}
        {statRow('Nutzer', totalUsers)}
        {statRow('Assets (aktiv)', totalAssets)}
        {statRow('Service-Einträge', totalServiceEntries)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 32 }}>
        {statRow('Dokumente', totalDocs)}
        {statRow('PW-Änderung ausstehend', pendingPwChange, 'müssen PW ändern', true)}
        {statRow('Inaktive Orgs', (totalOrgs ?? 0) - (activeOrgs ?? 0))}
        {statRow('Soft-deleted Assets', softDeletedAssets, 'noch nicht bereinigt', true)}
      </div>

      {/* ── Admin-Audit-Log ─────────────────────────────────────────────────── */}
      <SectionTitle>Admin-Audit-Log (letzte 20)</SectionTitle>
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
