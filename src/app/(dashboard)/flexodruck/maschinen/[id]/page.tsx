// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { MachineDiagram } from './machine-diagram'

export default async function MaschinenDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('organization_id, app_role').eq('id', user.id).single()
  if (!profile?.organization_id) redirect('/dashboard')

  const t = await getTranslations()

  // Maschine laden
  const { data: machine, error } = await supabase
    .from('flexo_machines')
    .select('id, name, manufacturer, model, num_druckwerke, notes, is_active, created_at, image_url')
    .eq('id', id)
    .eq('org_id', profile.organization_id)
    .single()

  if (error || !machine) notFound()

  // Druckwerke + Fixed Slots separat laden (vermeidet PostgREST-Ambiguität bei tiefen Joins)
  const { data: druckwerke } = await supabase
    .from('flexo_druckwerke')
    .select('id, position, label, color_hint')
    .eq('machine_id', id)
    .order('position')

  const dwIds = (druckwerke ?? []).map(d => d.id)
  const { data: fixedSlots } = dwIds.length > 0
    ? await supabase
        .from('flexo_fixed_slots')
        .select('id, druckwerk_id, label, sort_order')
        .in('druckwerk_id', dwIds)
        .order('sort_order')
    : { data: [] }

  // Alle Asset-Verknüpfungen aus Junction-Tabelle laden
  const fixedSlotIds = (fixedSlots ?? []).map(s => s.id)
  const { data: slotAssetLinks } = fixedSlotIds.length > 0
    ? await supabase
        .from('flexo_slot_assets')
        .select('slot_id, asset_id')
        .in('slot_id', fixedSlotIds)
        .order('sort_order')
    : { data: [] }

  const allAssetIds = [...new Set((slotAssetLinks ?? []).map((sa: any) => sa.asset_id))]
  const { data: slotAssets } = allAssetIds.length > 0
    ? await supabase.from('assets').select('id, title').in('id', allAssetIds)
    : { data: [] }

  const assetNameMap = Object.fromEntries((slotAssets ?? []).map((a: any) => [a.id, a.title]))

  // slot_id → [{ id, name }]
  const slotAssetsMap: Record<string, { id: string; name: string }[]> = {}
  for (const sa of (slotAssetLinks ?? [])) {
    if (!slotAssetsMap[(sa as any).slot_id]) slotAssetsMap[(sa as any).slot_id] = []
    slotAssetsMap[(sa as any).slot_id].push({ id: (sa as any).asset_id, name: assetNameMap[(sa as any).asset_id] ?? '?' })
  }

  // Vorlagen dieser Maschine
  const { data: templates } = await supabase
    .from('flexo_templates')
    .select('id, name, description, is_active, created_at')
    .eq('primary_machine_id', id)
    .order('created_at')

  // Letzte Rüstvorgänge
  const { data: setups } = await supabase
    .from('flexo_setups')
    .select('id, name, job_number, status, planned_at, created_at')
    .eq('machine_id', id)
    .order('created_at', { ascending: false })
    .limit(10)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canEdit = ['admin', 'superadmin'].includes((profile as any).app_role)

  // Diagram-Daten (serialisierbar für Client Component)
  const diagramDWs = (druckwerke ?? []).map(dw => ({
    id: dw.id,
    position: dw.position,
    label: dw.label,
    color_hint: dw.color_hint,
    slots: (fixedSlots ?? [])
      .filter(s => s.druckwerk_id === dw.id)
      .map(s => ({
        id: s.id,
        label: s.label,
        sort_order: s.sort_order,
        assets: slotAssetsMap[s.id] ?? [],
      })),
  }))

  const statusColor: Record<string, string> = {
    planned: '#0099cc', in_progress: '#f59e0b', completed: '#34d399', cancelled: '#6b7280',
  }

  return (
    <div style={{ padding: '28px 24px 60px', maxWidth: 960 }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 20 }}>
        <Link href="/flexodruck" style={{ color: '#6b7280', fontSize: 13, textDecoration: 'none', fontFamily: 'Arial, sans-serif' }}>
          ← {t('flexodruck.machines')}
        </Link>
      </div>

      {/* Machine Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, flexShrink: 0, overflow: 'hidden',
            background: 'linear-gradient(135deg, #003366, #0099cc)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {(machine as any).image_url ? (
              <img src={(machine as any).image_url} alt={machine.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
                stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="10" rx="2"/>
                <path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"/>
                <line x1="6" y1="12" x2="6.01" y2="12" strokeWidth="3"/>
                <line x1="10" y1="12" x2="14" y2="12"/>
              </svg>
            )}
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#003366', margin: '0 0 2px', fontFamily: 'Arial, sans-serif' }}>
              {machine.name}
            </h1>
            {(machine.manufacturer || machine.model) && (
              <p style={{ fontSize: 13, color: '#6b7280', margin: 0, fontFamily: 'Arial, sans-serif' }}>
                {[machine.manufacturer, machine.model].filter(Boolean).join(' · ')}
              </p>
            )}
            <p style={{ fontSize: 12, color: '#0099cc', margin: '4px 0 0', fontFamily: 'Arial, sans-serif' }}>
              {machine.num_druckwerke} {t('flexodruck.druckwerke')}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <Link href={`/flexodruck/ruestung/neu?machine=${id}`} style={{
            background: '#003366', color: 'white',
            padding: '9px 18px', borderRadius: 50,
            fontSize: 13, fontWeight: 700,
            fontFamily: 'Arial, sans-serif', textDecoration: 'none',
          }}>
            ▶ {t('flexodruck.newSetup')}
          </Link>
          {canEdit && (
            <Link href={`/flexodruck/maschinen/${id}/bearbeiten`} style={{
              background: '#f4f6f9', color: '#003366',
              padding: '9px 18px', borderRadius: 50,
              border: '1px solid #c8d4e8',
              fontSize: 13, fontWeight: 700,
              fontFamily: 'Arial, sans-serif', textDecoration: 'none',
            }}>
              ✎ Bearbeiten
            </Link>
          )}
          {canEdit && (
            <Link href={`/flexodruck/maschinen/${id}/vorlagen/neu`} style={{
              background: '#f4f6f9', color: '#003366',
              padding: '9px 18px', borderRadius: 50,
              border: '1px solid #c8d4e8',
              fontSize: 13, fontWeight: 700,
              fontFamily: 'Arial, sans-serif', textDecoration: 'none',
            }}>
              + {t('flexodruck.newTemplate')}
            </Link>
          )}
        </div>
      </div>

      {/* Visuelles Maschinendiagramm */}
      <MachineDiagram druckwerke={diagramDWs} canEdit={canEdit} />

      {/* Vorlagen + Rüstvorgänge */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Vorlagen */}
          <div>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: '#003366', margin: '0 0 12px', fontFamily: 'Arial, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {t('flexodruck.templates')}
            </h2>
            {(!templates || templates.length === 0) ? (
              <div style={{
                background: 'white', borderRadius: 12, border: '1px solid #c8d4e8',
                padding: '24px', textAlign: 'center',
              }}>
                <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 10px', fontFamily: 'Arial, sans-serif' }}>
                  {t('flexodruck.noTemplates')}
                </p>
                {canEdit && (
                  <Link href={`/flexodruck/maschinen/${id}/vorlagen/neu`} style={{
                    fontSize: 13, color: '#0099cc', fontFamily: 'Arial, sans-serif', textDecoration: 'none', fontWeight: 700,
                  }}>
                    + {t('flexodruck.newTemplate')}
                  </Link>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {templates.map((tpl: TemplateData) => (
                  <Link key={tpl.id} href={`/flexodruck/vorlagen/${tpl.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{
                      background: 'white', borderRadius: 12, border: '1px solid #c8d4e8',
                      padding: '14px 16px', cursor: 'pointer',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#003366', fontFamily: 'Arial, sans-serif' }}>
                            {tpl.name}
                          </p>
                          {tpl.description && (
                            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280', fontFamily: 'Arial, sans-serif' }}>
                              {tpl.description}
                            </p>
                          )}
                        </div>
                        {tpl.is_active && (
                          <span style={{
                            fontSize: 10, fontWeight: 700, color: '#34d399',
                            background: '#d1fae5', padding: '2px 8px', borderRadius: 20,
                            fontFamily: 'Arial, sans-serif',
                          }}>
                            {t('flexodruck.active')}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Letzte Rüstvorgänge */}
          <div>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: '#003366', margin: '0 0 12px', fontFamily: 'Arial, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {t('flexodruck.setups')}
            </h2>
            {(!setups || setups.length === 0) ? (
              <div style={{
                background: 'white', borderRadius: 12, border: '1px solid #c8d4e8',
                padding: '24px', textAlign: 'center',
              }}>
                <p style={{ color: '#6b7280', fontSize: 13, margin: 0, fontFamily: 'Arial, sans-serif' }}>
                  {t('flexodruck.noSetups')}
                </p>
              </div>
            ) : (
              <div style={{ background: 'white', borderRadius: 12, border: '1px solid #c8d4e8', overflow: 'hidden' }}>
                {setups.map((s, i) => (
                  <Link key={s.id} href={`/flexodruck/ruestung/${s.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{
                      padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
                      borderBottom: i < setups.length - 1 ? '1px solid #e8edf4' : 'none',
                    }}>
                      <div style={{
                        width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                        background: statusColor[s.status] ?? '#6b7280',
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#003366', fontFamily: 'Arial, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.name}
                        </p>
                        <p style={{ margin: 0, fontSize: 11, color: '#6b7280', fontFamily: 'Arial, sans-serif' }}>
                          {new Date(s.created_at).toLocaleDateString('de-DE')}
                          {s.job_number && ` · #${s.job_number}`}
                        </p>
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 700, fontFamily: 'Arial, sans-serif',
                        color: statusColor[s.status],
                        background: statusColor[s.status] + '18',
                        padding: '2px 8px', borderRadius: 20, flexShrink: 0,
                      }}>
                        {t(`flexodruck.${s.status}` as Parameters<typeof t>[0])}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────

type TemplateData = { id: string; name: string; description: string | null; is_active: boolean; created_at: string }
