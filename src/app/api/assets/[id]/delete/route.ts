import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: assetId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  // Prüfen ob das Asset dem User gehört (gleiche Org)
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) {
    return NextResponse.json({ error: 'Keine Organisation' }, { status: 403 })
  }

  // Asset laden (image_urls + document_urls + org check)
  const { data: asset, error: fetchError } = await supabase
    .from('assets')
    .select('id, image_urls, document_urls, organization_id')
    .eq('id', assetId)
    .single()

  if (fetchError || !asset) {
    return NextResponse.json({ error: 'Asset nicht gefunden' }, { status: 404 })
  }

  if (asset.organization_id !== profile.organization_id) {
    return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })
  }

  const admin = createAdminClient()

  // Bilder aus asset-images löschen
  const imageUrls: string[] = Array.isArray(asset.image_urls) ? asset.image_urls : []
  if (imageUrls.length > 0) {
    const paths = imageUrls.map(url => {
      const match = url.match(/\/asset-images\/(.+)$/)
      return match ? match[1] : null
    }).filter((p): p is string => p !== null)
    if (paths.length > 0) await admin.storage.from('asset-images').remove(paths)
  }

  // Dokumente aus org-files löschen
  const docUrls: string[] = Array.isArray((asset as any).document_urls) ? (asset as any).document_urls : []
  if (docUrls.length > 0) {
    const paths = docUrls.map(url => {
      const match = url.match(/\/org-files\/(.+)$/)
      return match ? match[1] : null
    }).filter((p): p is string => p !== null)
    if (paths.length > 0) await admin.storage.from('org-files').remove(paths)
  }

  // Service-Anhänge löschen (asset-images: service/{assetId}/... und service-files: service/{assetId}/...)
  for (const bucket of ['asset-images', 'service-files'] as const) {
    const { data: files } = await admin.storage.from(bucket).list(`service/${assetId}`, { limit: 1000 })
    if (files && files.length > 0) {
      const paths: string[] = []
      for (const f of files) {
        if (f.id) {
          paths.push(`service/${assetId}/${f.name}`)
        } else {
          // Unterordner (service/{assetId}/{serviceEntryId}/...)
          const { data: sub } = await admin.storage.from(bucket).list(`service/${assetId}/${f.name}`, { limit: 1000 })
          if (sub) paths.push(...sub.filter(s => s.id).map(s => `service/${assetId}/${f.name}/${s.name}`))
        }
      }
      if (paths.length > 0) await admin.storage.from(bucket).remove(paths)
    }
  }

  // Hard-Delete: CASCADE löscht service_entries, documents, maintenance_schedules, tags usw.
  const { error: deleteError } = await admin
    .from('assets')
    .delete()
    .eq('id', assetId)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  revalidatePath('/dashboard')
  revalidatePath('/assets')

  return NextResponse.json({ success: true })
}
