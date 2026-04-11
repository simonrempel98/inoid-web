// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function expandWithSynonyms(
  query: string,
  admin: ReturnType<typeof import('@/lib/supabase/admin').createAdminClient>
): Promise<string> {
  const [{ data: groups }, { data: combos }] = await Promise.all([
    admin.from('inoai_synonyms').select('id, terms, group_type'),
    admin.from('inoai_synonym_combinations').select('base_id, modifier_id, extra_terms').eq('active', true),
  ])
  if (!groups?.length) return query

  const lower = query.toLowerCase()
  const extras = new Set<string>()
  const matchedBaseIds = new Set<number>()
  const matchedModifierIds = new Set<number>()

  for (const group of groups) {
    if ((group.terms as string[]).some(t => lower.includes(t.toLowerCase()))) {
      ;(group.terms as string[]).forEach(t => extras.add(t))
      if (group.group_type === 'base') matchedBaseIds.add(group.id as number)
      if (group.group_type === 'modifier') matchedModifierIds.add(group.id as number)
    }
  }

  for (const combo of combos ?? []) {
    if (matchedBaseIds.has(combo.base_id as number) && matchedModifierIds.has(combo.modifier_id as number)) {
      ;(combo.extra_terms as string[]).forEach(t => extras.add(t))
    }
  }

  if (!extras.size) return query

  const allTerms = [query, ...Array.from(extras)]
  return allTerms.map(t => `"${t}"`).join(' OR ')
}

const SYSTEM_PROMPT = `You are INOai, the AI assistant of INOMETA GmbH, specialists in anilox rolls, doctor blades, sleeves, and flexographic printing technology.
You answer questions about INOMETA products, roller technology, and printing press accessories.
You answer exclusively based on the provided knowledge base.
If a question is not covered by the knowledge base, say so honestly and recommend contacting INOMETA directly.

LANGUAGE RULE: Always respond in the exact language the user writes in.
Supported languages include: German, English, French, Spanish, Italian, Portuguese, Dutch, Polish, Turkish, Russian, Ukrainian, Bulgarian, Romanian, Czech, Slovak, Hungarian, Croatian, Serbian, Greek, Finnish, Swedish, Danish, Norwegian, Lithuanian, Latvian, Estonian, Japanese, Chinese — and any other language the user may write in.
Never switch languages unless the user explicitly asks you to.

FORMATTING: Use Markdown to structure your answers. Use **bold** for key terms, tables for comparisons, bullet lists for enumerations, and headings (##) for longer answers with multiple sections. Keep responses concise but well-structured.

Be precise and professional. No emojis.`

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const body = await req.json()
  const {
    message,
    history = [],
    session_id: existingSessionId,
  }: { message: string; history: { role: string; content: string }[]; session_id?: string } = body

  if (!message?.trim()) return NextResponse.json({ error: 'Keine Nachricht' }, { status: 400 })

  const admin = createAdminClient()

  // ── Session anlegen oder wiederverwenden ──────────────────────────────────
  let sessionId = existingSessionId ?? null

  if (!sessionId) {
    // Titel aus den ersten 60 Zeichen der Frage
    const title = message.trim().slice(0, 60) + (message.trim().length > 60 ? '…' : '')

    // Org-ID des Users laden
    const { data: profile } = await supabase
      .from('profiles').select('organization_id').eq('id', user.id).single()

    const { data: session } = await supabase
      .from('inoai_chat_sessions')
      .insert({ user_id: user.id, org_id: profile?.organization_id ?? null, title })
      .select('id')
      .single()

    sessionId = session?.id ?? null
  }

  // User-Nachricht speichern
  if (sessionId) {
    await supabase.from('inoai_chat_messages').insert({
      session_id: sessionId,
      role: 'user',
      content: message,
    })
  }

  // ── RAG: Synonyme + Suche ─────────────────────────────────────────────────
  const expandedQuery = await expandWithSynonyms(message, admin)

  const { data: chunks } = await admin.rpc('search_inometa_knowledge', {
    query: expandedQuery,
    max_results: 6,
  })

  let context = ''
  if (chunks && chunks.length > 0) {
    context = '\n\n---\nRelevante Informationen aus der INOMETA-Wissensbasis:\n\n'
    context += chunks.map((c: any) =>
      `[${c.source_type.toUpperCase()}] ${c.title}\n${c.content}`
    ).join('\n\n---\n\n')
    context += '\n---'
  } else {
    context = '\n\nHinweis: Zur dieser Frage liegen keine spezifischen Informationen in der Wissensbasis vor.'
  }

  const messages = [
    ...history.slice(-8).map((m: any) => ({ role: m.role, content: m.content })),
    { role: 'user', content: message + context },
  ]

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    })

    const reply = response.content[0]?.type === 'text' ? response.content[0].text : ''

    // Antwort speichern
    if (sessionId) {
      const sources = (chunks ?? []).filter((c: any) => c.rank > 0)
      await supabase.from('inoai_chat_messages').insert({
        session_id: sessionId,
        role: 'assistant',
        content: reply,
        sources: sources.length > 0 ? sources : null,
      })
      // updated_at der Session aktualisieren
      await supabase
        .from('inoai_chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', sessionId)
    }

    return NextResponse.json({ reply, sources: chunks ?? [], session_id: sessionId })
  } catch (err: unknown) {
    console.error('INOai error:', err)
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
