import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Building2, Grid3x3, Package, Tag, ChevronRight } from 'lucide-react'
import { getStatusConfig } from '@/lib/asset-statuses'

export default async function StandortDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: location } = await supabase
    .from('locations')
    .select('id, name, address, organization_id')
    .eq('id', id)
    .single()

  if (!location) notFound()

  const { data: org } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', location.organization_id)
    .single()
  const customStatuses = (org?.settings as { custom_statuses?: { value: string; label: string; color: string }[] })?.custom_statuses ?? []

  const { data: halls } = await supabase
    .from('halls')
    .select('id, name')
    .eq('location_id', id)
    .order('name')

  const hallIds = (halls ?? []).map(h => h.id)

  const { data: areas } = await supabase
    .from('areas')
    .select('id, name, hall_id')
    .in('hall_id', hallIds.length > 0 ? hallIds : ['__none__'])
    .order('name')

  const areaIds = (areas ?? []).map(a => a.id)

  // Alle location_refs, die zu diesem Standort gehören
  const refs = [
    `location:${id}`,
    ...hallIds.map(h => `hall:${h}`),
    ...areaIds.map(a => `area:${a}`),
  ]

  const { data: assets } = await supabase
    .from('assets')
    .select('id, title, status, category, location, location_ref')
    .in('location_ref', refs)
    .is('deleted_at', null)
    .order('title')

  // Gruppenstruktur für den Tree
  const areasByHall: Record<string, typeof areas> = {}
  for (const a of areas ?? []) {
    if (!areasByHall[a.hall_id]) areasByHall[a.hall_id] = []
    areasByHall[a.hall_id]!.push(a)
  }

  const assetsByRef: Record<string, typeof assets> = {}
  for (const a of assets ?? []) {
    const ref = a.location_ref as string
    if (!assetsByRef[ref]) assetsByRef[ref] = []
    assetsByRef[ref]!.push(a)
  }

  const totalCount = assets?.length ?? 0

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', paddingBottom: 40 }}>
      {/* Back */}
      <div style={{ position: 'sticky', top: 0, height: 0, overflow: 'visible', zIndex: 50 }}>
        <div style={{ padding: '14px 14px 0' }}>
          <Link href="/organisation" style={{
            height: 34, borderRadius: 20,
            backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
            display: 'inline-flex', alignItems: 'center',
            gap: 4, padding: '0 12px 0 8px', textDecoration: 'none',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>Organisation</span>
          </Link>
        </div>
      </div>

      {/* Header */}
      <div style={{ padding: '56px 16px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: '#e8f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MapPin size={20} color="#003366" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#000', margin: 0 }}>{location.name}</h1>
            {location.address && <p style={{ fontSize: 12, color: '#888', margin: 0 }}>{location.address}</p>}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, padding: '3px 12px', borderRadius: 20, background: '#e8f0ff', color: '#003366', fontWeight: 700 }}>
            {totalCount} Asset{totalCount !== 1 ? 's' : ''}
          </span>
          <span style={{ fontSize: 12, padding: '3px 12px', borderRadius: 20, background: '#f4f6f9', color: '#666' }}>
            {halls?.length ?? 0} Halle{(halls?.length ?? 0) !== 1 ? 'n' : ''}
          </span>
          <span style={{ fontSize: 12, padding: '3px 12px', borderRadius: 20, background: '#f4f6f9', color: '#666' }}>
            {areaIds.length} Bereich{areaIds.length !== 1 ? 'e' : ''}
          </span>
        </div>
      </div>

      {/* Assets direkt am Standort */}
      {(assetsByRef[`location:${id}`] ?? []).length > 0 && (
        <AssetSection
          title="Direkt am Standort"
          assets={assetsByRef[`location:${id}`]!}
          customStatuses={customStatuses}
        />
      )}

      {/* Hallen + deren Bereiche */}
      {(halls ?? []).map(hall => {
        const hallAssets = assetsByRef[`hall:${hall.id}`] ?? []
        const hallAreas = areasByHall[hall.id] ?? []
        const totalInHall = hallAssets.length + hallAreas.reduce((s, a) => s + (assetsByRef[`area:${a.id}`]?.length ?? 0), 0)
        if (totalInHall === 0 && hallAreas.length === 0) return null

        return (
          <div key={hall.id} style={{ padding: '0 16px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Building2 size={14} color="#0099cc" />
              <Link href={`/organisation/halle/${hall.id}`} style={{ fontSize: 14, fontWeight: 700, color: '#0099cc', textDecoration: 'none' }}>
                {hall.name}
              </Link>
              <span style={{ fontSize: 11, color: '#96aed2' }}>· {totalInHall} Assets</span>
            </div>

            {hallAssets.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                {hallAssets.map(a => (
                  <AssetRow key={a.id} asset={a} customStatuses={customStatuses} />
                ))}
              </div>
            )}

            {hallAreas.map(area => {
              const areaAssets = assetsByRef[`area:${area.id}`] ?? []
              if (areaAssets.length === 0) return null
              return (
                <div key={area.id} style={{ marginLeft: 16, marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                    <Grid3x3 size={12} color="#96aed2" />
                    <Link href={`/organisation/bereich/${area.id}`} style={{ fontSize: 12, fontWeight: 700, color: '#96aed2', textDecoration: 'none' }}>
                      {area.name}
                    </Link>
                    <span style={{ fontSize: 11, color: '#bbb' }}>· {areaAssets.length}</span>
                  </div>
                  {areaAssets.map(a => (
                    <AssetRow key={a.id} asset={a} customStatuses={customStatuses} />
                  ))}
                </div>
              )
            })}
          </div>
        )
      })}

      {totalCount === 0 && (
        <div style={{ padding: '32px 16px', textAlign: 'center' }}>
          <Package size={32} color="#c8d4e8" style={{ marginBottom: 10 }} />
          <p style={{ color: '#aaa', fontSize: 14, margin: 0 }}>Noch keine Assets an diesem Standort</p>
        </div>
      )}
    </div>
  )
}

function AssetSection({ title, assets, customStatuses }: {
  title: string
  assets: { id: string; title: string; status: string; category: string | null; location: string | null }[]
  customStatuses: { value: string; label: string; color: string }[]
}) {
  return (
    <div style={{ padding: '0 16px 16px' }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: '#96aed2', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>
        {title}
      </p>
      {assets.map(a => <AssetRow key={a.id} asset={a} customStatuses={customStatuses} />)}
    </div>
  )
}

function AssetRow({ asset, customStatuses }: {
  asset: { id: string; title: string; status: string; category: string | null; location: string | null }
  customStatuses: { value: string; label: string; color: string }[]
}) {
  const sc = getStatusConfig(asset.status, customStatuses)
  return (
    <Link href={`/assets/${asset.id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'white', borderRadius: 10, padding: '10px 14px',
        border: '1px solid #e8eef6', marginBottom: 6,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#000',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {asset.title}
          </p>
          {asset.category && (
            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#96aed2', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Tag size={10} /> {asset.category}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
            backgroundColor: sc.color, color: 'white',
          }}>{sc.label}</span>
          <ChevronRight size={14} color="#c8d4e8" />
        </div>
      </div>
    </Link>
  )
}
