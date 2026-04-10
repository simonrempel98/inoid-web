// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// POST /api/flexodruck/druckwerke/[dwId]/slots
// Farbe-Slot zu einem Druckwerk hinzufügen
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ dwId: string }> },
) {
  const { dwId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('organization_id, app_role').eq('id', user.id).single()
  if (!['admin', 'superadmin'].includes(profile?.app_role ?? '')) {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  }

  const admin = createAdminClient()

  // Prüfen ob Slot bereits existiert
  const { data: existing } = await admin
    .from('flexo_fixed_slots')
    .select('id')
    .eq('druckwerk_id', dwId)
    .eq('sort_order', 1)
    .single()

  if (existing) return NextResponse.json({ error: 'Slot existiert bereits' }, { status: 409 })

  const { data, error } = await admin
    .from('flexo_fixed_slots')
    .insert({
      druckwerk_id: dwId,
      org_id: profile!.organization_id,
      label: 'Farbe',
      sort_order: 1,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id }, { status: 201 })
}
