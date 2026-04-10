// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// PATCH /api/flexodruck/fixed-slots/[slotId]
// Asset einem festen Slot zuweisen
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slotId: string }> },
) {
  const { slotId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const body = await req.json()
  const admin = createAdminClient()
  const { error } = await admin
    .from('flexo_fixed_slots')
    .update({ asset_id: body.asset_id ?? null })
    .eq('id', slotId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
