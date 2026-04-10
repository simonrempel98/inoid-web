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

// GET – alle Crawler laden
export async function GET() {
  const user = await checkAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const { data, error } = await admin.from('inoai_crawlers').select('*').order('created_at')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST – neuen Crawler anlegen
export async function POST(req: Request) {
  const user = await checkAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, url, lang } = await req.json()
  if (!name?.trim() || !url?.trim()) {
    return NextResponse.json({ error: 'Name und URL erforderlich' }, { status: 400 })
  }

  // ID aus Name generieren
  const id = name.trim().toLowerCase()
    .replace(/[äöüÄÖÜ]/g, c => ({ ä: 'ae', ö: 'oe', ü: 'ue', Ä: 'ae', Ö: 'oe', Ü: 'ue' }[c] ?? c))
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('inoai_crawlers')
    .insert({ id, name: name.trim(), url: url.trim(), lang: lang ?? 'de' })
    .select()
    .single()

  if (error) {
    const msg = error.code === '23505' ? `ID "${id}" existiert bereits` : error.message
    return NextResponse.json({ error: msg }, { status: 400 })
  }
  return NextResponse.json(data)
}
