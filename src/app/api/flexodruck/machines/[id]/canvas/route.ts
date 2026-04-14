import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('app_role').eq('id', user.id).single()

  const role = (profile as any)?.app_role ?? 'leser'
  if (role === 'leser') return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })

  const body = await req.json()

  const { error } = await supabase
    .from('flexo_machines')
    .update({ canvas_layout: body.layout ?? null })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
