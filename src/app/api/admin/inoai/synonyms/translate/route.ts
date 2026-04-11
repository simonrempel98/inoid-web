// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { syncMultilingualSynonyms } from '@/lib/inoai/crawler'
import { NextResponse } from 'next/server'

export const maxDuration = 60

async function guard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: p } = await supabase.from('profiles').select('is_platform_admin').eq('id', user.id).single()
  return !!p?.is_platform_admin
}

export async function POST() {
  if (!await guard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const admin = createAdminClient()
  const log: string[] = []
  await syncMultilingualSynonyms(admin, (msg: string) => log.push(msg))
  return NextResponse.json({ ok: true, log })
}
