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

// Einzelnen Job abrufen (inkl. vollem Log) – für Polling
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await guard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  const admin = createAdminClient()
  const { data, error } = await admin.from('inoai_crawl_jobs').select('*').eq('id', id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
