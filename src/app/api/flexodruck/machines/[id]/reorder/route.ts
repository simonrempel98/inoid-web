// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// PATCH /api/flexodruck/machines/[id]/reorder
// Body: { positions: [{ id: dwId, position: number }] }
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: machineId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('organization_id, app_role').eq('id', user.id).single()
  if (!['admin', 'superadmin'].includes(profile?.app_role ?? '')) {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  }

  const body = await req.json()
  const positions: { id: string; position: number }[] = body.positions ?? []

  const admin = createAdminClient()

  // Jeden DW einzeln updaten
  await Promise.all(
    positions.map(({ id, position }) =>
      admin
        .from('flexo_druckwerke')
        .update({ position })
        .eq('id', id)
        .eq('machine_id', machineId)
    )
  )

  return NextResponse.json({ ok: true })
}
