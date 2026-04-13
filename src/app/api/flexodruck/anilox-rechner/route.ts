// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, supabase, orgId: null }
  const { data: p } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
  return { user, supabase, orgId: p?.organization_id ?? null }
}

// GET: Letzte 20 Berechnungen des Nutzers
export async function GET() {
  const { user, supabase } = await getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const { data } = await supabase
    .from('anilox_calculations')
    .select('id, name, note, calc_type, inputs, results, unit, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return NextResponse.json({ calculations: data ?? [] })
}

// POST: Neue Berechnung speichern
export async function POST(req: Request) {
  const { user, supabase, orgId } = await getUser()
  if (!user || !orgId) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const body = await req.json()
  const { name, note, calc_type, inputs, results, unit } = body

  if (!name || !calc_type || !inputs || !results)
    return NextResponse.json({ error: 'Fehlende Felder' }, { status: 400 })

  const { data, error } = await supabase
    .from('anilox_calculations')
    .insert({ user_id: user.id, org_id: orgId, name, note: note || null, calc_type, inputs, results, unit: unit ?? 'metric' })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id })
}

// DELETE: Berechnung löschen
export async function DELETE(req: Request) {
  const { user, supabase } = await getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id fehlt' }, { status: 400 })

  const { error } = await supabase
    .from('anilox_calculations')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
