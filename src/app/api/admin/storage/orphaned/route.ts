import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })
  const { data: profile } = await supabase.from('profiles').select('is_platform_admin').eq('id', user.id).single()
  if (!profile?.is_platform_admin) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

  const admin = createAdminClient()

  // Alle verwaisten Dateien via RPC laden
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: orphaned, error } = await (admin as any).rpc('admin_get_unattributed_storage') as {
    data: { bucket_id: string; file_path: string; bytes: number }[] | null
    error: unknown
  }

  if (error) return NextResponse.json({ error: 'RPC fehlgeschlagen' }, { status: 500 })
  if (!orphaned || orphaned.length === 0) return NextResponse.json({ success: true, deleted: 0 })

  // Nach Bucket gruppieren
  const byBucket: Record<string, string[]> = {}
  for (const f of orphaned) {
    if (!byBucket[f.bucket_id]) byBucket[f.bucket_id] = []
    byBucket[f.bucket_id].push(f.file_path)
  }

  let totalDeleted = 0
  for (const [bucket, paths] of Object.entries(byBucket)) {
    // In Batches à 100 löschen (Supabase-Limit)
    for (let i = 0; i < paths.length; i += 100) {
      const batch = paths.slice(i, i + 100)
      await admin.storage.from(bucket).remove(batch)
      totalDeleted += batch.length
    }
  }

  return NextResponse.json({ success: true, deleted: totalDeleted })
}
