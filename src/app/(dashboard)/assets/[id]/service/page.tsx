import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ServiceSchedules } from './service-schedules'
import { ServiceTimeline } from './service-timeline'
import { WartungTimeline, type ScheduleWithAsset } from '@/app/(dashboard)/wartung/wartung-timeline'
import { ClipboardList, Euro, RefreshCw, BarChart2 } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export default async function ServicePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const t = await getTranslations()

  const { data: asset } = await supabase
    .from('assets')
    .select('id, title, status')
    .eq('id', id)
    .single()

  if (!asset) notFound()

  const { data: events } = await supabase
    .from('asset_lifecycle_events')
    .select('*')
    .eq('asset_id', id)
    .order('event_date', { ascending: false })

  const { data: schedules } = await supabase
    .from('maintenance_schedules')
    .select('*')
    .eq('asset_id', id)
    .eq('is_active', true)
    .order('next_service_date', { ascending: true })

  const totalCost = events?.reduce((sum, e) => sum + (e.cost_eur ?? 0), 0) ?? 0

  const schedulesForGantt: ScheduleWithAsset[] = (schedules ?? []).map(s => ({
    ...s,
    assets: { id: asset.id, title: asset.title, category: null, status: asset.status },
  }))

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>

      {/* Header */}
      <div style={{ padding: '20px 20px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href={`/assets/${id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', background: '#f4f6f9', border: '1px solid #c8d4e8', textDecoration: 'none' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#003366" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </Link>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 12, color: '#96aed2', margin: 0 }}>{asset.title}</p>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#000', margin: 0 }}>{t('service.title')}</h1>
        </div>
        <Link href={`/assets/${id}/service/neu`} style={{
          backgroundColor: '#003366', color: 'white', padding: '10px 16px', borderRadius: 50,
          textDecoration: 'none', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ fontSize: 16 }}>+</span> {t('service.newEntry').replace('+ ', '')}
        </Link>
      </div>

      {/* Statistik-Karten */}
      <div style={{ padding: '0 20px 20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        <StatCard label={t('service.entries')} value={String(events?.length ?? 0)} icon={<ClipboardList size={14} />} />
        <StatCard label={t('service.totalCost')} value={totalCost > 0 ? `${totalCost.toLocaleString('de-DE')} €` : '–'} icon={<Euro size={14} />} />
        <StatCard label={t('service.intervals')} value={String(schedules?.length ?? 0)} icon={<RefreshCw size={14} />} />
      </div>

      <Divider />

      {/* Wartungsintervalle */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <SectionTitle icon={<RefreshCw size={14} />} label={t('service.schedules.title')} />
          <Link href={`/assets/${id}/service/intervall`} style={{
            backgroundColor: '#003366', color: 'white', padding: '7px 14px', borderRadius: 50,
            textDecoration: 'none', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <span style={{ fontSize: 14 }}>+</span> {t('service.schedules.newInterval').replace('+ ', '')}
          </Link>
        </div>
        {schedules && schedules.length > 0 ? (
          <ServiceSchedules schedules={schedules} assetId={id} />
        ) : (
          <div style={{ background: 'white', borderRadius: 12, padding: '20px 16px', border: '1px dashed #c8d4e8', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#96aed2', margin: '0 0 12px' }}>{t('service.schedules.noSchedules')}</p>
            <Link href={`/assets/${id}/service/intervall`} style={{
              backgroundColor: '#003366', color: 'white', padding: '9px 20px', borderRadius: 50,
              textDecoration: 'none', fontSize: 13, fontWeight: 700,
            }}>{t('service.schedules.createFirst')}</Link>
          </div>
        )}
      </div>

      {/* Gantt-Wartungsplan */}
      {schedules && schedules.length > 0 && (
        <>
          <Divider />
          <div style={{ padding: '20px 20px 0' }}>
            <SectionTitle icon={<BarChart2 size={14} />} label={t('service.maintenancePlan')} />
            <div style={{ marginTop: 10 }}>
              <WartungTimeline schedules={schedulesForGantt} showFilters={true} showAssetName={false} />
            </div>
          </div>
        </>
      )}

      <Divider />

      {/* Verlauf */}
      <div style={{ padding: '20px 20px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <SectionTitle icon={<ClipboardList size={14} />} label={t('service.history')} />
          {events && events.length > 0 && (
            <Link href={`/assets/${id}/service/neu`} style={{ fontSize: 12, color: '#0099cc', textDecoration: 'none', fontWeight: 600 }}>
              + {t('service.newEntry').replace('+ ', '')}
            </Link>
          )}
        </div>

        {events && events.length > 0 ? (
          <ServiceTimeline events={events} assetId={id} />
        ) : (
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <Link href={`/assets/${id}/service/neu`} style={{
              backgroundColor: '#003366', color: 'white', padding: '12px 24px',
              borderRadius: 50, textDecoration: 'none', fontSize: 14, fontWeight: 700,
            }}>{t('service.createFirstEntry')}</Link>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, padding: '12px 14px', border: '1px solid #c8d4e8' }}>
      <p style={{ fontSize: 11, color: '#96aed2', fontWeight: 700, margin: '0 0 4px', fontFamily: 'Arial, sans-serif' }}>{icon} {label}</p>
      <p style={{ fontSize: 16, fontWeight: 700, color: '#000', margin: 0, fontFamily: 'Arial, sans-serif' }}>{value}</p>
    </div>
  )
}

function Divider() {
  return <div style={{ margin: '4px 0', borderTop: '2px solid #e8eef8' }} />
}

function SectionTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <h2 style={{
      fontSize: 14, fontWeight: 700, color: '#003366', margin: 0,
      display: 'flex', alignItems: 'center', gap: 6,
      paddingLeft: 10, borderLeft: '3px solid #003366',
      fontFamily: 'Arial, sans-serif',
    }}>
      {icon} {label}
    </h2>
  )
}
