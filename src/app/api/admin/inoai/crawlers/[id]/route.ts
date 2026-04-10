// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('is_platform_admin').eq('id', user.id).single()
  return profile?.is_platform_admin ? user : null
}

// DELETE – Crawler + alle zugehörigen Wissensbasis-Einträge löschen
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await checkAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const admin = createAdminClient()

  await admin.from('inometa_knowledge').delete().eq('crawler_id', id)
  const { error } = await admin.from('inoai_crawlers').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
