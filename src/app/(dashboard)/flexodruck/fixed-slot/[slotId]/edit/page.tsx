// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { FixedSlotEditClient } from './fixed-slot-edit-client'

export default async function FixedSlotEditPage({ params }: { params: Promise<{ slotId: string }> }) {
  const { slotId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('organization_id, app_role').eq('id', user.id).single()
  if (!['admin', 'superadmin', 'technician'].includes(profile?.app_role ?? '')) redirect('/flexodruck')

  const orgId = profile!.organization_id

  // Slot laden
  const { data: slot, error } = await supabase
    .from('flexo_fixed_slots')
    .select('id, label, druckwerk_id')
    .eq('id', slotId)
    .eq('org_id', orgId)
    .single()

  if (error || !slot) notFound()

  // Druckwerk laden
  const { data: dw } = await supabase
    .from('flexo_druckwerke')
    .select('id, position, label, machine_id')
    .eq('id', slot.druckwerk_id)
    .single()

  if (!dw) notFound()

  // Maschine laden
  const { data: machine } = await supabase
    .from('flexo_machines')
    .select('id, name')
    .eq('id', dw.machine_id)
    .single()

  // Aktuell verknüpfte Assets (aus Junction-Tabelle)
  const { data: slotAssetLinks } = await supabase
    .from('flexo_slot_assets')
    .select('asset_id')
    .eq('slot_id', slotId)
    .order('sort_order')

  const currentAssetIds = (slotAssetLinks ?? []).map((sa: any) => sa.asset_id)

  const { data: currentAssetDetails } = currentAssetIds.length > 0
    ? await supabase.from('assets').select('id, title, serial_number').in('id', currentAssetIds)
    : { data: [] }

  // Selbe Reihenfolge beibehalten wie sort_order
  const currentAssets = currentAssetIds.map((aid: string) => {
    const a = (currentAssetDetails ?? []).find((x: any) => x.id === aid)
    return { id: aid, name: a?.title ?? '?', serial_number: a?.serial_number ?? null }
  })

  // Alle Assets für Picker
  const { data: assets } = await supabase
    .from('assets')
    .select('id, title, serial_number, article_number, category, manufacturer, status')
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .order('title')
    .limit(1000)

  return (
    <FixedSlotEditClient
      slotId={slotId}
      slotLabel={slot.label}
      currentAssets={currentAssets}
      assets={(assets ?? []).map((a: any) => ({ ...a, name: a.title }))}
      backHref={`/flexodruck/maschinen/${machine?.id}`}
      dwLabel={dw.label ?? `Druckwerk ${dw.position}`}
      machineName={machine?.name ?? ''}
    />
  )
}
