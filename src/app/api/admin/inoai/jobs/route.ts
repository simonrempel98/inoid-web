// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

async function guard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: p } = await supabase.from('profiles').select('is_platform_admin').eq('id', user.id).single()
  return !!p?.is_platform_admin
}

// Letzte Jobs pro Crawler (ohne Log – nur Metadaten)
export async function GET(req: Request) {
  if (!await guard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { searchParams } = new URL(req.url)
  const crawlerId = searchParams.get('crawler_id')

  const admin = createAdminClient()
  let q = admin
    .from('inoai_crawl_jobs')
    .select('id, crawler_id, status, stats, diff, created_at, started_at, finished_at')
    .order('created_at', { ascending: false })
    .limit(5)

  if (crawlerId) q = q.eq('crawler_id', crawlerId)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
