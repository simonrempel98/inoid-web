import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { AssetEditForm } from './asset-edit-form'

export default async function AssetBearbeitenPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: asset } = await supabase
    .from('assets')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (!asset) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles').select('organization_id').eq('id', user!.id).single()

  const orgId = profile?.organization_id ?? ''
  const [{ data: locations }, { data: halls }, { data: areas }, { data: categoryRows }] = await Promise.all([
    supabase.from('locations').select('id, name').eq('organization_id', orgId).order('name'),
    supabase.from('halls').select('id, name, location_id, locations(name)').eq('organization_id', orgId).order('name'),
    supabase.from('areas').select('id, name, hall_id, halls(name)').eq('organization_id', orgId).order('name'),
    supabase.from('assets').select('category').eq('organization_id', orgId).not('category', 'is', null),
  ])

  const categories = [...new Set((categoryRows ?? []).map((r: any) => r.category).filter(Boolean))].sort() as string[]

  return <AssetEditForm
    asset={asset as any}
    locations={locations ?? []}
    halls={(halls ?? []) as any}
    areas={(areas ?? []) as any}
    categories={categories}
  />
}
