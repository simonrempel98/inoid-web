import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { TeamDetail } from './team-detail'
import type { AppRole } from '@/lib/permissions'

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
    .select('organization_id, app_role')
    .eq('id', user!.id)
    .single()

  const orgId = profile?.organization_id ?? ''
  const currentUserRole = (profile?.app_role as AppRole) ?? 'leser'

  const { data: org } = await supabase
    .from('organizations').select('features').eq('id', orgId).single()
  const features = (org?.features as Record<string, boolean>) ?? {}
  const showChat = features.teamchat !== false

  const { data: team } = await supabase
    .from('teams')
    .select('*, departments(name, divisions(name)), areas(id, name), halls(id, name), locations(id, name)')
    .eq('id', id)
    .single()

  if (!team) notFound()

  const [
    { data: members },
    { data: locations },
    { data: halls },
    { data: areas },
    { data: roles },
  ] = await Promise.all([
    supabase.from('organization_members')
      .select('id, user_id, email, first_name, last_name, invitation_accepted_at, roles(id, name)')
      .eq('organization_id', orgId)
      .order('created_at'),
    supabase.from('locations').select('id, name').eq('organization_id', orgId).order('name'),
    supabase.from('halls').select('id, name, location_id, locations(name)').eq('organization_id', orgId).order('name'),
    supabase.from('areas').select('id, name, hall_id, halls(name)').eq('organization_id', orgId).order('name'),
    supabase.from('roles').select('id, name').eq('organization_id', orgId).order('name'),
  ])

  // app_role aus profiles holen und in members einmischen
  const userIds = (members ?? []).map(m => m.user_id).filter(Boolean) as string[]
  const { data: profileRoles } = userIds.length > 0
    ? await supabase.from('profiles').select('id, app_role').in('id', userIds)
    : { data: [] }

  const roleByUserId = Object.fromEntries((profileRoles ?? []).map(p => [p.id, p.app_role as AppRole]))

  const membersWithRole = (members ?? []).map(m => ({
    ...m,
    app_role: (m.user_id ? roleByUserId[m.user_id] : null) ?? 'leser' as AppRole,
  }))

  return (
    <TeamDetail
      team={team as any}
      members={membersWithRole as any}
      locations={(locations ?? []) as any}
      halls={(halls ?? []) as any}
      areas={(areas ?? []) as any}
      roles={roles ?? []}
      organizationId={orgId}
      currentUserRole={currentUserRole}
      showChat={showChat}
    />
  )
}
