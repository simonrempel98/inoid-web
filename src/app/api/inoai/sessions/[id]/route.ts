// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET: alle Nachrichten einer Session laden
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  // Sicherstellen dass die Session dem User gehört
  const { data: session } = await supabase
    .from('inoai_chat_sessions')
    .select('id, title')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!session) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const { data: messages } = await supabase
    .from('inoai_chat_messages')
    .select('id, role, content, sources, created_at')
    .eq('session_id', id)
    .order('created_at', { ascending: true })

  return NextResponse.json({ session, messages: messages ?? [] })
}
