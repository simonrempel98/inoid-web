import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { HallDetail } from './hall-detail'

export default async function HalleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: hall } = await supabase
    .from('halls')
    .select('*, locations(id, name)')
    .eq('id', id)
    .single()

  if (!hall) notFound()

  // Bereiche dieser Halle
  const { data: areas } = await supabase
    .from('areas')
    .select('id, name, process_type, machine_count, responsible_name')
    .eq('hall_id', id)
    .order('name')

  return <HallDetail hall={hall} areas={areas ?? []} />
}
