import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { TeamDetail } from './team-detail'

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user!.id)
    .single()

  const orgId = profile?.organization_id ?? ''

  const { data: team } = await supabase
    .from('teams')
    .select('*, departments(name, divisions(name)), areas(id, name), halls(id, name), locations(id, name)')
    .eq('id', id)
    .single()

  if (!team) notFound()

  const [{ data: members }, { data: locations }, { data: halls }, { data: areas }, { data: roles }] = await Promise.all([
    supabase.from('organization_members')
      .select('id, email, invitation_token, invitation_expires_at, invitation_accepted_at, roles(name)')
      .eq('organization_id', orgId).eq('team_id', id).order('created_at'),
    supabase.from('locations').select('id, name').eq('organization_id', orgId).order('name'),
    supabase.from('halls').select('id, name, location_id, locations(name)').eq('organization_id', orgId).order('name'),
    supabase.from('areas').select('id, name, hall_id, halls(name)').eq('organization_id', orgId).order('name'),
    supabase.from('roles').select('id, name').eq('organization_id', orgId).order('name'),
  ])

  return (
    <TeamDetail
      team={team as any}
      members={(members ?? []) as any}
      locations={(locations ?? []) as any}
      halls={(halls ?? []) as any}
      areas={(areas ?? []) as any}
      roles={roles ?? []}
      organizationId={orgId}
    />
  )
}
