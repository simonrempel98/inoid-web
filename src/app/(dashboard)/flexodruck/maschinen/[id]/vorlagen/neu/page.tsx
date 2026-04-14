// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { NeueVorlageClient } from './neue-vorlage-client'

export default async function NeueVorlagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: machineId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('organization_id, app_role').eq('id', user.id).single()
  if (!['admin', 'superadmin', 'technician'].includes(profile?.app_role ?? '')) redirect('/flexodruck')

  const orgId = profile!.organization_id

  // Maschine laden
  const { data: machine, error } = await supabase
    .from('flexo_machines')
    .select('id, name, num_druckwerke')
    .eq('id', machineId)
    .eq('org_id', orgId)
    .single()

  if (error || !machine) notFound()

  // Druckwerke laden (flach)
  const { data: druckwerke } = await supabase
    .from('flexo_druckwerke')
    .select('id, position, label, color_hint')
    .eq('machine_id', machineId)
    .order('position')

  // Fixed Slots laden – um Farbe-Slot-Vorhandensein zu erkennen
  const dwIds = (druckwerke ?? []).map(d => d.id)
  const { data: slots } = dwIds.length > 0
    ? await supabase
        .from('flexo_fixed_slots')
        .select('druckwerk_id, sort_order')
        .in('druckwerk_id', dwIds)
    : { data: [] }

  const druckwerkeWithInfo = (druckwerke ?? []).map(dw => ({
    ...dw,
    hasFarbe: (slots ?? []).some(s => s.druckwerk_id === dw.id && s.sort_order === 1),
  }))

  return (
    <NeueVorlageClient
      machine={{ id: machine.id, name: machine.name }}
      druckwerke={druckwerkeWithInfo}
    />
  )
}
