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

export async function GET() {
  const { user, supabase } = await getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const { data } = await supabase
    .from('flexo_colors')
    .select('id, name, supplier, color_type, density, cost_per_kg, notes, created_at')
    .eq('user_id', user.id)
    .order('name', { ascending: true })

  return NextResponse.json({ colors: data ?? [] })
}

export async function POST(req: Request) {
  const { user, supabase, orgId } = await getUser()
  if (!user || !orgId) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const body = await req.json()
  const { name, supplier, color_type, density, cost_per_kg, notes } = body
  if (!name) return NextResponse.json({ error: 'Name fehlt' }, { status: 400 })

  const { data, error } = await supabase
    .from('flexo_colors')
    .insert({
      user_id: user.id, org_id: orgId,
      name, supplier: supplier || null,
      color_type: color_type || null,
      density: density ? parseFloat(density) : null,
      cost_per_kg: cost_per_kg ? parseFloat(cost_per_kg) : null,
      notes: notes || null,
    })
    .select('id, name, supplier, color_type, density, cost_per_kg, notes, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ color: data })
}

export async function DELETE(req: Request) {
  const { user, supabase } = await getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id fehlt' }, { status: 400 })

  const { error } = await supabase
    .from('flexo_colors')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
