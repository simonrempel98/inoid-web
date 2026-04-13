// @ts-nocheck
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const { files } = await req.json()
  // files: Array<{ base64: string, mediaType: string, name: string }>
  if (!files?.length) return NextResponse.json({ error: 'Keine Dateien' }, { status: 400 })

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  // Content-Blöcke für Claude aufbauen
  const contentBlocks: any[] = files.map((f: { base64: string; mediaType: string }) => {
    if (f.mediaType === 'application/pdf') {
      return { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: f.base64 } }
    }
    return { type: 'image', source: { type: 'base64', media_type: f.mediaType, data: f.base64 } }
  })

  contentBlocks.push({
    type: 'text',
    text: `Du bist ein Experte für Asset-Management. Analysiere die bereitgestellten Dokumente/Bilder (Typenschilder, Lieferscheine, Rechnungen, Handbücher, Fotos von Geräten etc.) und extrahiere alle relevanten Informationen.

Antworte NUR mit einem validen JSON-Objekt, ohne Markdown, ohne Erklärungen:
{
  "title": "Gerätename / Bezeichnung (z.B. Frequenzumrichter ATV320)",
  "manufacturer": "Hersteller (z.B. Schneider Electric)",
  "article_number": "Artikel- oder Modellnummer",
  "serial_number": "Seriennummer",
  "description": "Kurze prägnante Beschreibung in 1-2 Sätzen",
  "category": "Passende Kategorie (z.B. Antriebstechnik, Werkzeugmaschine, Messgerät, Fahrzeug, IT-Hardware, Gebäudetechnik, Sonstiges)",
  "technical_data": {
    "Schlüssel": "Wert inkl. Einheit"
  },
  "commercial_data": {
    "Schlüssel": "Wert"
  }
}

Für technical_data: Leistung, Spannung, Strom, Frequenz, Drehzahl, Abmessungen, Gewicht, Schutzklasse, Temperaturbereich, etc.
Für commercial_data: Kaufpreis, Kaufdatum, Lieferant, Garantie bis, Bestellnummer, etc.
Nicht gefundene Felder: null (nicht weglassen, sondern null).
Für technical_data und commercial_data: leeres Objekt {} wenn nichts gefunden.`,
  })

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{ role: 'user', content: contentBlocks }],
  })

  const raw = response.content[0]?.type === 'text' ? response.content[0].text : ''
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) return NextResponse.json({ error: 'Extraktion fehlgeschlagen' }, { status: 422 })

  let data: any
  try {
    data = JSON.parse(match[0])
  } catch {
    return NextResponse.json({ error: 'JSON-Parsing fehlgeschlagen' }, { status: 422 })
  }

  return NextResponse.json({ data })
}
