// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('is_platform_admin').eq('id', user.id).single()
  if (!profile?.is_platform_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const { data: rows } = await admin
    .from('inometa_knowledge')
    .select('crawler_id, created_at')

  // Counts + letztes Update pro crawler_id
  const perCrawler: Record<string, { count: number; lastUpdated: string | null }> = {}
  for (const row of rows ?? []) {
    const id = row.crawler_id ?? 'legacy'
    if (!perCrawler[id]) perCrawler[id] = { count: 0, lastUpdated: null }
    perCrawler[id].count++
    if (!perCrawler[id].lastUpdated || row.created_at > perCrawler[id].lastUpdated) {
      perCrawler[id].lastUpdated = row.created_at
    }
  }

  return NextResponse.json({ perCrawler, total: rows?.length ?? 0 })
}
