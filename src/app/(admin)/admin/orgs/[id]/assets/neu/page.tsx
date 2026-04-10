import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { AdminAssetForm } from './admin-asset-form'

export default async function AdminAssetNeuPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const [{ data: org }, { data: locations }, { data: halls }, { data: areas }, { data: existingAssets }] = await Promise.all([
    supabase
      .from('organizations')
      .select('id, name, settings')
      .eq('id', id)
      .single(),
    supabase
      .from('locations')
      .select('id, name')
      .eq('organization_id', id)
      .order('name'),
    supabase
      .from('halls')
      .select('id, name, location_id, locations(name)')
      .eq('organization_id', id)
      .order('name'),
    supabase
      .from('areas')
      .select('id, name, hall_id, halls(name)')
      .eq('organization_id', id)
      .order('name'),
    supabase
      .from('assets')
      .select('category')
      .eq('organization_id', id)
      .is('deleted_at', null)
      .not('category', 'is', null),
  ])

  if (!org) notFound()

  const settings = (org.settings as Record<string, unknown>) ?? {}
  const imageMaxDim  = typeof settings.image_max_dim   === 'number' ? settings.image_max_dim   : 1920
  const imageQuality = typeof settings.image_quality   === 'number' ? settings.image_quality   : 82
  const docMaxSizeMb = typeof settings.doc_max_size_mb === 'number' ? settings.doc_max_size_mb : 10

  const categories = [...new Set((existingAssets ?? []).map(a => a.category).filter(Boolean))] as string[]

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Link href={`/admin/orgs/${id}`} style={{ color: '#6b7280', fontSize: 13, textDecoration: 'none' }}>
          ← {org.name}
        </Link>
        <h1 style={{ fontSize: 20, fontWeight: 900, color: 'white', margin: '6px 0 2px' }}>Asset anlegen</h1>
        <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Wird direkt in <span style={{ color: 'white' }}>{org.name}</span> erstellt</p>
      </div>

      <AdminAssetForm
        orgId={id}
        orgName={org.name}
        locations={locations ?? []}
        halls={(halls ?? []) as any}
        areas={(areas ?? []) as any}
        categories={categories}
        imageMaxDim={imageMaxDim}
        imageQuality={imageQuality}
        docMaxSizeMb={docMaxSizeMb}
      />
    </div>
  )
}
