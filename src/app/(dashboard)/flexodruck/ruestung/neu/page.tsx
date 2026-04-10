// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NeuesRuestungClient } from './neues-ruestung-client'

export default async function NeuerRuestvorgangPage({
  searchParams,
}: {
  searchParams: Promise<{ machine?: string; template?: string }>
}) {
  const { machine: preselectedMachine, template: preselectedTemplate } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('organization_id').eq('id', user.id).single()
  if (!profile?.organization_id) redirect('/dashboard')

  const orgId = profile.organization_id

  // Alle Maschinen laden (kein is_active Filter)
  const { data: machinesRaw } = await supabase
    .from('flexo_machines')
    .select('id, name, manufacturer, model, num_druckwerke')
    .eq('org_id', orgId)
    .order('name')

  const machines = machinesRaw ?? []

  // Alle Vorlagen dieser Org laden (flach, kein nested join)
  const machineIds = machines.map(m => m.id)
  const { data: templatesRaw } = machineIds.length > 0
    ? await supabase
        .from('flexo_templates')
        .select('id, name, primary_machine_id')
        .in('primary_machine_id', machineIds)
        .order('name')
    : { data: [] }

  // Templates nach Maschine gruppieren
  const templatesByMachine: Record<string, { id: string; name: string }[]> = {}
  for (const tpl of (templatesRaw ?? [])) {
    if (!templatesByMachine[tpl.primary_machine_id]) templatesByMachine[tpl.primary_machine_id] = []
    templatesByMachine[tpl.primary_machine_id].push({ id: tpl.id, name: tpl.name })
  }

  const machinesWithTemplates = machines.map(m => ({
    ...m,
    templates: templatesByMachine[m.id] ?? [],
  }))

  return (
    <NeuesRuestungClient
      machines={machinesWithTemplates}
      preselectedMachineId={preselectedMachine ?? null}
      preselectedTemplateId={preselectedTemplate ?? null}
    />
  )
}
