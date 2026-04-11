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

  const { data: allRows } = await admin
    .from('inometa_knowledge')
    .select('source_type, source_url, title, language, crawler_id, created_at')
    .order('created_at', { ascending: false })
    .limit(100_000)

  const pdfTypes = new Set(['datasheet', 'pdf', 'brochure'])
  const seen = new Set<string>()
  const pdfs = (allRows ?? []).filter(r => {
    if (!pdfTypes.has(r.source_type)) return false
    if (seen.has(r.source_url)) return false
    seen.add(r.source_url)
    return true
  })

  const { data: crawlers } = await admin
    .from('inoai_crawlers')
    .select('id, name')

  return NextResponse.json({ pdfs, crawlers: crawlers ?? [] })
}
