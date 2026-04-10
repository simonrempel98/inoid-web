// @ts-nocheck
import { createAdminClient } from '@/lib/supabase/admin'

// ── Crawler-Konfigurationen ───────────────────────────────────────────────────

export type CrawlerConfig = {
  id: string
  name: string
  url: string       // Einstiegs-URL – Crawler bleibt innerhalb dieses Pfad-Präfixes
  lang: string
}

export const CRAWLERS: CrawlerConfig[] = [
  { id: 'inometa-de',   name: 'INOMETA (DE)',            url: 'https://www.inometa.de/',            lang: 'de' },
  { id: 'inometa-en',   name: 'INOMETA (EN)',            url: 'https://www.inometa.de/en/',          lang: 'en' },
  { id: 'printing-de',  name: 'Printing INOMETA (DE)',   url: 'https://printing.inometa.de/',        lang: 'de' },
  { id: 'printing-en',  name: 'Printing INOMETA (EN)',   url: 'https://printing.inometa.de/en/',     lang: 'en' },
  { id: 'apex-de',      name: 'APEX International (DE)', url: 'https://de.apexinternational.com/',   lang: 'de' },
]

// ── Einstellungen ─────────────────────────────────────────────────────────────

const CRAWL_DELAY_MS = 300

const SKIP_PATTERNS = [
  /\.(jpg|jpeg|png|gif|svg|webp|mp4|zip|docx?|xlsx?)$/i,
  /\?(utm_|ref=|session)/i,
  /#/,
  /\/wp-admin/,
  /\/feed\//,
  /\/tag\//,
  /\/author\//,
  /\/page\/\d+/,
  /\/karriere/i,
  /\/jobs/i,
  /\/stellenangebote/i,
]

// ── Hilfsfunktionen ───────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

function chunkText(text: string, maxWords = 400): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const chunks: string[] = []
  for (let i = 0; i < words.length; i += maxWords) {
    chunks.push(words.slice(i, i + maxWords).join(' '))
  }
  return chunks
}

function stripHtml(html: string): string {
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

function extractTitle(html: string): string {
  const h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
  if (h1) return h1[1].trim()
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return title ? title[1].replace(/\s*[-|–]\s*.*$/, '').trim() : 'Unbekannte Seite'
}

/** Links extrahieren – nur innerhalb des Root-Pfad-Präfixes */
function extractLinks(html: string, pageUrl: string, rootUrl: URL): { links: Set<string>; pdfs: Set<string> } {
  const links = new Set<string>()
  const pdfs = new Set<string>()
  const hrefRe = /href=["']([^"'#?][^"']*?)["']/gi
  let match
  while ((match = hrefRe.exec(html)) !== null) {
    try {
      const url = new URL(match[1], pageUrl)
      if (url.hostname !== rootUrl.hostname) continue
      url.hash = ''
      if (!['http:', 'https:'].includes(url.protocol)) continue
      if (/\.pdf$/i.test(url.pathname)) { pdfs.add(url.href); continue }
      if (SKIP_PATTERNS.some(p => p.test(url.pathname + url.search))) continue
      // Nur innerhalb des Root-Pfad-Präfixes crawlen
      if (!url.pathname.startsWith(rootUrl.pathname)) continue
      links.add(url.href)
    } catch { /* ignore */ }
  }
  return { links, pdfs }
}

async function parsePdf(url: string): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse')
  const res = await fetch(url, {
    headers: { 'User-Agent': 'INOid-KI-Bot/1.0' },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  const data = await pdfParse(buffer)
  return data.text.replace(/\s{2,}/g, ' ').trim()
}

// ── Haupt-Crawl-Funktion ──────────────────────────────────────────────────────

export type CrawlStats = {
  pagesFound: number
  pdfsFound: number
  chunksInserted: number
  errors: number
}

export async function runCrawl(
  crawlerId: string,
  log: (msg: string) => void,
): Promise<CrawlStats> {
  const config = CRAWLERS.find(c => c.id === crawlerId)
  if (!config) throw new Error(`Unbekannter Crawler: ${crawlerId}`)

  const admin = createAdminClient()
  const stats: CrawlStats = { pagesFound: 0, pdfsFound: 0, chunksInserted: 0, errors: 0 }
  const rootUrl = new URL(config.url)

  log(`🗑️  Lösche bestehende Einträge für "${config.name}"…`)
  const { error: delErr } = await admin
    .from('inometa_knowledge')
    .delete()
    .eq('crawler_id', crawlerId)
  if (delErr) throw new Error(`Löschen fehlgeschlagen: ${delErr.message}`)
  log(`✓ Einträge gelöscht`)

  log(`\n🕷️  Crawle ${config.url} (kein Seitenlimit)…`)

  const visited = new Set<string>()
  const visitedPdfs = new Set<string>()
  const queue = [config.url]
  const pdfQueue: string[] = []
  const docs: { url: string; title: string; text: string; sourceType: string }[] = []

  // HTML-Seiten crawlen
  while (queue.length > 0) {
    const url = queue.shift()!
    if (visited.has(url)) continue
    visited.add(url)

    try {
      await sleep(CRAWL_DELAY_MS)
      const res = await fetch(url, {
        headers: { 'User-Agent': 'INOid-KI-Bot/1.0', Accept: 'text/html' },
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) { log(`  ⚠️  ${url.replace(rootUrl.origin, '')} → HTTP ${res.status}`); continue }
      const ct = res.headers.get('content-type') ?? ''
      if (!ct.includes('text/html')) continue

      const html = await res.text()
      const title = extractTitle(html)
      const text = stripHtml(html)
      const wc = text.split(/\s+/).filter(Boolean).length
      if (wc < 50) continue

      log(`  📄 [${visited.size}] ${url.replace(rootUrl.origin, '')} → "${title}" (${wc} Wörter)`)
      docs.push({ url, title, text, sourceType: 'website' })
      stats.pagesFound++

      const { links, pdfs } = extractLinks(html, url, rootUrl)
      for (const l of links) if (!visited.has(l) && !queue.includes(l)) queue.push(l)
      for (const p of pdfs) if (!visitedPdfs.has(p) && !pdfQueue.includes(p)) pdfQueue.push(p)
    } catch (e: any) {
      log(`  ❌ ${url.replace(rootUrl.origin, '')} → ${e.message}`)
      stats.errors++
    }
  }

  // PDFs herunterladen
  if (pdfQueue.length > 0) {
    log(`\n  📑 ${pdfQueue.length} PDFs gefunden – lade herunter…`)
    for (const pdfUrl of pdfQueue) {
      visitedPdfs.add(pdfUrl)
      const filename = decodeURIComponent(pdfUrl.split('/').pop() ?? pdfUrl)
      try {
        await sleep(CRAWL_DELAY_MS)
        const text = await parsePdf(pdfUrl)
        const wc = text.split(/\s+/).filter(Boolean).length
        if (wc < 30) continue
        const title = filename.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ')
        log(`  📄 PDF: "${title}" (${wc} Wörter)`)
        docs.push({ url: pdfUrl, title, text, sourceType: 'datasheet' })
        stats.pdfsFound++
      } catch (e: any) {
        log(`  ❌ PDF ${filename} → ${e.message}`)
        stats.errors++
      }
    }
  }

  // In DB schreiben
  log(`\n  💾 Schreibe ${docs.length} Dokumente in Datenbank…`)
  for (const { url, title, text, sourceType } of docs) {
    const chunks = chunkText(text)
    const rows = chunks.map((content, i) => ({
      title: chunks.length > 1 ? `${title} (${i + 1}/${chunks.length})` : title,
      content,
      source_url: url,
      source_type: sourceType,
      language: config.lang,
      crawler_id: crawlerId,
      chunk_index: i,
    }))
    const { error } = await admin.from('inometa_knowledge').insert(rows)
    if (error) { log(`  ❌ DB-Fehler: ${error.message}`); stats.errors++ }
    else stats.chunksInserted += rows.length
  }

  return stats
}
