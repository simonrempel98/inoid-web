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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!['admin', 'superadmin'].includes((profile as any)?.app_role ?? '')) redirect('/flexodruck')

  // Maschine mit Druckwerken laden
  const { data: machine, error } = await supabase
    .from('flexo_machines')
    .select('id, name, num_druckwerke, flexo_druckwerke(id, position, label)')
    .eq('id', machineId)
    .eq('org_id', profile!.organization_id)
    .single()

  if (error || !machine) notFound()

  // Alle Maschinen für Freigabe-Option
  const { data: allMachines } = await supabase
    .from('flexo_machines')
    .select('id, name')
    .eq('org_id', profile!.organization_id)
    .eq('is_active', true)
    .neq('id', machineId)
    .order('name')

  // Assets
  const { data: assets } = await supabase
    .from('assets')
    .select('id, name, serial_number')
    .eq('organization_id', profile!.organization_id)
    .is('deleted_at', null)
    .order('name')
    .limit(500)

  // Sort Druckwerke
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dws = [...((machine as any).flexo_druckwerke ?? [])].sort((a: { position: number }, b: { position: number }) => a.position - b.position)

  return (
    <NeueVorlageClient
      machine={{ id: machine.id, name: machine.name, num_druckwerke: machine.num_druckwerke }}
      druckwerke={dws}
      otherMachines={allMachines ?? []}
      assets={assets ?? []}
    />
  )
}
