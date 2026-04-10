// @ts-nocheck
import { createAdminClient } from '@/lib/supabase/admin'

const CRAWL_ROOTS = [
  'https://www.inometa.de/',
  'https://printing.inometa.de/',
]

const MAX_PAGES_PER_DOMAIN = 200
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
]

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

function extractLinks(html: string, baseUrl: string): { links: Set<string>; pdfs: Set<string> } {
  const base = new URL(baseUrl)
  const links = new Set<string>()
  const pdfs = new Set<string>()
  const hrefRe = /href=["']([^"'#?][^"']*?)["']/gi
  let match
  while ((match = hrefRe.exec(html)) !== null) {
    try {
      const url = new URL(match[1], baseUrl)
      if (url.hostname !== base.hostname) continue
      url.hash = ''
      if (!['http:', 'https:'].includes(url.protocol)) continue
      if (/\.pdf$/i.test(url.pathname)) { pdfs.add(url.href); continue }
      if (SKIP_PATTERNS.some(p => p.test(url.pathname + url.search))) continue
      links.add(url.href)
    } catch { /* ignore */ }
  }
  return { links, pdfs }
}

async function parsePdf(url: string): Promise<string> {
  const pdfParse = (await import('pdf-parse')).default
  const res = await fetch(url, {
    headers: { 'User-Agent': 'INOid-KI-Bot/1.0' },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  const data = await pdfParse(buffer)
  return data.text.replace(/\s{2,}/g, ' ').trim()
}

export type CrawlStats = {
  pagesFound: number
  pdfsFound: number
  chunksInserted: number
  errors: number
}

export async function runCrawl(log: (msg: string) => void): Promise<CrawlStats> {
  const admin = createAdminClient()
  const stats: CrawlStats = { pagesFound: 0, pdfsFound: 0, chunksInserted: 0, errors: 0 }

  log('🗑️  Lösche bestehende gecrawlte Einträge…')
  const { error: delErr } = await admin
    .from('inometa_knowledge')
    .delete()
    .in('source_type', ['website', 'datasheet'])
  if (delErr) throw new Error(`Löschen fehlgeschlagen: ${delErr.message}`)
  log('✓ Bestehende Einträge gelöscht')

  for (const rootUrl of CRAWL_ROOTS) {
    const base = new URL(rootUrl)
    log(`\n🕷️  Crawle ${base.hostname}…`)

    const visited = new Set<string>()
    const visitedPdfs = new Set<string>()
    const queue = [rootUrl]
    const pdfQueue: string[] = []
    const docs: { url: string; title: string; text: string; sourceType: string }[] = []

    // HTML crawlen
    while (queue.length > 0 && visited.size < MAX_PAGES_PER_DOMAIN) {
      const url = queue.shift()!
      if (visited.has(url)) continue
      visited.add(url)

      try {
        await sleep(CRAWL_DELAY_MS)
        const res = await fetch(url, {
          headers: { 'User-Agent': 'INOid-KI-Bot/1.0', Accept: 'text/html' },
          signal: AbortSignal.timeout(10000),
        })
        if (!res.ok) { log(`  ⚠️  ${url.replace(base.origin, '')} → HTTP ${res.status}`); continue }
        const ct = res.headers.get('content-type') ?? ''
        if (!ct.includes('text/html')) continue

        const html = await res.text()
        const title = extractTitle(html)
        const text = stripHtml(html)
        const wc = text.split(/\s+/).filter(Boolean).length
        if (wc < 50) continue

        log(`  📄 [${visited.size}] ${url.replace(base.origin, '')} → "${title}" (${wc} Wörter)`)
        docs.push({ url, title, text, sourceType: 'website' })
        stats.pagesFound++

        const { links, pdfs } = extractLinks(html, url)
        for (const l of links) if (!visited.has(l) && !queue.includes(l)) queue.push(l)
        for (const p of pdfs) if (!visitedPdfs.has(p) && !pdfQueue.includes(p)) pdfQueue.push(p)
      } catch (e: any) {
        log(`  ❌ ${url.replace(base.origin, '')} → ${e.message}`)
        stats.errors++
      }
    }

    // PDFs
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
        language: 'de',
        chunk_index: i,
      }))
      const { error } = await admin.from('inometa_knowledge').insert(rows)
      if (error) { log(`  ❌ DB-Fehler: ${error.message}`); stats.errors++ }
      else stats.chunksInserted += rows.length
    }
    log(`  ✅ ${stats.chunksInserted} Chunks total eingefügt`)
  }

  return stats
}
