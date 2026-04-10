// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { MachineClient } from './machine-client'

export default async function MaschinenDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('organization_id, app_role').eq('id', user.id).single()
  if (!profile?.organization_id) redirect('/dashboard')

  const t = await getTranslations()

  // Maschine mit allen Relationen laden
  const { data: machine, error } = await supabase
    .from('flexo_machines')
    .select(`
      id, name, manufacturer, model, num_druckwerke, notes, is_active, created_at,
      flexo_druckwerke(
        id, position, label, color_hint,
        flexo_fixed_slots(
          id, label, sort_order, asset_id,
          assets(id, name, serial_number)
        )
      ),
      flexo_templates(id, name, description, is_active, created_at)
    `)
    .eq('id', id)
    .eq('org_id', profile.organization_id)
    .single()

  if (error || !machine) notFound()

  // Letzte Rüstvorgänge
  const { data: setups } = await supabase
    .from('flexo_setups')
    .select('id, name, job_number, status, planned_at, created_at')
    .eq('machine_id', id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Verfügbare Assets für Asset-Suche (Fix-Slot Zuweisung)
  const { data: assets } = await supabase
    .from('assets')
    .select('id, name, serial_number')
    .eq('organization_id', profile.organization_id)
    .is('deleted_at', null)
    .order('name')
    .limit(200)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canEdit = ['admin', 'superadmin'].includes((profile as any).app_role)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const machineData = machine as any
  // Sort druckwerke by position
  machineData.flexo_druckwerke?.sort((a: { position: number }, b: { position: number }) => a.position - b.position)

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
            width: 52, height: 52, borderRadius: 14, flexShrink: 0,
            background: 'linear-gradient(135deg, #003366, #0099cc)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="10" rx="2"/>
              <path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"/>
              <line x1="6" y1="12" x2="6.01" y2="12" strokeWidth="3"/>
              <line x1="10" y1="12" x2="14" y2="12"/>
            </svg>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* LEFT: Druckwerke */}
        <div>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: '#003366', margin: '0 0 12px', fontFamily: 'Arial, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {t('flexodruck.druckwerke')}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {machineData.flexo_druckwerke?.map((dw: DruckwerkData) => (
              <DruckwerkCard key={dw.id} dw={dw} assets={assets ?? []} canEdit={canEdit} t={t} />
            ))}
          </div>
        </div>

        {/* RIGHT: Vorlagen + Rüstvorgänge */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Vorlagen */}
          <div>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: '#003366', margin: '0 0 12px', fontFamily: 'Arial, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {t('flexodruck.templates')}
            </h2>
            {(!machine.flexo_templates || machine.flexo_templates.length === 0) ? (
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
                {machineData.flexo_templates?.map((tpl: TemplateData) => (
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

      {/* Client-Teil für interaktive Elemente */}
      <MachineClient machineId={id} canEdit={canEdit} />
    </div>
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────

type AssetRef = { id: string; name: string; serial_number: string | null }
type FixedSlot = { id: string; label: string; sort_order: number; asset_id: string | null; assets: AssetRef | null }
type DruckwerkData = { id: string; position: number; label: string | null; color_hint: string | null; flexo_fixed_slots: FixedSlot[] }
type TemplateData = { id: string; name: string; description: string | null; is_active: boolean; created_at: string }

// ─── Druckwerk-Karte (Server Component) ────────────────────────────────────

function DruckwerkCard({
  dw,
  assets,
  canEdit,
  t,
}: {
  dw: DruckwerkData
  assets: AssetRef[]
  canEdit: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any
}) {
  const sorted = [...(dw.flexo_fixed_slots ?? [])].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div style={{
      background: 'white', borderRadius: 12, border: '1px solid #c8d4e8', overflow: 'hidden',
    }}>
      {/* DW Header */}
      <div style={{
        background: dw.color_hint ? dw.color_hint + '18' : '#f4f6f9',
        borderBottom: '1px solid #c8d4e8',
        padding: '10px 14px',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{
          width: 26, height: 26, borderRadius: 6,
          background: dw.color_hint ?? '#003366',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 11, fontWeight: 900, color: 'white', fontFamily: 'Arial, sans-serif' }}>
            {dw.position}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#003366', fontFamily: 'Arial, sans-serif' }}>
          {dw.label ?? `${t('flexodruck.druckwerk')} ${dw.position}`}
        </p>
      </div>

      {/* Feste Slots */}
      <div style={{ padding: '10px 14px' }}>
        <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'Arial, sans-serif' }}>
          {t('flexodruck.fixedSlots')}
        </p>
        {sorted.map(slot => (
          <FixedSlotRow key={slot.id} slot={slot} assets={assets} canEdit={canEdit} t={t} />
        ))}
      </div>
    </div>
  )
}

// ─── Fester Slot Row ──────────────────────────────────────────────────────────

function FixedSlotRow({
  slot,
  assets,
  canEdit,
  t,
}: {
  slot: FixedSlot
  assets: AssetRef[]
  canEdit: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 0',
      borderBottom: '1px solid #f4f6f9',
    }}>
      <div style={{
        width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
        background: slot.asset_id ? '#34d399' : '#d1d5db',
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#003366', fontFamily: 'Arial, sans-serif' }}>
          {slot.label}
        </p>
        {slot.assets ? (
          <p style={{ margin: 0, fontSize: 11, color: '#0099cc', fontFamily: 'Arial, sans-serif' }}>
            {slot.assets.name}
            {slot.assets.serial_number && ` · ${slot.assets.serial_number}`}
          </p>
        ) : (
          <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', fontFamily: 'Arial, sans-serif' }}>
            {t('flexodruck.noLinkedAsset')}
          </p>
        )}
      </div>
      {canEdit && (
        <Link
          href={`/flexodruck/fixed-slot/${slot.id}/edit`}
          style={{ fontSize: 11, color: '#0099cc', textDecoration: 'none', fontFamily: 'Arial, sans-serif', flexShrink: 0 }}
        >
          {slot.asset_id ? 'ändern' : 'verknüpfen'}
        </Link>
      )}
    </div>
  )
}
