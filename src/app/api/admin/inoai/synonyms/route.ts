// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

async function guard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: p } = await supabase.from('profiles').select('is_platform_admin').eq('id', user.id).single()
  return p?.is_platform_admin ? supabase : null
}

export async function GET() {
  if (!await guard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const admin = createAdminClient()
  const { data } = await admin.from('inoai_synonyms').select('*').order('id')
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  if (!await guard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { terms } = await req.json()
  if (!Array.isArray(terms) || terms.length < 2) {
    return NextResponse.json({ error: 'Mindestens 2 Begriffe erforderlich' }, { status: 400 })
  }
  const admin = createAdminClient()
  const { data, error } = await admin.from('inoai_synonyms').insert({ terms }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
