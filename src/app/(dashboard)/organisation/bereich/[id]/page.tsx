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

  // Assets in diesem Bereich (über area_id falls verknüpft – sonst leer)
  const { data: assets } = await supabase
    .from('assets')
    .select('id, title, status, category')
    .eq('organization_id', area.organization_id)
    .is('deleted_at', null)
    .limit(20)

  return <AreaDetail area={area} />
}
