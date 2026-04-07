import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { LocationDetail } from './location-detail'

export default async function StandortDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: location } = await supabase
    .from('locations')
    .select('*')
    .eq('id', id)
    .single()

  if (!location) notFound()

  // Hallen dieses Standorts (für Übersicht)
  const { data: halls } = await supabase
    .from('halls')
    .select('id, name, usage_type, area_sqm')
    .eq('location_id', id)
    .order('name')

  return <LocationDetail location={location} halls={halls ?? []} />
}
