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

// Alle Kombinationen mit base/modifier-Details
export async function GET() {
  if (!await guard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('inoai_synonym_combinations')
    .select('id, base_id, modifier_id, extra_terms, active, created_at')
    .order('created_at')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// Neue Kombination erstellen
export async function POST(req: Request) {
  if (!await guard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { base_id, modifier_id, extra_terms = [] } = await req.json()
  if (!base_id || !modifier_id) {
    return NextResponse.json({ error: 'base_id und modifier_id erforderlich' }, { status: 400 })
  }
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('inoai_synonym_combinations')
    .upsert({ base_id, modifier_id, extra_terms, active: true }, { onConflict: 'base_id,modifier_id' })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
