// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('is_platform_admin').eq('id', user.id).single()
  if (!profile?.is_platform_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()

  // All PDF chunks — deduplicate server-side by source_url
  const { data: rows, error } = await admin
    .from('inometa_knowledge')
    .select('title, source_url, language, crawler_id, created_at')
    .eq('source_type', 'datasheet')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Keep first occurrence per source_url (= newest title/metadata)
  const seen = new Set<string>()
  const pdfs = (rows ?? []).filter(r => {
    if (seen.has(r.source_url)) return false
    seen.add(r.source_url)
    return true
  })

  // Crawler names for cluster labels
  const { data: crawlers } = await admin
    .from('inoai_crawlers')
    .select('id, name')

  return NextResponse.json({ pdfs, crawlers: crawlers ?? [] })
}
