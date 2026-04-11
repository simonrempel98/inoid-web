import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Building2, ChevronRight, Package } from 'lucide-react'
import { getStatusConfig } from '@/lib/asset-statuses'
import { getTranslations } from 'next-intl/server'

export default async function StandortDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const t = await getTranslations('organisation.standort')

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

  const areaIds = (areas ?? []).map(a => a.id)

  const refs = [
    `location:${id}`,
    ...hallIds.map(h => `hall:${h}`),
    ...areaIds.map(a => `area:${a}`),
  ]

  const { data: assets } = await supabase
    .from('assets')
    .select('id, title, status, category, location_ref')
    .in('location_ref', refs)
    .is('deleted_at', null)
    .order('title')

  const areasByHall: Record<string, string[]> = {}
  for (const a of areas ?? []) {
    if (!areasByHall[a.hall_id]) areasByHall[a.hall_id] = []
    areasByHall[a.hall_id].push(a.id)
  }

  const countForHall = (hallId: string) => {
    const hallRef = `hall:${hallId}`
    const areaRefs = (areasByHall[hallId] ?? []).map(aid => `area:${aid}`)
    return (assets ?? []).filter(a => {
      const ref = a.location_ref as string
      return ref === hallRef || areaRefs.includes(ref)
    }).length
  }

  const directAssets = (assets ?? []).filter(a => (a.location_ref as string) === `location:${id}`)
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
            <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>{t('back')}</span>
          </Link>
        </div>
      </div>

      {/* Header */}
      <div style={{ padding: '56px 16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: '#e8f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MapPin size={20} color="#003366" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#000', margin: 0 }}>{location.name}</h1>
            {location.address && <p style={{ fontSize: 12, color: '#888', margin: 0 }}>{location.address}</p>}
          </div>
        </div>

        {/* Übersicht-Karten */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 16 }} className="rg-3">
          <div style={{ background: 'white', borderRadius: 12, padding: '14px 16px', border: '1px solid #e8eef6' }}>
            <p style={{ margin: 0, fontSize: 10, color: '#96aed2', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('assetsLabel')}</p>
            <p style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 700, color: '#003366' }}>{totalCount}</p>
          </div>
          <div style={{ background: 'white', borderRadius: 12, padding: '14px 16px', border: '1px solid #e8eef6' }}>
            <p style={{ margin: 0, fontSize: 10, color: '#96aed2', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('hallsLabel')}</p>
            <p style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 700, color: '#003366' }}>{halls?.length ?? 0}</p>
          </div>
          <div style={{ background: 'white', borderRadius: 12, padding: '14px 16px', border: '1px solid #e8eef6' }}>
            <p style={{ margin: 0, fontSize: 10, color: '#96aed2', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('areasLabel')}</p>
            <p style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 700, color: '#003366' }}>{areaIds.length}</p>
          </div>
        </div>
      </div>

      {/* Hallen als Karten */}
      {(halls ?? []).length > 0 && (
        <div style={{ padding: '0 16px 16px' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#96aed2', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>
            {t('halls')}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(halls ?? []).map(hall => {
              const count = countForHall(hall.id)
              const hallAreaCount = (areasByHall[hall.id] ?? []).length
              return (
                <Link key={hall.id} href={`/organisation/halle/${hall.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'white', borderRadius: 12, padding: '13px 16px',
                    border: '1px solid #e8eef6',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: '#e6f6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Building2 size={15} color="#0099cc" />
                      </div>
                      <div>
                        <span style={{ fontSize: 15, fontWeight: 600, color: '#000' }}>{hall.name}</span>
                        {hallAreaCount > 0 && (
                          <p style={{ margin: 0, fontSize: 11, color: '#96aed2' }}>{hallAreaCount} {t('areas')}</p>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {count > 0 && (
                        <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#e6f6ff', color: '#0099cc' }}>
                          {count} Asset{count !== 1 ? 's' : ''}
                        </span>
                      )}
                      {count === 0 && (
                        <span style={{ fontSize: 12, color: '#bbb' }}>{t('leer')}</span>
                      )}
                      <ChevronRight size={15} color="#c8d4e8" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Assets direkt am Standort (ohne Halle) */}
      {directAssets.length > 0 && (
        <div style={{ padding: '0 16px 16px' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#96aed2', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>
            {t('directTitle')}
          </p>
          {directAssets.map(a => {
            const sc = getStatusConfig(a.status, customStatuses)
            return (
              <Link key={a.id} href={`/assets/${a.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'white', borderRadius: 10, padding: '10px 14px',
                  border: '1px solid #e8eef6', marginBottom: 6,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#000',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.title}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, backgroundColor: sc.color, color: 'white' }}>
                      {sc.label}
                    </span>
                    <ChevronRight size={14} color="#c8d4e8" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {totalCount === 0 && (halls ?? []).length === 0 && (
        <div style={{ padding: '32px 16px', textAlign: 'center' }}>
          <Package size={32} color="#c8d4e8" style={{ marginBottom: 10 }} />
          <p style={{ color: '#aaa', fontSize: 14, margin: 0 }}>{t('empty')}</p>
        </div>
      )}
    </div>
  )
}
