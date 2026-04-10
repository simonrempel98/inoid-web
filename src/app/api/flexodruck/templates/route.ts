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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!['admin', 'superadmin', 'technician'].includes((profile as any).app_role)) {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  }

  const body = await req.json()
  const { machine_id, name, description, slot_labels, shared_machine_ids } = body
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

  // 2. Slot-Typen anlegen (z.B. ["Sleeve", "Druckplatte", "Adapter"])
  if (Array.isArray(slot_labels) && slot_labels.length > 0) {
    const slotRows = slot_labels
      .filter((l: string) => l?.trim())
      .map((l: string, i: number) => ({
        template_id: tpl.id,
        org_id: profile.organization_id,
        label: l.trim(),
        sort_order: i,
      }))
    if (slotRows.length > 0) {
      await admin.from('flexo_template_slots').insert(slotRows)
    }
  }

  // 3. Freigabe für weitere Maschinen
  if (Array.isArray(shared_machine_ids) && shared_machine_ids.length > 0) {
    const shareRows = shared_machine_ids.map((mid: string) => ({
      template_id: tpl.id,
      machine_id: mid,
    }))
    await admin.from('flexo_template_machines').insert(shareRows)
  }

  return NextResponse.json({ id: tpl.id }, { status: 201 })
}
