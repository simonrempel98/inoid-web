import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('organization_id').eq('id', user.id).single()
  if (!profile?.organization_id) return NextResponse.json({ messages: [] })

  const orgId = profile.organization_id
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // Lazy-Cleanup: Nachrichten älter als 30 Tage löschen
  await supabase.from('chat_messages')
    .delete()
    .eq('organization_id', orgId)
    .lt('created_at', thirtyDaysAgo)

  const { data: messages } = await supabase
    .from('chat_messages')
    .select('id, user_id, sender_name, sender_role, content, asset_mentions, created_at')
    .eq('organization_id', orgId)
    .gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: true })
    .limit(200)

  return NextResponse.json({ messages: messages ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, full_name, email, app_role')
    .eq('id', user.id)
    .single()
  if (!profile?.organization_id) return NextResponse.json({ error: 'Keine Organisation' }, { status: 403 })

  // Feature-Check
  const { data: org } = await supabase
    .from('organizations').select('features').eq('id', profile.organization_id).single()
  const features = (org?.features as Record<string, boolean>) ?? {}
  if (features.teamchat === false) {
    return NextResponse.json({ error: 'Teamchat ist nicht aktiviert' }, { status: 403 })
  }

  const body = await req.json()
  const content: string = (body.content ?? '').trim()
  const assetMentions: string[] = Array.isArray(body.assetMentions) ? body.assetMentions : []

  if (!content || content.length > 2000) {
    return NextResponse.json({ error: 'Nachricht ungültig (1–2000 Zeichen)' }, { status: 400 })
  }

  const { data: msg, error } = await supabase.from('chat_messages').insert({
    organization_id: profile.organization_id,
    user_id: user.id,
    sender_name: profile.full_name ?? profile.email ?? 'Unbekannt',
    sender_role: profile.app_role ?? null,
    content,
    asset_mentions: assetMentions,
  }).select('id, user_id, sender_name, sender_role, content, asset_mentions, created_at').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: msg })
}
