import { createClient } from '@/lib/supabase/server'
import { OrganisationTree } from './organisation-tree'
import { getRole } from '@/lib/get-role'
import { can } from '@/lib/permissions'
import { getTranslations } from 'next-intl/server'

export default async function OrganisationPage() {
  const supabase = await createClient()
  const t = await getTranslations()
  const { data: { user } } = await supabase.auth.getUser()
  const role = await getRole()
  const canEdit = can(role).editOrgStructure

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
      <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ds-text)', marginBottom: 4 }}>
        {t('organisation.title')}
      </h1>
      <p style={{ fontSize: 13, color: '#666666', margin: '0 0 24px' }}>
        {org?.name ?? ''}
      </p>

      <OrganisationTree
        organizationId={orgId}
        locations={locations ?? []}
        halls={halls ?? []}
        areas={areas ?? []}
        canEdit={canEdit}
      />
    </div>
  )
}
