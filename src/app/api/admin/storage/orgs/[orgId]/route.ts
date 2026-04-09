import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const BUCKETS = ['asset-images', 'org-files', 'service-files']

async function listAllFiles(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  bucket: string,
  prefix: string
): Promise<string[]> {
  const paths: string[] = []
  let offset = 0
  while (true) {
    const { data: files, error } = await admin.storage.from(bucket).list(prefix, { limit: 100, offset })
    if (error || !files || files.length === 0) break
    for (const f of files) {
      const fullPath = `${prefix}/${f.name}`
      if (f.id) { paths.push(fullPath) }
      else { paths.push(...await listAllFiles(admin, bucket, fullPath)) }
    }
    if (files.length < 100) break
    offset += 100
  }
  return paths
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })
  const { data: profile } = await supabase.from('profiles').select('is_platform_admin').eq('id', user.id).single()
  if (!profile?.is_platform_admin) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

  const admin = createAdminClient()

  // Alle Asset-IDs dieser Org laden
  const { data: assets } = await admin.from('assets').select('id').eq('organization_id', orgId)
  const assetIds = (assets ?? []).map((a: { id: string }) => a.id)

  let totalDeleted = 0

  for (const bucket of BUCKETS) {
    const toDelete: string[] = []
    for (const assetId of assetIds) {
      const paths = await listAllFiles(admin, bucket, `assets/${assetId}`)
      toDelete.push(...paths)
    }
    if (toDelete.length > 0) {
      await admin.storage.from(bucket).remove(toDelete)
      totalDeleted += toDelete.length
    }
  }

  return NextResponse.json({ success: true, deleted: totalDeleted })
}
