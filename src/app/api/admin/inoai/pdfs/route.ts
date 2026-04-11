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

  // One row per PDF (chunk_index=0), sorted newest first
  const { data: pdfs } = await admin
    .from('inometa_knowledge')
    .select('title, source_url, language, crawler_id, created_at')
    .eq('source_type', 'datasheet')
    .eq('chunk_index', 0)
    .order('created_at', { ascending: false })

  // Crawler names for cluster labels
  const { data: crawlers } = await admin
    .from('inoai_crawlers')
    .select('id, name')

  return NextResponse.json({ pdfs: pdfs ?? [], crawlers: crawlers ?? [] })
}
