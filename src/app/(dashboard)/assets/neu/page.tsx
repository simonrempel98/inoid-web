import { createClient } from '@/lib/supabase/server'
import { AssetForm } from './asset-form'
import { Lock } from 'lucide-react'

export default async function NeuesAssetPage() {
  const supabase = await createClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('asset_limit')
    .single()

  const { count: assetCount } = await supabase
    .from('assets')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null)

  const limitReached = org?.asset_limit !== -1 &&
    (assetCount ?? 0) >= (org?.asset_limit ?? 20)

  if (limitReached) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ marginBottom: 16 }}><Lock size={48} style={{ color: '#003366' }} /></div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#000', marginBottom: 8 }}>
          Asset-Limit erreicht
        </h1>
        <p style={{ color: '#666', marginBottom: 24 }}>
          Du hast {assetCount} von {org?.asset_limit} Assets genutzt.
        </p>
        <a href="/settings/billing" style={{
          backgroundColor: '#003366', color: 'white',
          padding: '12px 28px', borderRadius: 50,
          textDecoration: 'none', fontWeight: 700, fontSize: 14,
        }}>
          Plan upgraden
        </a>
      </div>
    )
  }

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles').select('organization_id').eq('id', user!.id).single()

  const orgId = profile?.organization_id ?? ''
  const [{ data: locations }, { data: halls }, { data: areas }] = await Promise.all([
    supabase.from('locations').select('id, name').eq('organization_id', orgId).order('name'),
    supabase.from('halls').select('id, name, location_id, locations(name)').eq('organization_id', orgId).order('name'),
    supabase.from('areas').select('id, name, hall_id, halls(name)').eq('organization_id', orgId).order('name'),
  ])

  return <AssetForm locations={locations ?? []} halls={(halls ?? []) as any} areas={(areas ?? []) as any} />
}
