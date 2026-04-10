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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!['admin', 'superadmin'].includes((profile as any)?.app_role ?? '')) redirect('/flexodruck')

  // Slot mit Druckwerk und Maschine laden
  const { data: slot, error } = await supabase
    .from('flexo_fixed_slots')
    .select(`
      id, label, asset_id,
      assets(id, name, serial_number),
      flexo_druckwerke(
        id, position, label,
        flexo_machines(id, name)
      )
    `)
    .eq('id', slotId)
    .eq('org_id', profile!.organization_id)
    .single()

  if (error || !slot) notFound()

  // Assets für Dropdown
  const { data: assets } = await supabase
    .from('assets')
    .select('id, name, serial_number')
    .eq('organization_id', profile!.organization_id)
    .is('deleted_at', null)
    .order('name')
    .limit(500)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const slotData = slot as any
  const machineId = slotData.flexo_druckwerke?.flexo_machines?.id

  return (
    <FixedSlotEditClient
      slotId={slotId}
      slotLabel={slot.label}
      currentAssetId={slot.asset_id}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      currentAssetName={(slot as any).assets?.name ?? null}
      assets={assets ?? []}
      backHref={`/flexodruck/maschinen/${machineId}`}
      dwLabel={slotData.flexo_druckwerke?.label ?? `Druckwerk ${slotData.flexo_druckwerke?.position}`}
      machineName={slotData.flexo_druckwerke?.flexo_machines?.name ?? ''}
    />
  )
}
