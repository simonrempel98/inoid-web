// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// PATCH /api/flexodruck/fixed-slots/[slotId]
// Body: { asset_ids: string[] }  – ersetzt alle verknüpften Assets
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slotId: string }> },
) {
  const { slotId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('organization_id, app_role').eq('id', user.id).single()
  if (!['admin', 'superadmin', 'technician'].includes(profile?.app_role ?? '')) {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  }

  const body = await req.json()
  const asset_ids: string[] = Array.isArray(body.asset_ids) ? body.asset_ids : []

  const admin = createAdminClient()

  // Slot-Org prüfen
  const { data: slot } = await admin
    .from('flexo_fixed_slots')
    .select('id, org_id')
    .eq('id', slotId)
    .single()

  if (!slot) return NextResponse.json({ error: 'Slot nicht gefunden' }, { status: 404 })

  // Alle bisherigen Verknüpfungen löschen
  await admin.from('flexo_slot_assets').delete().eq('slot_id', slotId)

  // Neue Verknüpfungen anlegen
  if (asset_ids.length > 0) {
    const rows = asset_ids.map((aid, i) => ({
      slot_id: slotId,
      asset_id: aid,
      org_id: slot.org_id,
      sort_order: i,
    }))
    const { error } = await admin.from('flexo_slot_assets').insert(rows)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

// DELETE /api/flexodruck/fixed-slots/[slotId]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slotId: string }> },
) {
  const { slotId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('app_role').eq('id', user.id).single()
  if (!['admin', 'superadmin'].includes(profile?.app_role ?? '')) {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { error } = await admin.from('flexo_fixed_slots').delete().eq('id', slotId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
