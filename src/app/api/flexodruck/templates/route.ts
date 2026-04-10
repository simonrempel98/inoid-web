// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// POST /api/flexodruck/templates – Neue Vorlage anlegen
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('organization_id, app_role').eq('id', user.id).single()
  if (!profile?.organization_id) return NextResponse.json({ error: 'Keine Org' }, { status: 403 })
  if (!['admin', 'superadmin', 'technician'].includes(profile.app_role)) {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  }

  const body = await req.json()
  const { machine_id, name, description, assignments } = body
  if (!machine_id || !name?.trim()) {
    return NextResponse.json({ error: 'machine_id und name erforderlich' }, { status: 400 })
  }

  const admin = createAdminClient()

  // 1. Vorlage anlegen
  const { data: tpl, error: tErr } = await admin
    .from('flexo_templates')
    .insert({
      org_id: profile.organization_id,
      primary_machine_id: machine_id,
      name: name.trim(),
      description: description?.trim() || null,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (tErr || !tpl) return NextResponse.json({ error: tErr?.message ?? 'Fehler' }, { status: 500 })

  // 2. Assignments verarbeiten (pro DW + Slot-Label → Asset)
  if (Array.isArray(assignments) && assignments.length > 0) {
    // Eindeutige Slot-Labels bestimmen
    const uniqueLabels = [...new Set(assignments.map((a: { slot_label: string }) => a.slot_label))]

    // Template-Slots anlegen
    const slotRows = uniqueLabels.map((label: string, i: number) => ({
      template_id: tpl.id,
      org_id: profile.organization_id,
      label,
      sort_order: i,
    }))
    const { data: createdSlots, error: sErr } = await admin
      .from('flexo_template_slots')
      .insert(slotRows)
      .select('id, label')

    if (sErr || !createdSlots) return NextResponse.json({ error: sErr?.message ?? 'Fehler Slots' }, { status: 500 })

    // Slot-ID per Label nachschlagen
    const slotByLabel: Record<string, string> = {}
    for (const s of createdSlots) slotByLabel[s.label] = s.id

    // Assignments anlegen
    const assignmentRows = assignments
      .filter((a: { slot_label: string; druckwerk_id: string }) => slotByLabel[a.slot_label] && a.druckwerk_id)
      .map((a: { slot_label: string; druckwerk_id: string; asset_id: string | null }) => ({
        template_id: tpl.id,
        slot_id: slotByLabel[a.slot_label],
        druckwerk_id: a.druckwerk_id,
        org_id: profile.organization_id,
        asset_id: a.asset_id || null,
      }))

    if (assignmentRows.length > 0) {
      await admin.from('flexo_template_assignments').insert(assignmentRows)
    }
  }

  return NextResponse.json({ id: tpl.id }, { status: 201 })
}
