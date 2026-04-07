import { createClient } from '@/lib/supabase/server'
import { CreateTeamForm } from './create-team-form'

export default async function TeamsNeuPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user!.id)
    .single()

  const orgId = profile?.organization_id ?? ''

  const [
    { data: locations },
    { data: halls },
    { data: areas },
    { data: roles },
  ] = await Promise.all([
    supabase.from('locations').select('id, name').eq('organization_id', orgId).order('name'),
    supabase.from('halls').select('id, name, location_id, locations(name)').eq('organization_id', orgId).order('name'),
    supabase.from('areas').select('id, name, hall_id, halls(name)').eq('organization_id', orgId).order('name'),
    supabase.from('roles').select('id, name').eq('organization_id', orgId).order('name'),
  ])

  return (
    <CreateTeamForm
      locations={locations ?? []}
      halls={(halls ?? []) as any}
      areas={(areas ?? []) as any}
      roles={roles ?? []}
    />
  )
}
