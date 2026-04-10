// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// GET /api/flexodruck/setups/[id]
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const { data, error } = await supabase
    .from('flexo_setups')
    .select(`
      *,
      flexo_machines(id, name, num_druckwerke),
      flexo_templates(id, name),
      flexo_setup_steps(
        id, druckwerk_id, slot_id, slot_label, is_fixed, asset_id,
        status, notes, installed_at, sort_order,
        assets(id, name, serial_number),
        flexo_druckwerke(id, position, label, color_hint)
      )
    `)
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

// PATCH /api/flexodruck/setups/[id] – Status des Rüstvorgangs oder einzelner Schritt
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const body = await req.json()
  const admin = createAdminClient()

  if ('step_id' in body) {
    // Einzelnen Schritt aktualisieren
    const { step_id, status, notes, asset_id } = body
    const stepUpdates: Record<string, unknown> = { status }
    if (notes !== undefined) stepUpdates.notes = notes
    if (asset_id !== undefined) stepUpdates.asset_id = asset_id ?? null
    if (status === 'installed' || status === 'verified') {
      stepUpdates.installed_at = new Date().toISOString()
      stepUpdates.installed_by = user.id
    }
    const { error } = await admin.from('flexo_setup_steps').update(stepUpdates).eq('id', step_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // Setup-Status aktualisieren
  const updates: Record<string, unknown> = {}
  if ('status' in body) {
    updates.status = body.status
    if (body.status === 'in_progress') updates.started_at = new Date().toISOString()
    if (body.status === 'completed') updates.completed_at = new Date().toISOString()
  }
  if ('notes' in body) updates.notes = body.notes
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'Keine Felder' }, { status: 400 })

  const { error } = await admin.from('flexo_setups').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
