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

  return <AssetEditForm asset={asset} />
}
