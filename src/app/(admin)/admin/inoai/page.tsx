// @ts-nocheck
import { createAdminClient } from '@/lib/supabase/admin'
import { INOaiAdminClient } from './inoai-admin-client'

export default async function AdminINOaiPage() {
  const admin = createAdminClient()

  const { data: rows } = await admin
    .from('inometa_knowledge')
    .select('source_type, created_at')

  const counts: Record<string, number> = {}
  let total = 0
  for (const row of rows ?? []) {
    counts[row.source_type] = (counts[row.source_type] ?? 0) + 1
    total++
  }

  const lastUpdated = rows?.length
    ? rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
    : null

  return <INOaiAdminClient initialStats={{ total, counts, lastUpdated }} />
}
