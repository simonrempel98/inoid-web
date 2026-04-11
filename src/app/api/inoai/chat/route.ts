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

  // Kombinationsbegriffe hinzufügen wenn sowohl Base als auch Modifier matchen
  for (const combo of combos ?? []) {
    if (matchedBaseIds.has(combo.base_id as number) && matchedModifierIds.has(combo.modifier_id as number)) {
      ;(combo.extra_terms as string[]).forEach(t => extras.add(t))
    }
  }

  if (!extras.size) return query

  // websearch_to_tsquery-kompatibles OR-Format
  const allTerms = [query, ...Array.from(extras)]
  return allTerms.map(t => `"${t}"`).join(' OR ')
}

const SYSTEM_PROMPT = `Du bist INOai, der KI-Assistent der INOMETA GmbH.
Du beantwortest Fragen zu INOMETA-Produkten, Walzentechnologie und Druckmaschinenzubehör.
Du antwortest ausschließlich auf Basis der bereitgestellten Wissensbasis.
Wenn eine Frage nicht durch die Wissensbasis abgedeckt ist, sagst du das ehrlich und empfiehlst, INOMETA direkt zu kontaktieren.
Antworte präzise, professionell und auf Deutsch (außer der Nutzer fragt auf Englisch).
Verwende keine Emojis. Gliedere lange Antworten mit Absätzen.`

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const body = await req.json()
  const { message, history = [] }: { message: string; history: { role: string; content: string }[] } = body
  if (!message?.trim()) return NextResponse.json({ error: 'Keine Nachricht' }, { status: 400 })

  const admin = createAdminClient()

  // Query mit Synonymen erweitern
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
    return NextResponse.json({ reply, sources: chunks ?? [] })
  } catch (err: unknown) {
    console.error('INOai error:', err)
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
