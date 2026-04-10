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
 *   1. Crawlt alle Unterseiten der konfigurierten Domains automatisch
 *   2. Extrahiert den sichtbaren Text jeder Seite
 *   3. Chunked den Text in ~400-Wort-Abschnitte
 *   4. Schreibt alle Chunks in die inometa_knowledge Tabelle
 *
 * PDFs / Datenblätter als Text:
 *   - Lege .txt-Dateien in scripts/knowledge/ ab
 *   - Erste Zeile = Titel, Rest = Inhalt
 *   - Dateiname-Prefix: "datasheet_", "brochure_"
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { config } from 'dotenv'
import pdfParse from 'pdf-parse'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dirname, '..', '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Fehlende Umgebungsvariablen: NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY benötigt')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

// ── Konfiguration ─────────────────────────────────────────────────────────────

// Einstiegspunkte für den Crawler – alle Unterseiten werden automatisch gefunden
const CRAWL_ROOTS = [
  'https://www.inometa.de/',
  'https://printing.inometa.de/',
]

// Maximale Anzahl Seiten pro Domain (Sicherheitsgrenze)
const MAX_PAGES_PER_DOMAIN = 200

// Verzögerung zwischen Requests (ms) – höflich zum Server
const CRAWL_DELAY_MS = 300

// URL-Muster die NICHT gecrawlt werden sollen (regex)
const SKIP_PATTERNS = [
  /\.(jpg|jpeg|png|gif|svg|webp|mp4|zip|docx?|xlsx?)$/i,
  /\?(utm_|ref=|session)/i,
  /#/,
  /\/wp-admin/,
  /\/feed\//,
  /\/tag\//,
  /\/author\//,
  /\/page\/\d+/,
]

// ── Hilfsfunktionen ───────────────────────────────────────────────────────────

function chunkText(text, maxWords = 400) {
  const words = text.split(/\s+/).filter(Boolean)
  const chunks = []
  for (let i = 0; i < words.length; i += maxWords) {
    chunks.push(words.slice(i, i + maxWords).join(' '))
  }
  return chunks
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function extractTitle(html) {
  // Erst <h1>, dann <title>
  const h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
  if (h1) return h1[1].trim()
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return title ? title[1].replace(/\s*[-|–]\s*.*$/, '').trim() : 'Unbekannte Seite'
}

/** Alle internen Links + PDF-Links aus einer HTML-Seite extrahieren */
function extractLinks(html, baseUrl) {
  const base = new URL(baseUrl)
  const links = new Set()
  const pdfs = new Set()
  const hrefRe = /href=["']([^"'#?][^"']*?)["']/gi
  let match
  while ((match = hrefRe.exec(html)) !== null) {
    try {
      const url = new URL(match[1], baseUrl)
      if (url.hostname !== base.hostname) continue
      url.hash = ''
      if (!['http:', 'https:'].includes(url.protocol)) continue
      // PDFs separat sammeln
      if (/\.pdf$/i.test(url.pathname)) { pdfs.add(url.href); continue }
      if (SKIP_PATTERNS.some(p => p.test(url.pathname + url.search))) continue
      links.add(url.href)
    } catch {
      // ungültige URL ignorieren
    }
  }
  return { links, pdfs }
}

/** PDF herunterladen und Text extrahieren */
async function parsePdf(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'INOid-KI-Bot/1.0 (internal product knowledge indexer)' },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  const data = await pdfParse(buffer)
  return data.text.replace(/\s{2,}/g, ' ').trim()
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

// ── Crawler ───────────────────────────────────────────────────────────────────

async function crawlSite(rootUrl) {
  const base = new URL(rootUrl)
  const visited = new Set()
  const visitedPdfs = new Set()
  const queue = [rootUrl]
  const pdfQueue = []
  const results = []  // { url, title, text, sourceType }

  console.log(`\n🕷️  Starte Crawler für ${base.hostname}`)
  console.log(`   Max. ${MAX_PAGES_PER_DOMAIN} Seiten, ${CRAWL_DELAY_MS}ms Pause zwischen Requests\n`)

  // ── HTML-Seiten crawlen ──
  while (queue.length > 0 && visited.size < MAX_PAGES_PER_DOMAIN) {
    const url = queue.shift()
    if (visited.has(url)) continue
    visited.add(url)

    process.stdout.write(`  [${visited.size}] ${url.replace(base.origin, '')} `)

    try {
      await sleep(CRAWL_DELAY_MS)
      const res = await fetch(url, {
        headers: { 'User-Agent': 'INOid-KI-Bot/1.0 (internal product knowledge indexer)', 'Accept': 'text/html' },
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) { console.log(`→ HTTP ${res.status}`); continue }

      const contentType = res.headers.get('content-type') ?? ''
      if (!contentType.includes('text/html')) { console.log(`→ kein HTML`); continue }

      const html = await res.text()
      const title = extractTitle(html)
      const text = stripHtml(html)
      const wordCount = text.split(/\s+/).filter(Boolean).length

      if (wordCount < 50) { console.log(`→ zu wenig Text (${wordCount} Wörter)`); continue }

      console.log(`→ "${title}" (${wordCount} Wörter)`)
      results.push({ url, title, text, sourceType: 'website' })

      const { links, pdfs } = extractLinks(html, url)
      for (const link of links) {
        if (!visited.has(link) && !queue.includes(link)) queue.push(link)
      }
      for (const pdf of pdfs) {
        if (!visitedPdfs.has(pdf) && !pdfQueue.includes(pdf)) pdfQueue.push(pdf)
      }
    } catch (e) {
      console.log(`→ Fehler: ${e.message}`)
    }
  }

  if (queue.length > 0) {
    console.log(`\n  ⚠️  ${queue.length} weitere Seiten in Queue, Limit (${MAX_PAGES_PER_DOMAIN}) erreicht`)
  }

  // ── PDFs herunterladen & parsen ──
  if (pdfQueue.length > 0) {
    console.log(`\n  📄 ${pdfQueue.length} PDFs gefunden – lade herunter…\n`)
    for (const pdfUrl of pdfQueue) {
      visitedPdfs.add(pdfUrl)
      const filename = pdfUrl.split('/').pop()
      process.stdout.write(`  📄 ${filename} `)
      try {
        await sleep(CRAWL_DELAY_MS)
        const text = await parsePdf(pdfUrl)
        const wordCount = text.split(/\s+/).filter(Boolean).length
        if (wordCount < 30) { console.log(`→ zu wenig Text (${wordCount} Wörter)`); continue }
        const title = filename.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ')
        console.log(`→ "${title}" (${wordCount} Wörter)`)
        results.push({ url: pdfUrl, title, text, sourceType: 'datasheet' })
      } catch (e) {
        console.log(`→ Fehler: ${e.message}`)
      }
    }
  }

  console.log(`\n  ✅ ${results.length} Dokumente gecrawlt (inkl. ${pdfQueue.length} PDFs)`)
  return results
}

// ── Website-Ingestion ─────────────────────────────────────────────────────────

async function ingestWebsites() {
  if (CRAWL_ROOTS.length === 0) {
    console.log('ℹ️  Keine URLs in CRAWL_ROOTS konfiguriert')
    return 0
  }

  let total = 0

  for (const rootUrl of CRAWL_ROOTS) {
    const pages = await crawlSite(rootUrl)

    console.log(`\n💾 Schreibe ${pages.length} Dokumente in Datenbank…`)
    for (const { url, title, text, sourceType } of pages) {
      const chunks = chunkText(text)
      const rows = chunks.map((content, i) => ({
        title: chunks.length > 1 ? `${title} (${i + 1}/${chunks.length})` : title,
        content,
        source_url: url,
        source_type: sourceType,
        language: 'de',
        chunk_index: i,
      }))

      const { error } = await supabase.from('inometa_knowledge').insert(rows)
      if (error) {
        console.error(`  ❌ DB-Fehler für ${url}: ${error.message}`)
      } else {
        total += rows.length
      }
    }
    console.log(`  ✅ ${total} Chunks total eingefügt`)
  }

  return total
}

// ── Datei-Ingestion (Datenblätter/Broschüren als .txt) ───────────────────────

async function ingestLocalFiles() {
  const dir = join(__dirname, 'knowledge')
  if (!existsSync(dir)) {
    console.log('ℹ️  Kein scripts/knowledge/ Verzeichnis gefunden')
    return 0
  }

  const files = readdirSync(dir).filter(f => f.endsWith('.txt'))
  if (files.length === 0) {
    console.log('ℹ️  Keine .txt-Dateien in scripts/knowledge/')
    console.log('   → Dateiname-Prefix: "datasheet_" (Datenblatt) oder "brochure_" (Broschüre)')
    console.log('   → Erste Zeile = Titel, Rest = Inhalt')
    return 0
  }

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
    console.log(`  📂 ${file} → ${chunks.length} Chunks (${sourceType})`)

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
  console.log(`Domains: ${CRAWL_ROOTS.join(', ')}`)

  // Bestehende Einträge löschen (komplette Neuindexierung)
  console.log('\n🗑️  Lösche bestehende gecrawlte Einträge…')
  const { error: delErr } = await supabase
    .from('inometa_knowledge')
    .delete()
    .in('source_type', ['website', 'datasheet'])
  if (delErr) { console.error('❌ Löschen fehlgeschlagen:', delErr.message); process.exit(1) }

  console.log('\n🌐 Website-Crawling…')
  const webCount = await ingestWebsites()

  console.log('\n📁 Datei-Ingestion (Datenblätter/Broschüren)…')
  const fileCount = await ingestLocalFiles()

  console.log('\n' + '='.repeat(40))
  console.log(`✅ Fertig! ${webCount + fileCount} Chunks total in Wissensbasis`)
  console.log(`   - ${webCount} aus Websites`)
  console.log(`   - ${fileCount} aus lokalen Dateien`)
  console.log('\nINOai ist jetzt einsatzbereit.\n')
}

main().catch(e => { console.error(e); process.exit(1) })
