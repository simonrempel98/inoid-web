import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const BUCKETS = ['asset-images', 'service-files', 'org-files']

export async function DELETE() {
  // Platform-Admin prüfen
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })
  const { data: profile } = await supabase
    .from('profiles').select('is_platform_admin').eq('id', user.id).single()
  if (!profile?.is_platform_admin) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

  const admin = createAdminClient()
  const results: Record<string, number> = {}

  for (const bucket of BUCKETS) {
    let deleted = 0
    let offset = 0
    const limit = 100

    while (true) {
      const { data: files, error } = await admin.storage
        .from(bucket)
        .list('', { limit, offset })

      if (error || !files || files.length === 0) break

      // Rekursiv alle Unterordner durchgehen
      const toDelete: string[] = []
      const toExplore: string[] = []

      for (const f of files) {
        if (f.id) {
          toDelete.push(f.name)
        } else {
          toExplore.push(f.name)
        }
      }

      // Unterordner rekursiv auflisten
      for (const folder of toExplore) {
        const paths = await listAllFiles(admin, bucket, folder)
        toDelete.push(...paths)
      }

      if (toDelete.length > 0) {
        await admin.storage.from(bucket).remove(toDelete)
        deleted += toDelete.length
      }

      if (files.length < limit) break
      offset += limit
    }

    results[bucket] = deleted
  }

  return NextResponse.json({ success: true, deleted: results })
}

async function listAllFiles(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  bucket: string,
  prefix: string
): Promise<string[]> {
  const paths: string[] = []
  let offset = 0
  const limit = 100

  while (true) {
    const { data: files, error } = await admin.storage
      .from(bucket)
      .list(prefix, { limit, offset })

    if (error || !files || files.length === 0) break

    for (const f of files) {
      const fullPath = `${prefix}/${f.name}`
      if (f.id) {
        paths.push(fullPath)
      } else {
        const sub = await listAllFiles(admin, bucket, fullPath)
        paths.push(...sub)
      }
    }

    if (files.length < limit) break
    offset += limit
  }

  return paths
}
