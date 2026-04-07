import { createClient } from '@/lib/supabase/server'
import { OrganisationTree } from './organisation-tree'

export default async function OrganisationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, full_name')
    .eq('id', user!.id)
    .single()

  const orgId = profile?.organization_id ?? ''

  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', orgId)
    .single()

  const [{ data: locations }, { data: halls }, { data: areas }] = await Promise.all([
    supabase.from('locations').select('*').eq('organization_id', orgId).order('name'),
    supabase.from('halls').select('*').eq('organization_id', orgId).order('name'),
    supabase.from('areas').select('*').eq('organization_id', orgId).order('name'),
  ])

  return (
    <div style={{ padding: '24px 16px', fontFamily: 'Arial, sans-serif', maxWidth: 560 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#000000', marginBottom: 4 }}>
        Organisation
      </h1>
      <p style={{ fontSize: 13, color: '#666666', marginBottom: 24, margin: '0 0 24px' }}>
        {org?.name ?? ''}
      </p>

      <OrganisationTree
        organizationId={orgId}
        locations={locations ?? []}
        halls={halls ?? []}
        areas={areas ?? []}
      />
    </div>
  )
}
