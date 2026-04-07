import { createClient } from '@/lib/supabase/server'
import { TeamsTree } from './teams-tree'

export default async function TeamsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user!.id)
    .single()

  const orgId = profile?.organization_id ?? ''

  const [{ data: divisions }, { data: departments }, { data: teams }] = await Promise.all([
    supabase.from('divisions').select('*').eq('organization_id', orgId).order('name'),
    supabase.from('departments').select('*').eq('organization_id', orgId).order('name'),
    supabase.from('teams').select('*, areas(name)').eq('organization_id', orgId).order('name'),
  ])

  return (
    <div style={{ padding: '24px 16px', fontFamily: 'Arial, sans-serif', maxWidth: 560 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#000000', marginBottom: 4 }}>
        Teams
      </h1>
      <p style={{ fontSize: 13, color: '#666666', marginBottom: 24, margin: '0 0 24px' }}>
        Bereiche, Abteilungen und Teams verwalten
      </p>

      <TeamsTree
        organizationId={orgId}
        divisions={divisions ?? []}
        departments={departments ?? []}
        teams={(teams ?? []) as any}
      />
    </div>
  )
}
