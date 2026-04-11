// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

async function guard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: p } = await supabase.from('profiles').select('is_platform_admin').eq('id', user.id).single()
  return !!p?.is_platform_admin
}

// PATCH – Crawler bearbeiten (Name, URL, Sprache)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await guard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  const body = await req.json()
  const updates: Record<string, string> = {}
  if (body.name) updates.name = body.name
  if (body.url) updates.url = body.url
  if (body.lang) updates.lang = body.lang

  const admin = createAdminClient()
  const { data, error } = await admin.from('inoai_crawlers').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE – Crawler + Wissensbasis-Einträge + Jobs löschen
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await guard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  const admin = createAdminClient()

  await admin.from('inoai_crawl_jobs').delete().eq('crawler_id', id)
  await admin.from('inometa_knowledge').delete().eq('crawler_id', id)
  const { error } = await admin.from('inoai_crawlers').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
