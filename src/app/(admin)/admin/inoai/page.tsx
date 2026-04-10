// @ts-nocheck
import { createAdminClient } from '@/lib/supabase/admin'
import { INOaiAdminClient } from './inoai-admin-client'

export default async function AdminINOaiPage() {
  const admin = createAdminClient()

  const [{ data: crawlers }, { data: rows }] = await Promise.all([
    admin.from('inoai_crawlers').select('*').order('created_at'),
    admin.from('inometa_knowledge').select('crawler_id, source_url, source_type, created_at'),
  ])

  const perCrawler: Record<string, { chunks: number; pages: number; docs: number; lastUpdated: string | null }> = {}
  const pageUrls: Record<string, Set<string>> = {}
  const docUrls: Record<string, Set<string>> = {}
  let total = 0

  for (const row of rows ?? []) {
    const id = row.crawler_id ?? 'legacy'
    if (!perCrawler[id]) perCrawler[id] = { chunks: 0, pages: 0, docs: 0, lastUpdated: null }
    perCrawler[id].chunks++
    total++
    if (!perCrawler[id].lastUpdated || row.created_at > perCrawler[id].lastUpdated) {
      perCrawler[id].lastUpdated = row.created_at
    }
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

  return (
    <INOaiAdminClient
      initialCrawlers={crawlers ?? []}
      initialStats={perCrawler}
      total={total}
    />
  )
}
