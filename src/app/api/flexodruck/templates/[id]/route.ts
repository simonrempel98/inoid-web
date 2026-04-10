// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// GET /api/flexodruck/templates/[id]
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const { data, error } = await supabase
    .from('flexo_templates')
    .select(`
      *,
      flexo_machines!primary_machine_id(id, name, num_druckwerke),
      flexo_template_slots(id, label, sort_order),
      flexo_template_assignments(
        id, druckwerk_id, slot_id, asset_id, notes,
        assets(id, name, serial_number)
      ),
      flexo_template_machines(machine_id,
        flexo_machines(id, name)
      )
    `)
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

// PATCH /api/flexodruck/templates/[id]
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const body = await req.json()
  const admin = createAdminClient()

  if ('cell_assets' in body) {
    // Mehrere Assets pro Zelle (slot_id × druckwerk_id)
    const { slot_id, druckwerk_id, asset_ids, org_id } = body.cell_assets
    // Alle bisherigen Einträge dieser Zelle löschen
    await admin
      .from('flexo_template_cell_assets')
      .delete()
      .eq('template_id', id)
      .eq('slot_id', slot_id)
      .eq('druckwerk_id', druckwerk_id)
    // Neue Einträge anlegen
    if (Array.isArray(asset_ids) && asset_ids.length > 0) {
      const rows = asset_ids.map((aid: string, i: number) => ({
        template_id: id, slot_id, druckwerk_id, asset_id: aid, org_id, sort_order: i,
      }))
      const { error } = await admin.from('flexo_template_cell_assets').insert(rows)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  }

  const updates: Record<string, unknown> = {}
  for (const k of ['name', 'description', 'is_active']) {
    if (k in body) updates[k] = body[k]
  }
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'Keine Felder' }, { status: 400 })
  updates.updated_at = new Date().toISOString()

  const { error } = await admin.from('flexo_templates').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE /api/flexodruck/templates/[id]
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const admin = createAdminClient()
  const { error } = await admin.from('flexo_templates').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
