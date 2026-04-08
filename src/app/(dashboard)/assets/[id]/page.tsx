import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { getRole } from '@/lib/get-role'
import { can } from '@/lib/permissions'
import Link from 'next/link'
import { getTranslations, getLocale } from 'next-intl/server'
import { AssetQrDisplay } from './asset-qr-display'
import { DuplicateButton } from './duplicate-button'
import { AssetImageGallery } from './asset-image-gallery'
import { AssetStatusActions } from './asset-status-actions'
import { AssetDocuments } from './asset-documents'
import { getStatusConfig } from '@/lib/asset-statuses'
import { Tag, Factory, MapPin, Calendar, Settings2, Briefcase, Wrench, Smartphone } from 'lucide-react'
import { LocationHistory } from './location-history'

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const t = await getTranslations()
  const locale = await getLocale()
  const role = await getRole()
  const perms = can(role)

  const { data: asset } = await supabase
    .from('assets')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (!asset) notFound()

  const { data: org } = await supabase
    .from('organizations')
    .select('settings')
    .single()
  const customStatuses = (org?.settings as { custom_statuses?: { value: string; label: string; color: string }[] })?.custom_statuses ?? []

  const { data: locationHistory } = await supabase
    .from('asset_location_history')
    .select('id, location, changed_at')
    .eq('asset_id', id)
    .order('changed_at', { ascending: false })

  const { data: events } = await supabase
    .from('asset_lifecycle_events')
    .select('id, title, event_type, event_date, performed_by')
    .eq('asset_id', id)
    .order('event_date', { ascending: false })
    .limit(3)

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles').select('organization_id').eq('id', user!.id).single()
  const orgId = profile?.organization_id ?? ''
  const [{ data: locations }, { data: halls }, { data: areas }] = await Promise.all([
    supabase.from('locations').select('id, name').eq('organization_id', orgId).order('name'),
    supabase.from('halls').select('id, name, location_id, locations(name)').eq('organization_id', orgId).order('name'),
    supabase.from('areas').select('id, name, hall_id, halls(name)').eq('organization_id', orgId).order('name'),
  ])

  const techEntries = Object.entries((asset.technical_data as Record<string, string>) ?? {}).filter(([, v]) => v)
  const commEntries = Object.entries((asset.commercial_data as Record<string, string>) ?? {}).filter(([, v]) => v)

  const eventTypeLabel: Record<string, string> = {
    maintenance: t('eventTypes.maintenance'), overhaul: t('eventTypes.overhaul'), coating: t('eventTypes.coating'),
    repair: t('eventTypes.repair'), cleaning: t('eventTypes.cleaning'), incident: t('eventTypes.incident'),
    inspection: t('eventTypes.inspection'), installation: t('eventTypes.installation'), decommission: t('eventTypes.decommission'), other: t('eventTypes.other'),
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', paddingBottom: 40 }}>

      {/* Zurück + Status – sticky, überlagert die Galerie */}
      <div style={{ position: 'sticky', top: 0, height: 0, overflow: 'visible', zIndex: 50 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 14px 0' }}>
          <Link href="/assets" style={{
            height: 34, borderRadius: 20,
            backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center',
            gap: 4, padding: '0 12px 0 8px',
            textDecoration: 'none',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            <span style={{ color: 'white', fontSize: 12, fontWeight: 700, fontFamily: 'Arial, sans-serif' }}>
              {t('common.back')}
            </span>
          </Link>
          {(() => {
            const sc = getStatusConfig(asset.status, customStatuses)
            return (
              <div style={{
                backgroundColor: sc.color, color: 'white',
                fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                fontFamily: 'Arial, sans-serif',
              }}>
                {sc.label}
              </div>
            )
          })()}
        </div>
      </div>

      {/* Galerie */}
      <AssetImageGallery imageUrls={asset.image_urls ?? []} title={asset.title} />

      {/* Titel + Nummern */}
      <div style={{ padding: '16px 16px 0' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#000', margin: '0 0 6px' }}>
          {asset.title}
        </h1>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {asset.article_number && (
            <span style={chipStyle}>{t('assets.detail.articlePrefix')} {asset.article_number}</span>
          )}
          {asset.serial_number && (
            <span style={chipStyle}>{t('assets.detail.serialPrefix')} {asset.serial_number}</span>
          )}
          {asset.order_number && (
            <span style={chipStyle}>{t('assets.detail.orderPrefix')} {asset.order_number}</span>
          )}
        </div>
        {asset.description && (
          <p style={{ color: '#666', fontSize: 14, margin: '0 0 16px', lineHeight: 1.5 }}>
            {asset.description}
          </p>
        )}
      </div>

      {/* Quick Info Karten */}
      <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        {asset.category && (
          <InfoCard icon={<Tag size={14} />} label={t('assets.fields.category')} value={asset.category} />
        )}
        {asset.manufacturer && (
          <InfoCard icon={<Factory size={14} />} label={t('assets.fields.manufacturer')} value={asset.manufacturer} />
        )}
        {asset.location && (
          <LocationHistory
            current={asset.location}
            history={locationHistory ?? []}
            assetId={id}
            locationRef={(asset as any).location_ref ?? null}
            locations={locations ?? []}
            halls={(halls ?? []) as any}
            areas={(areas ?? []) as any}
          />
        )}
        {asset.created_at && (
          <InfoCard icon={<Calendar size={14} />} label={t('assets.detail.createdAt')} value={new Date(asset.created_at).toLocaleDateString(locale)} />
        )}
      </div>

      {/* Technische Daten */}
      {techEntries.length > 0 && (
        <DataGrid title={t('assets.fields.technicalData')} icon={<Settings2 size={15} />} entries={techEntries} />
      )}

      {/* Kommerzielle Daten */}
      {commEntries.length > 0 && (
        <DataGrid title={t('assets.fields.commercialData')} icon={<Briefcase size={15} />} entries={commEntries} />
      )}

      {/* Letzte Service-Einträge */}
      <div style={{ padding: '0 16px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Link href={`/assets/${id}/service`} style={{ fontSize: 15, fontWeight: 700, color: '#000', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}><Wrench size={14} /> {t('service.title')}</Link>
          <Link href={`/assets/${id}/service`} style={{ fontSize: 13, color: '#0099cc', textDecoration: 'none', fontWeight: 600 }}>
            {t('assets.detail.showAll')}
          </Link>
        </div>
        {!events || events.length === 0 ? (
          <div style={{
            background: 'white', borderRadius: 12, padding: '20px 16px',
            border: '1px solid #c8d4e8', textAlign: 'center',
          }}>
            <p style={{ color: '#999', fontSize: 13, margin: '0 0 12px' }}>{t('service.timeline.noEntries')}</p>
            {perms.editService && (
              <Link href={`/assets/${id}/service/neu`} style={{
                backgroundColor: '#003366', color: 'white',
                padding: '8px 18px', borderRadius: 50,
                textDecoration: 'none', fontSize: 13, fontWeight: 700,
              }}>
                {t('assets.detail.createFirstEntry')}
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {events.map(ev => (
              <div key={ev.id} style={{
                background: 'white', borderRadius: 12, padding: '12px 14px',
                border: '1px solid #c8d4e8',
                display: 'flex', gap: 12, alignItems: 'center',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  backgroundColor: '#f0f4ff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#003366',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}><Wrench size={16} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 13, color: '#000', margin: '0 0 2px',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ev.title}
                  </p>
                  <p style={{ color: '#96aed2', fontSize: 11, margin: 0 }}>
                    {eventTypeLabel[ev.event_type] ?? ev.event_type} ·{' '}
                    {new Date(ev.event_date).toLocaleDateString(locale)}
                    {ev.performed_by ? ` · ${ev.performed_by}` : ''}
                  </p>
                </div>
              </div>
            ))}
            {perms.editService && (
            <Link href={`/assets/${id}/service/neu`} style={{
              display: 'block', textAlign: 'center',
              backgroundColor: 'white', color: '#003366',
              padding: '10px', borderRadius: 12,
              border: '1px dashed #c8d4e8',
              textDecoration: 'none', fontSize: 13, fontWeight: 700,
            }}>
              {t('assets.detail.newEntry')}
            </Link>
          )}
          </div>
        )}
      </div>

      {/* Dokumente */}
      <AssetDocuments
        assetId={id}
        initialUrls={(asset as any).document_urls ?? []}
        canEdit={perms.editAssets}
      />

      {/* QR Code + NFC */}
      <div style={{ padding: '0 16px 16px' }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#000', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}><Smartphone size={14} /> {t('assets.detail.qrNfc')}</h2>
        <div style={{
          background: 'white', borderRadius: 14, padding: 20,
          border: '1px solid #c8d4e8',
          display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap',
        }}>
          {asset.qr_code ? (
            <AssetQrDisplay url={asset.qr_code} assetId={asset.id} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{
                width: 160, height: 160, borderRadius: 12, backgroundColor: '#f4f6f9',
                border: '1px solid #c8d4e8', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ color: '#96aed2', fontSize: 12 }}>{t('assets.detail.noQr')}</span>
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#96aed2', fontWeight: 700, margin: '0 0 4px', fontFamily: 'Arial, sans-serif' }}>
                  UUID / NFC-Tag
                </p>
                <p style={{ fontSize: 11, color: '#003366', fontFamily: 'monospace', wordBreak: 'break-all', margin: 0 }}>
                  {asset.id}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Aktionen */}
      {perms.editAssets && (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <DuplicateButton asset={asset} />
            <Link href={`/assets/${id}/bearbeiten`} style={{
              flex: 1, display: 'block', textAlign: 'center',
              backgroundColor: '#003366', color: 'white',
              padding: '13px', borderRadius: 50,
              textDecoration: 'none', fontSize: 14, fontWeight: 700,
            }}>
              {t('common.edit')}
            </Link>
          </div>
          <AssetStatusActions assetId={id} currentStatus={asset.status} customStatuses={customStatuses} />
        </div>
      )}
    </div>
  )
}

// ─── Helper-Komponenten ────────────────────────────────────────────────────

const chipStyle: React.CSSProperties = {
  display: 'inline-block', fontSize: 11, padding: '3px 10px', borderRadius: 20,
  backgroundColor: '#f4f6f9', color: '#666666', border: '1px solid #c8d4e8',
  fontFamily: 'Arial, sans-serif',
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{
      background: 'white', borderRadius: 12, padding: '12px 14px',
      border: '1px solid #c8d4e8',
    }}>
      <p style={{ fontSize: 11, color: '#96aed2', margin: '0 0 3px', fontWeight: 700, fontFamily: 'Arial, sans-serif', display: 'flex', alignItems: 'center', gap: 4 }}>
        {icon}{label}
      </p>
      <p style={{ fontSize: 13, color: '#000', margin: 0, fontWeight: 600, fontFamily: 'Arial, sans-serif',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {value}
      </p>
    </div>
  )
}

function DataGrid({ title, icon, entries }: { title: string; icon: React.ReactNode; entries: [string, string][] }) {
  return (
    <div style={{ padding: '0 16px 16px' }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, color: '#000', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>{icon}{title}</h2>
      <div style={{
        background: 'white', borderRadius: 14, border: '1px solid #c8d4e8',
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        overflow: 'hidden',
      }}>
        {entries.map(([key, value], i) => (
          <div key={key} style={{
            padding: '12px 14px',
            borderRight: (i + 1) % 3 !== 0 ? '1px solid #c8d4e8' : 'none',
            borderBottom: i < entries.length - (entries.length % 3 === 0 ? 3 : entries.length % 3) ? '1px solid #c8d4e8' : 'none',
          }}>
            <p style={{ fontSize: 11, color: '#96aed2', fontWeight: 700, margin: '0 0 3px', fontFamily: 'Arial, sans-serif',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {key}
            </p>
            <p style={{ fontSize: 14, color: '#000', fontWeight: 700, margin: 0, fontFamily: 'Arial, sans-serif',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
