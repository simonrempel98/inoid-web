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
    .select('crawler_id, source_url, source_type, created_at')

  const perCrawler: Record<string, {
    chunks: number
    pages: number
    docs: number
    lastUpdated: string | null
  }> = {}

  for (const row of rows ?? []) {
    const id = row.crawler_id ?? 'legacy'
    if (!perCrawler[id]) perCrawler[id] = { chunks: 0, pages: 0, docs: 0, lastUpdated: null }
    perCrawler[id].chunks++
    if (!perCrawler[id].lastUpdated || row.created_at > perCrawler[id].lastUpdated) {
      perCrawler[id].lastUpdated = row.created_at
    }
  }

  // Unique URLs pro Crawler + Typ zählen
  const pageUrls: Record<string, Set<string>> = {}
  const docUrls: Record<string, Set<string>> = {}
  for (const row of rows ?? []) {
    const id = row.crawler_id ?? 'legacy'
    if (row.source_type === 'website') {
      if (!pageUrls[id]) pageUrls[id] = new Set()
      pageUrls[id].add(row.source_url)
    } else {
      if (!docUrls[id]) docUrls[id] = new Set()
      docUrls[id].add(row.source_url)
    }
  }
  for (const id of Object.keys(perCrawler)) {
    perCrawler[id].pages = pageUrls[id]?.size ?? 0
    perCrawler[id].docs = docUrls[id]?.size ?? 0
  }

  return NextResponse.json({ perCrawler, total: rows?.length ?? 0 })
}
