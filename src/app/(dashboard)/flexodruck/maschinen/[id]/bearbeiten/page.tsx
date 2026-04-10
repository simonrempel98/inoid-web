// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { MachineEditClient } from './machine-edit-client'

export default async function MachineEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('organization_id, app_role').eq('id', user.id).single()
  if (!['admin', 'superadmin'].includes(profile?.app_role ?? '')) redirect('/flexodruck')

  const orgId = profile!.organization_id

  // Maschine laden
  const { data: machine, error } = await supabase
    .from('flexo_machines')
    .select('id, name, manufacturer, model, num_druckwerke, notes, is_active, image_url')
    .eq('id', id)
    .eq('org_id', orgId)
    .single()

  if (error || !machine) notFound()

  // Druckwerke laden
  const { data: druckwerke } = await supabase
    .from('flexo_druckwerke')
    .select('id, position, label, color_hint')
    .eq('machine_id', id)
    .order('position')

  // Fixed Slots pro Druckwerk laden
  const dwIds = (druckwerke ?? []).map(d => d.id)
  const { data: slots } = dwIds.length > 0
    ? await supabase
        .from('flexo_fixed_slots')
        .select('id, druckwerk_id, label, sort_order, asset_id')
        .in('druckwerk_id', dwIds)
        .order('sort_order')
    : { data: [] }

  const druckwerkeWithSlots = (druckwerke ?? []).map(dw => ({
    ...dw,
    slots: (slots ?? []).filter(s => s.druckwerk_id === dw.id),
  }))

  return (
    <MachineEditClient
      machine={machine}
      druckwerke={druckwerkeWithSlots}
      backHref={`/flexodruck/maschinen/${id}`}
    />
  )
}
