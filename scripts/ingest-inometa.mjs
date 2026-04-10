/**
 * INOMETA Knowledge Base Ingestion Script
 *
 * Usage:
 *   node scripts/ingest-inometa.mjs
 *
 * Env vars benötigt (in .env.local oder als Shell-Variablen):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Was dieses Script tut:
 *   1. Ruft die INOMETA-Webseiten ab und extrahiert Text
 *   2. Chunked den Text in ~400-Wort-Abschnitte
 *   3. Schreibt alle Chunks in die inometa_knowledge Tabelle
 *
 * PDFs (Datenblätter, Broschüren):
 *   - Lege Text-Dateien in scripts/knowledge/ ab (eine Datei = ein Dokument)
 *   - Format: Erste Zeile = Titel, Rest = Inhalt
 *   - source_type in Dateiname: "datasheet_" oder "brochure_" als Prefix
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { config } from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dirname, '..', '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Fehlende Umgebungsvariablen: NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY benötigt')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

// ── Konfiguration: INOMETA-Webseiten ──────────────────────────────────────────
// Trage hier alle INOMETA-URLs ein, die indexiert werden sollen:
const WEB_URLS = [
  // Beispiele – durch echte INOMETA-URLs ersetzen:
  // 'https://www.inometa.de/produkte',
  // 'https://www.inometa.de/trägerstangen',
  // 'https://www.inometa.de/sleeves',
]

// ── Hilfsfunktionen ───────────────────────────────────────────────────────────

/** Text in Chunks aufteilen (~400 Wörter) */
function chunkText(text, maxWords = 400) {
  const words = text.split(/\s+/).filter(Boolean)
  const chunks = []
  for (let i = 0; i < words.length; i += maxWords) {
    chunks.push(words.slice(i, i + maxWords).join(' '))
  }
  return chunks
}

/** HTML-Tags entfernen + Whitespace normalisieren */
function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/** Seiten-Titel aus HTML extrahieren */
function extractTitle(html) {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return match ? match[1].replace(/\s*[-|]\s*.*$/, '').trim() : 'Unbekannte Seite'
}

// ── Website-Ingestion ─────────────────────────────────────────────────────────
async function ingestUrls() {
  if (WEB_URLS.length === 0) {
    console.log('ℹ️  Keine URLs konfiguriert (WEB_URLS in scripts/ingest-inometa.mjs)')
    return 0
  }

  let total = 0
  for (const url of WEB_URLS) {
    try {
      console.log(`🌐 Lade: ${url}`)
      const res = await fetch(url, {
        headers: { 'User-Agent': 'INOid-KI-Bot/1.0 (internal indexer)' },
      })
      if (!res.ok) { console.warn(`  ⚠️  HTTP ${res.status}`); continue }
      const html = await res.text()
      const title = extractTitle(html)
      const text = stripHtml(html)
      const chunks = chunkText(text)
      console.log(`  📄 "${title}" → ${chunks.length} Chunks`)

      const rows = chunks.map((content, i) => ({
        title: chunks.length > 1 ? `${title} (${i + 1}/${chunks.length})` : title,
        content,
        source_url: url,
        source_type: 'website',
        language: 'de',
        chunk_index: i,
      }))

      const { error } = await supabase.from('inometa_knowledge').insert(rows)
      if (error) console.error(`  ❌ DB-Fehler: ${error.message}`)
      else { total += rows.length; console.log(`  ✅ ${rows.length} Chunks eingefügt`) }
    } catch (e) {
      console.error(`  ❌ Fehler beim Laden von ${url}:`, e.message)
    }
  }
  return total
}

// ── Datei-Ingestion (Datenblätter/Broschüren als .txt) ───────────────────────
async function ingestLocalFiles() {
  const dir = join(__dirname, 'knowledge')
  if (!existsSync(dir)) {
    console.log('ℹ️  Kein scripts/knowledge/ Verzeichnis gefunden')
    console.log('   → Lege .txt-Dateien in scripts/knowledge/ ab:')
    console.log('     - Erste Zeile: Titel des Dokuments')
    console.log('     - Rest: Inhalt')
    console.log('     - Dateiname-Prefix: "datasheet_", "brochure_", oder "website_"')
    return 0
  }

  const files = readdirSync(dir).filter(f => f.endsWith('.txt'))
  if (files.length === 0) { console.log('ℹ️  Keine .txt-Dateien in scripts/knowledge/'); return 0 }

  let total = 0
  for (const file of files) {
    const raw = readFileSync(join(dir, file), 'utf-8').trim()
    const lines = raw.split('\n')
    const title = lines[0].trim()
    const content = lines.slice(1).join('\n').trim()

    let sourceType = 'website'
    if (file.startsWith('datasheet_')) sourceType = 'datasheet'
    else if (file.startsWith('brochure_')) sourceType = 'brochure'

    const chunks = chunkText(content)
    console.log(`📂 ${file} → ${chunks.length} Chunks (${sourceType})`)

    const rows = chunks.map((chunk, i) => ({
      title: chunks.length > 1 ? `${title} (${i + 1}/${chunks.length})` : title,
      content: chunk,
      source_url: null,
      source_type: sourceType,
      language: 'de',
      chunk_index: i,
    }))

    const { error } = await supabase.from('inometa_knowledge').insert(rows)
    if (error) console.error(`  ❌ DB-Fehler: ${error.message}`)
    else { total += rows.length; console.log(`  ✅ ${rows.length} Chunks eingefügt`) }
  }
  return total
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🤖 INOai Knowledge Base Ingestion\n' + '='.repeat(40))

  // Bestehende Einträge löschen (komplette Neuindexierung)
  console.log('\n🗑️  Lösche bestehende Einträge…')
  const { error: delErr } = await supabase.from('inometa_knowledge').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (delErr) { console.error('❌ Löschen fehlgeschlagen:', delErr.message); process.exit(1) }

  console.log('\n🌐 Website-Ingestion…')
  const webCount = await ingestUrls()

  console.log('\n📁 Datei-Ingestion…')
  const fileCount = await ingestLocalFiles()

  console.log('\n' + '='.repeat(40))
  console.log(`✅ Fertig! ${webCount + fileCount} Chunks total in Wissensbasis`)
  console.log('\nNächste Schritte:')
  console.log('  1. Füge INOMETA-URLs in WEB_URLS ein und führe das Script erneut aus')
  console.log('  2. Lege Datenblatt-Texte als .txt in scripts/knowledge/ ab')
  console.log('  3. Script bei neuen Inhalten erneut ausführen (ersetzt alle bestehenden Einträge)\n')
}

main().catch(e => { console.error(e); process.exit(1) })
