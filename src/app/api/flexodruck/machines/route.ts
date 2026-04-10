// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// GET /api/flexodruck/machines – Liste aller Maschinen der Org
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('organization_id').eq('id', user.id).single()
  if (!profile?.organization_id) return NextResponse.json({ error: 'Keine Org' }, { status: 403 })

  const { data, error } = await supabase
    .from('flexo_machines')
    .select(`
      id, name, manufacturer, model, num_druckwerke, is_active, created_at, notes,
      flexo_druckwerke(count),
      flexo_templates(count)
    `)
    .eq('org_id', profile.organization_id)
    .order('created_at')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/flexodruck/machines – Neue Maschine + Druckwerke + fixe Slots anlegen
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('organization_id, app_role').eq('id', user.id).single()
  if (!profile?.organization_id) return NextResponse.json({ error: 'Keine Org' }, { status: 403 })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!['admin', 'superadmin'].includes((profile as any).app_role)) {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  }

  const body = await req.json()
  const { name, manufacturer, model, num_druckwerke, notes, dw_labels } = body
  if (!name?.trim()) return NextResponse.json({ error: 'Name erforderlich' }, { status: 400 })
  const n = Math.max(1, Math.min(20, Number(num_druckwerke) || 1))

  const admin = createAdminClient()

  // 1. Maschine anlegen
  const { data: machine, error: mErr } = await admin
    .from('flexo_machines')
    .insert({
      org_id: profile.organization_id,
      name: name.trim(),
      manufacturer: manufacturer?.trim() || null,
      model: model?.trim() || null,
      num_druckwerke: n,
      notes: notes?.trim() || null,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (mErr || !machine) return NextResponse.json({ error: mErr?.message ?? 'Fehler' }, { status: 500 })

  // 2. Druckwerke anlegen (1 … n), optional mit Benutzerlabels
  const druckwerkeRows = Array.from({ length: n }, (_, i) => ({
    machine_id: machine.id,
    org_id: profile.organization_id,
    position: i + 1,
    label: (dw_labels?.[i + 1] as string)?.trim() || null,
  }))
  const { data: druckwerke, error: dErr } = await admin
    .from('flexo_druckwerke')
    .insert(druckwerkeRows)
    .select('id, position')

  if (dErr || !druckwerke) return NextResponse.json({ error: dErr?.message ?? 'Fehler DW' }, { status: 500 })

  // 3. Feste Slots: 2 Trägerstangen pro Druckwerk
  const fixedSlotRows = druckwerke.flatMap(dw => [
    { druckwerk_id: dw.id, org_id: profile.organization_id, label: 'Druckbild', sort_order: 0 },
    { druckwerk_id: dw.id, org_id: profile.organization_id, label: 'Farbe',     sort_order: 1 },
  ])
  await admin.from('flexo_fixed_slots').insert(fixedSlotRows)

  return NextResponse.json({ id: machine.id }, { status: 201 })
}
