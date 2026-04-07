import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { AreaDetail } from './area-detail'

export default async function BereichDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: area } = await supabase
    .from('areas')
    .select('*, halls(id, name, locations(id, name))')
    .eq('id', id)
    .single()

  if (!area) notFound()

  const { data: org } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', area.organization_id)
    .single()
  const customStatuses = (org?.settings as { custom_statuses?: { value: string; label: string; color: string }[] })?.custom_statuses ?? []

  const { data: assets } = await supabase
    .from('assets')
    .select('id, title, status, category')
    .eq('location_ref', `area:${id}`)
    .is('deleted_at', null)
    .order('title')

  return <AreaDetail area={area} assets={assets ?? []} customStatuses={customStatuses} />
}
