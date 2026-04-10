// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// GET /api/flexodruck/setups?machine_id=...
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const machine_id = searchParams.get('machine_id')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  let query = supabase
    .from('flexo_setups')
    .select('id, name, job_number, status, planned_at, started_at, completed_at, created_at, flexo_machines(id, name)')
    .order('created_at', { ascending: false })

  if (machine_id) query = query.eq('machine_id', machine_id)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/flexodruck/setups – Neuen Rüstvorgang aus Vorlage starten
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('organization_id').eq('id', user.id).single()
  if (!profile?.organization_id) return NextResponse.json({ error: 'Keine Org' }, { status: 403 })

  const body = await req.json()
  const { machine_id, template_id, name, job_number, planned_at, notes } = body
  if (!machine_id || !name?.trim()) {
    return NextResponse.json({ error: 'machine_id und name erforderlich' }, { status: 400 })
  }

  const admin = createAdminClient()

  // 1. Rüstvorgang anlegen
  const { data: setup, error: sErr } = await admin
    .from('flexo_setups')
    .insert({
      org_id: profile.organization_id,
      machine_id,
      template_id: template_id ?? null,
      name: name.trim(),
      job_number: job_number?.trim() || null,
      planned_at: planned_at || null,
      notes: notes?.trim() || null,
      created_by: user.id,
      status: 'planned',
    })
    .select('id')
    .single()

  if (sErr || !setup) return NextResponse.json({ error: sErr?.message ?? 'Fehler' }, { status: 500 })

  // 2. Schritte generieren: feste Slots + variable Slots aus Vorlage
  const stepsToInsert: Record<string, unknown>[] = []

  // Druckwerke der Maschine laden
  const { data: druckwerke } = await admin
    .from('flexo_druckwerke')
    .select('id, position, flexo_fixed_slots(id, label, asset_id, sort_order)')
    .eq('machine_id', machine_id)
    .order('position')

  if (druckwerke) {
    for (const dw of druckwerke) {
      // Feste Slots
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fixedSlots = (dw as any).flexo_fixed_slots ?? []
      for (const fs of fixedSlots) {
        stepsToInsert.push({
          setup_id: setup.id,
          org_id: profile.organization_id,
          druckwerk_id: dw.id,
          slot_id: null,
          slot_label: fs.label,
          is_fixed: true,
          asset_id: fs.asset_id ?? null,
          status: fs.asset_id ? 'installed' : 'pending',
          sort_order: fs.sort_order,
        })
      }

      // Variable Slots aus Vorlage (falls vorhanden)
      if (template_id) {
        const { data: assignments } = await admin
          .from('flexo_template_assignments')
          .select('slot_id, asset_id, notes, flexo_template_slots(label, sort_order)')
          .eq('template_id', template_id)
          .eq('druckwerk_id', dw.id)

        if (assignments) {
          for (const a of assignments) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const slot = (a as any).flexo_template_slots
            stepsToInsert.push({
              setup_id: setup.id,
              org_id: profile.organization_id,
              druckwerk_id: dw.id,
              slot_id: a.slot_id,
              slot_label: slot?.label ?? 'Slot',
              is_fixed: false,
              asset_id: a.asset_id ?? null,
              status: 'pending',
              sort_order: 100 + (slot?.sort_order ?? 0),
            })
          }
        }
      }
    }
  }

  if (stepsToInsert.length > 0) {
    await admin.from('flexo_setup_steps').insert(stepsToInsert)
  }

  return NextResponse.json({ id: setup.id }, { status: 201 })
}
