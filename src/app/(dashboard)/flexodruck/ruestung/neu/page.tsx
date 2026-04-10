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

  // Alle Maschinen + ihre Vorlagen laden
  const { data: machines } = await supabase
    .from('flexo_machines')
    .select(`
      id, name, manufacturer, model, num_druckwerke,
      flexo_templates(id, name, is_active)
    `)
    .eq('org_id', profile.organization_id)
    .order('name')

  return (
    <NeuesRuestungClient
      machines={machines ?? []}
      preselectedMachineId={preselectedMachine ?? null}
      preselectedTemplateId={preselectedTemplate ?? null}
    />
  )
}
