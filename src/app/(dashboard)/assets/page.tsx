import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { AssetSearch } from './asset-search'
import { AssetFilters } from './asset-filters'
import { AssetCardActions } from './asset-card-actions'
import { AssetDeleteButton } from './asset-delete-button'
import { AssetThumbnail } from './asset-thumbnail'
import { AssetImportButton } from './import-button'
import { getRole } from '@/lib/get-role'
import { can } from '@/lib/permissions'
import { getTranslations } from 'next-intl/server'

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; sort?: string; cat?: string }>
}) {
  const { q, status, sort = 'newest', cat } = await searchParams
  const supabase = await createClient()
  const role = await getRole()
  const perms = can(role)

  // Basis-Query aufbauen
  let query = supabase
    .from('assets')
    .select('id, title, article_number, serial_number, order_number, category, manufacturer, location, description, status, image_urls, organization_id, technical_data, commercial_data')
    .is('deleted_at', null)

  if (q) {
    query = query.or(`title.ilike.%${q}%,article_number.ilike.%${q}%,serial_number.ilike.%${q}%,order_number.ilike.%${q}%`)
  }
  if (status) query = query.eq('status', status)
  if (cat) query = query.eq('category', cat)

  // Sortierung
  switch (sort) {
    case 'oldest':
      query = query.order('created_at', { ascending: true }); break
    case 'title_asc':
      query = query.order('title', { ascending: true }); break
    case 'title_desc':
      query = query.order('title', { ascending: false }); break
    case 'status':
      query = query.order('status', { ascending: true }).order('created_at', { ascending: false }); break
    default:
      query = query.order('created_at', { ascending: false })
  }

  const { data: assets } = await query.limit(100)

  // Total + Limit
  const { count: totalCount } = await supabase
    .from('assets')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null)

  const { data: org } = await supabase
    .from('organizations')
    .select('asset_limit, plan')
    .single()

  // Alle vorhandenen Kategorien für Filter-Dropdown
  const { data: categoryRows } = await supabase
    .from('assets')
    .select('category')
    .is('deleted_at', null)
    .not('category', 'is', null)

  const categories = [...new Set((categoryRows ?? []).map(r => r.category as string).filter(Boolean))].sort()

  const { data: orgData } = await supabase.from('organizations').select('settings').single()
  const customStatuses = (orgData?.settings as { custom_statuses?: { value: string; label: string; color: string }[] })?.custom_statuses ?? []

  const { getStatusConfig } = await import('@/lib/asset-statuses')
  const t = await getTranslations()
  const hasFilters = !!(status || cat || (sort && sort !== 'newest'))

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', background: 'var(--ds-bg)', minHeight: '100vh' }} className="page-pad">
      {/* Header */}
      <div style={{
        padding: '20px 20px 0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ds-text, #000)', margin: '0 0 2px' }}>Assets</h1>
          <p style={{ fontSize: 13, color: 'var(--ds-text3, #666)', margin: 0 }}>
            {totalCount ?? 0}{org?.asset_limit && org.asset_limit > 0 ? ` / ${org.asset_limit}` : ''} Assets
            {(hasFilters || q) && <> · {assets?.length ?? 0} {t('assets.noResults').toLowerCase()}</>}
          </p>
        </div>
        {perms.editAssets && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AssetImportButton />
            <Link href="/assets/neu" style={{
              backgroundColor: '#003366', color: 'white',
              padding: '10px 18px', borderRadius: 50,
              textDecoration: 'none', fontSize: 14, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> {t('common.new').replace('+ ', '')}
            </Link>
          </div>
        )}
      </div>

      {/* Suche */}
      <div style={{ padding: '16px 20px 10px' }}>
        <AssetSearch defaultValue={q} />
      </div>

      {/* Filter + Sortierung */}
      <div style={{ padding: '0 20px 16px' }}>
        <AssetFilters
          categories={categories}
          currentStatus={status}
          currentSort={sort}
          currentCategory={cat}
          q={q}
        />
      </div>

      {/* Asset Liste */}
      <div style={{ padding: '0 20px 20px' }}>
        {!assets || assets.length === 0 ? (
          <div style={{
            background: 'var(--ds-surface, white)', borderRadius: 16, padding: 40,
            border: '1px solid var(--ds-border, #c8d4e8)', textAlign: 'center',
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
            <p style={{ fontWeight: 700, color: 'var(--ds-text, #000)', fontSize: 16, margin: '0 0 8px' }}>
              {hasFilters || q ? t('assets.noResults') : t('assets.noAssets')}
            </p>
            <p style={{ color: 'var(--ds-text3, #666)', fontSize: 14, margin: '0 0 20px' }}>
              {hasFilters || q ? t('assets.noResults') : t('assets.noAssetsDesc')}
            </p>
            {!hasFilters && !q && (
              <Link href="/assets/neu" style={{
                backgroundColor: '#003366', color: 'white',
                padding: '12px 24px', borderRadius: 50,
                textDecoration: 'none', fontSize: 14, fontWeight: 700,
              }}>
                {t('common.new')} Asset
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {assets.map(asset => (
              <Link key={asset.id} href={`/assets/${asset.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'var(--ds-surface, white)', borderRadius: 14, padding: '14px 16px',
                  border: '1px solid var(--ds-border, #c8d4e8)',
                  display: 'flex', alignItems: 'center', gap: 14,
                  boxShadow: '0 1px 3px var(--ds-shadow, rgba(0,51,102,0.06))',
                }}>
                  {/* Thumbnail */}
                  <div style={{
                    width: 56, height: 56, borderRadius: 10, flexShrink: 0,
                    backgroundColor: 'var(--ds-bg, #f4f6f9)', border: '1px solid var(--ds-border, #c8d4e8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden',
                  }}>
                    <AssetThumbnail url={asset.image_urls?.[0]} />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, color: 'var(--ds-text, #000)', fontSize: 15, margin: '0 0 3px',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {asset.title}
                    </p>
                    <p style={{ color: 'var(--ds-text3, #666)', fontSize: 12, margin: '0 0 6px' }}>
                      {[asset.article_number, asset.category].filter(Boolean).join(' · ')}
                    </p>
                    {(() => {
                      const sc = getStatusConfig(asset.status, customStatuses)
                      return (
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                          backgroundColor: `${sc.color}20`, color: sc.color,
                        }}>
                          {sc.label}
                        </span>
                      )
                    })()}
                  </div>

                  {asset.status === 'decommissioned' && perms.deleteAssets && (
                    <AssetDeleteButton assetId={asset.id} />
                  )}
                  {perms.editAssets && (
                    <AssetCardActions
                      assetId={asset.id}
                      assetTitle={asset.title}
                      organizationId={asset.organization_id}
                      technicalData={asset.technical_data}
                      commercialData={asset.commercial_data}
                      articleNumber={asset.article_number}
                      orderNumber={asset.order_number}
                      category={asset.category}
                      manufacturer={asset.manufacturer}
                      location={asset.location}
                      description={asset.description}
                      status={asset.status}
                    />
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
