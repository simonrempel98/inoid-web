import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('is_platform_admin').eq('id', user.id).single()
  if (!profile?.is_platform_admin) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

  const admin = createAdminClient()

  // Alle soft-deleted Assets laden um ihre Storage-Files zu löschen
  const { data: softDeleted } = await admin
    .from('assets')
    .select('id, image_urls')
    .not('deleted_at', 'is', null)

  let filesDeleted = 0

  for (const asset of softDeleted ?? []) {
    const imageUrls: string[] = Array.isArray(asset.image_urls) ? asset.image_urls : []
    if (imageUrls.length > 0) {
      const paths = imageUrls.map(url => {
        const match = url.match(/asset-images\/(.+)$/)
        return match ? match[1] : null
      }).filter((p): p is string => p !== null)

      if (paths.length > 0) {
        await admin.storage.from('asset-images').remove(paths)
        filesDeleted += paths.length
      }
    }
  }

  // Hard-Delete — CASCADE räumt maintenance_schedules, lifecycle_events, service_entries, documents, tags auf
  const { error } = await admin
    .from('assets')
    .delete()
    .not('deleted_at', 'is', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await admin.from('admin_audit_log').insert({
    admin_id: user.id,
    action: 'cleanup_soft_deleted_assets',
    target_type: 'organization',
    details: { assetsDeleted: softDeleted?.length ?? 0, filesDeleted },
  })

  return NextResponse.json({
    assetsDeleted: softDeleted?.length ?? 0,
    filesDeleted,
  })
}
