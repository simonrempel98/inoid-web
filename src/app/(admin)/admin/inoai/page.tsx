// @ts-nocheck
import { createAdminClient } from '@/lib/supabase/admin'
import { INOaiAdminClient } from './inoai-admin-client'

export default async function AdminINOaiPage() {
  const admin = createAdminClient()

  const [{ data: crawlers }, { data: knowledgeRows }] = await Promise.all([
    admin.from('inoai_crawlers').select('*').order('created_at'),
    admin.from('inometa_knowledge').select('crawler_id, created_at'),
  ])

  const perCrawler: Record<string, { count: number; lastUpdated: string | null }> = {}
  let total = 0
  for (const row of knowledgeRows ?? []) {
    const id = row.crawler_id ?? 'legacy'
    if (!perCrawler[id]) perCrawler[id] = { count: 0, lastUpdated: null }
    perCrawler[id].count++
    if (!perCrawler[id].lastUpdated || row.created_at > perCrawler[id].lastUpdated) {
      perCrawler[id].lastUpdated = row.created_at
    }
    total++
  }

  return (
    <INOaiAdminClient
      initialCrawlers={crawlers ?? []}
      initialStats={perCrawler}
      total={total}
    />
  )
}
