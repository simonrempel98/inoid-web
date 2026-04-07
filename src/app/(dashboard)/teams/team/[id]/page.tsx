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
    .select('*, departments(name, divisions(name)), areas(id, name)')
    .eq('id', id)
    .single()

  if (!team) notFound()

  // Mitglieder dieses Teams
  const { data: members } = await supabase
    .from('organization_members')
    .select('id, email, invitation_token, invitation_expires_at, invitation_accepted_at, roles(name)')
    .eq('organization_id', orgId)
    .eq('team_id', id)
    .order('created_at')

  // Alle verfügbaren Bereiche (aus Org-Struktur) für die Zuordnung
  const { data: areas } = await supabase
    .from('areas')
    .select('id, name, halls(name)')
    .eq('organization_id', orgId)
    .order('name')

  // Rollen für die Einladung
  const { data: roles } = await supabase
    .from('roles')
    .select('id, name')
    .eq('organization_id', orgId)
    .order('name')

  return (
    <TeamDetail
      team={team as any}
      members={(members ?? []) as any}
      areas={(areas ?? []) as any}
      roles={roles ?? []}
      organizationId={orgId}
    />
  )
}
