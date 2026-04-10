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

  // Counts pro source_type
  const { data: rows } = await admin
    .from('inometa_knowledge')
    .select('source_type')

  const counts: Record<string, number> = {}
  let total = 0
  for (const row of rows ?? []) {
    counts[row.source_type] = (counts[row.source_type] ?? 0) + 1
    total++
  }

  // Letzte Aktualisierung
  const { data: latest } = await admin
    .from('inometa_knowledge')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return NextResponse.json({ total, counts, lastUpdated: latest?.created_at ?? null })
}
