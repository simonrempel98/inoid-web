// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// PATCH /api/flexodruck/machines/[id]/druckwerke/[dwId]
// Druckwerk-Label und Farbe bearbeiten
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; dwId: string }> },
) {
  const { dwId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const body = await req.json()
  const updates: Record<string, unknown> = {}
  if ('label' in body) updates.label = body.label || null
  if ('color_hint' in body) updates.color_hint = body.color_hint || null

  const admin = createAdminClient()
  const { error } = await admin.from('flexo_druckwerke').update(updates).eq('id', dwId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
