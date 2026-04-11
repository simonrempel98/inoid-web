// @ts-nocheck
import { createAdminClient } from '@/lib/supabase/admin'
import Anthropic from '@anthropic-ai/sdk'

export type CrawlerConfig = {
  id: string
  name: string
  url: string
  lang: string
}

export type ResumeState = {
  queue: string[]
  visited: string[]
  pdfQueue: string[]
  visitedPdfs: string[]
}

const CRAWL_DELAY_MS = 300
const MAX_RUN_MS = 50_000

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

function extractPdfs(html: string, pageUrl: string): Set<string> {
  const pdfs = new Set<string>()
  // 1. href/src/data-href/data-src/data-file Attribute
  const attrRe = /(?:href|src|data-href|data-src|data-file|data-url|data-link|action)=["']([^"']*\.pdf[^"']*?)["']/gi
  // 2. PDF-URLs in JavaScript-Strings, JSON, onclick, window.open(...)
  const jsRe = /["'`]((?:https?:\/\/|\/)[^"'`\s<>]*\.pdf[^"'`\s<>]*?)["'`]/gi
  // 3. Direkte absolute URLs im Text (z.B. in <p> oder Kommentaren)
  const absRe = /https?:\/\/[^\s"'<>]*\.pdf(?:[?#][^\s"'<>]*)?/gi

  for (const re of [attrRe, jsRe, absRe]) {
    let m
    while ((m = re.exec(html)) !== null) {
      const raw = (m[1] ?? m[0]).trim()
      try {
        const url = new URL(raw, pageUrl)
        url.hash = ''
        if (['http:', 'https:'].includes(url.protocol)) pdfs.add(url.href)
      } catch { /* ignore */ }
    }
  }
  return pdfs
}

function hasDoubledSegment(url: URL): boolean {
  const parts = url.pathname.split('/').filter(Boolean)
  for (let i = 0; i < parts.length - 1; i++) {
    if (parts[i] === parts[i + 1]) return true
  }
  return false
}

function extractLinks(html: string, pageUrl: string, rootUrl: URL): { links: Set<string>; pdfs: Set<string> } {
  const links = new Set<string>()

  // Alle PDF-URLs aus dem gesamten HTML-Quelltext
  const pdfs = extractPdfs(html, pageUrl)

  // HTML-Links für Weiter-Crawling
  const hrefRe = /href=["']([^"']+)["']/gi
  let match
  while ((match = hrefRe.exec(html)) !== null) {
    const raw = match[1].trim()
    if (!raw || raw.startsWith('#') || raw.startsWith('mailto:') || raw.startsWith('tel:') || raw.startsWith('javascript:')) continue
    if (/\.pdf/i.test(raw)) continue // bereits in pdfs
    try {
      const url = new URL(raw, pageUrl)
      url.hash = ''
      if (!['http:', 'https:'].includes(url.protocol)) continue
      if (url.hostname !== rootUrl.hostname) continue
      if (SKIP_PATTERNS.some(p => p.test(url.pathname + url.search))) continue
      if (!url.pathname.startsWith(rootUrl.pathname)) continue
      if (hasDoubledSegment(url)) continue
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

async function saveChunks(
  admin: ReturnType<typeof createAdminClient>,
  url: string,
  title: string,
  text: string,
  sourceType: string,
  lang: string,
  crawlerId: string,
  log: (msg: string) => void,
): Promise<{ inserted: number; error: boolean }> {
  const chunks = chunkText(text)
  const rows = chunks.map((content, i) => ({
    title: chunks.length > 1 ? `${title} (${i + 1}/${chunks.length})` : title,
    content,
    source_url: url,
    source_type: sourceType,
    language: lang,
    crawler_id: crawlerId,
    chunk_index: i,
  }))
  const { error } = await admin.from('inometa_knowledge').insert(rows)
  if (error) { log(`  ❌ DB-Fehler: ${error.message}`); return { inserted: 0, error: true } }
  return { inserted: rows.length, error: false }
}

export type CrawlStats = {
  pagesFound: number
  pdfsFound: number
  chunksInserted: number
  errors: number
}

export type CrawlResult = {
  done: boolean
  resume?: ResumeState
  stats: CrawlStats
}

// ── DB-Job-basierter Crawl (browserunabhängig) ───────────────────────────────

// ── Self-trigger: nächsten Chunk ohne Cron starten ───────────────────────────

function selfTriggerCrawl() {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
    'http://localhost:3000'
  const secret = process.env.CRON_SECRET ?? ''
  fetch(`${base}/api/cron/inoai-crawl`, {
    headers: { Authorization: `Bearer ${secret}` },
  }).catch(() => {/* ignore */})
}

// ── Synonyme automatisch nach Crawl erweitern ────────────────────────────────

async function autoExtendSynonyms(
  admin: ReturnType<typeof createAdminClient>,
  crawlerId: string,
  log: (msg: string) => void,
): Promise<void> {
  try {
    const [{ data: items }, { data: existing }] = await Promise.all([
      admin.from('inometa_knowledge').select('title').eq('crawler_id', crawlerId).limit(120),
      admin.from('inoai_synonyms').select('terms'),
    ])
    if (!items?.length) return

    const existingTerms = new Set(
      (existing ?? []).flatMap((g: any) => (g.terms as string[]).map(t => t.toLowerCase()))
    )
    const titles = [...new Set(items.map((i: any) => i.title).filter(Boolean))].slice(0, 60).join('\n')

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: `Du bist Experte für Flexodruck und Walzentechnologie (INOMETA GmbH).
Analysiere diese Seitentitel einer gecrawlten Webseite und leite daraus neue Synonym-Gruppen für technische Fachbegriffe ab.

Bereits in der Datenbank (nicht wiederholen): ${[...existingTerms].slice(0, 80).join(', ')}

Seitentitel:
${titles}

Erstelle 5-8 neue Synonym-Gruppen für Fachbegriffe die noch NICHT in der Datenbank sind.
Ausgabe: Eine Gruppe pro Zeile, Begriffe kommagetrennt, alles kleingeschrieben, keine Erklärungen.
Beispiel: anilox, rasterwalze, aniloxwalze`,
      }],
    })

    const text = response.content[0]?.type === 'text' ? response.content[0].text.trim() : ''
    const lines = text.split('\n').map((l: string) => l.trim()).filter(Boolean)

    let added = 0
    for (const line of lines) {
      const terms = line.replace(/^[-*•]\s*/, '').split(',').map((t: string) => t.trim().toLowerCase()).filter(Boolean)
      if (terms.length < 2) continue
      if (terms.some((t: string) => existingTerms.has(t))) continue // schon bekannt
      const { error } = await admin.from('inoai_synonyms').insert({ terms })
      if (!error) { added++; terms.forEach((t: string) => existingTerms.add(t)) }
    }
    if (added > 0) log(`🔤 ${added} neue Synonym-Gruppen automatisch hinzugefügt`)
  } catch (e: any) {
    log(`⚠️ Synonym-Erweiterung: ${e.message}`)
  }
}

export async function runCrawlJob(jobId: string): Promise<void> {
  const admin = createAdminClient()

  const { data: job, error: jobErr } = await admin
    .from('inoai_crawl_jobs').select('*').eq('id', jobId).single()
  if (jobErr || !job) throw new Error(`Job nicht gefunden: ${jobId}`)

  if (job.status === 'done' || job.status === 'error') return

  await admin.from('inoai_crawl_jobs').update({
    status: 'running',
    started_at: job.started_at ?? new Date().toISOString(),
  }).eq('id', jobId)

  // Puffer für Log-Einträge – in Gruppen in DB schreiben
  const flushedLog: string[] = [...(job.log ?? [])]
  const pending: string[] = []

  async function flushLog(force = false) {
    if (!force && pending.length < 8) return
    if (pending.length === 0) return
    flushedLog.push(...pending.splice(0))
    await admin.from('inoai_crawl_jobs').update({ log: flushedLog }).eq('id', jobId)
  }

  function log(msg: string) {
    pending.push(msg)
    flushLog() // fire-and-forget
  }

  try {
    const resume = job.resume_state as ResumeState | undefined

    // Vor erstem Crawl: bestehende URLs snapshotten (für Diff)
    let beforeUrls: string[] = (job.diff as any)?.before ?? []
    if (!resume && beforeUrls.length === 0) {
      const { data: existing } = await admin
        .from('inometa_knowledge').select('source_url').eq('crawler_id', job.crawler_id)
      beforeUrls = [...new Set((existing ?? []).map((r: any) => r.source_url))]
    }

    const result = await runCrawl(job.crawler_id, log, resume)
    await flushLog(true)

    if (result.done) {
      const { data: newRows } = await admin
        .from('inometa_knowledge').select('source_url').eq('crawler_id', job.crawler_id)
      const afterUrls = [...new Set((newRows ?? []).map((r: any) => r.source_url))]
      const beforeSet = new Set(beforeUrls)
      const afterSet = new Set(afterUrls)
      const added = afterUrls.filter(u => !beforeSet.has(u))
      const removed = beforeUrls.filter(u => !afterSet.has(u))

      const s = result.stats
      log(`\n✅ Fertig! ${s.pagesFound} Seiten · ${s.pdfsFound} PDFs · ${s.chunksInserted} Chunks · ${s.errors} Fehler`)
      if (beforeUrls.length > 0) {
        if (added.length > 0) log(`📈 ${added.length} neue Seiten/Dokumente`)
        if (removed.length > 0) log(`📉 ${removed.length} entfernt`)
        if (added.length === 0 && removed.length === 0) log(`↔ Keine Änderungen gegenüber letztem Crawl`)
      }

      // Synonymdatenbank automatisch erweitern
      log(`\n🔤 Analysiere Inhalte für neue Synonyme…`)
      await flushLog(true)
      await autoExtendSynonyms(admin, job.crawler_id, log)
      await flushLog(true)

      await admin.from('inoai_crawl_jobs').update({
        status: 'done',
        stats: result.stats as any,
        diff: { added, removed, before: beforeUrls } as any,
        resume_state: null,
        finished_at: new Date().toISOString(),
      }).eq('id', jobId)
    } else {
      await admin.from('inoai_crawl_jobs').update({
        status: 'paused',
        stats: result.stats as any,
        resume_state: result.resume as any,
        diff: { before: beforeUrls } as any,
      }).eq('id', jobId)

      // Self-trigger: nächsten Chunk sofort starten, kein Cron nötig
      selfTriggerCrawl()
    }
  } catch (e: any) {
    pending.push(`❌ Fehler: ${e.message}`)
    await flushLog(true)
    await admin.from('inoai_crawl_jobs').update({
      status: 'error',
      finished_at: new Date().toISOString(),
    }).eq('id', jobId)
  }
}

export async function runCrawl(
  crawlerId: string,
  log: (msg: string) => void,
  resume?: ResumeState,
): Promise<CrawlResult> {
  const admin = createAdminClient()
  const startTime = Date.now()

  const { data: config, error: cfgErr } = await admin
    .from('inoai_crawlers')
    .select('*')
    .eq('id', crawlerId)
    .single()
  if (cfgErr || !config) throw new Error(`Crawler nicht gefunden: ${crawlerId}`)

  const stats: CrawlStats = { pagesFound: 0, pdfsFound: 0, chunksInserted: 0, errors: 0 }
  const rootUrl = new URL(config.url)

  if (!resume) {
    log(`🗑️  Lösche bestehende Einträge für "${config.name}"…`)
    const { error: delErr } = await admin
      .from('inometa_knowledge')
      .delete()
      .eq('crawler_id', crawlerId)
    if (delErr) throw new Error(`Löschen fehlgeschlagen: ${delErr.message}`)
    log(`✓ Einträge gelöscht`)
    log(`\n🕷️  Crawle ${config.url}…`)
  } else {
    log(`▶ Weiter: ${resume.queue.length} Seiten + ${resume.pdfQueue.length} PDFs verbleibend…`)
  }

  const visited = new Set<string>(resume?.visited ?? [])
  const visitedPdfs = new Set<string>(resume?.visitedPdfs ?? [])
  const queue: string[] = resume?.queue ?? [config.url]
  const pdfQueue: string[] = resume?.pdfQueue ?? []

  while (queue.length > 0) {
    if (Date.now() - startTime > MAX_RUN_MS) {
      log(`⏱️  Zeitlimit erreicht – pausiere (${queue.length} Seiten + ${pdfQueue.length} PDFs verbleibend)`)
      return {
        done: false,
        resume: { queue, visited: Array.from(visited), pdfQueue, visitedPdfs: Array.from(visitedPdfs) },
        stats,
      }
    }

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

      const { inserted, error } = await saveChunks(admin, url, title, text, 'website', config.lang, crawlerId, log)
      if (error) stats.errors++
      else { stats.chunksInserted += inserted; stats.pagesFound++ }

      const { links, pdfs } = extractLinks(html, url, rootUrl)
      for (const l of links) if (!visited.has(l) && !queue.includes(l)) queue.push(l)
      let newPdfs = 0
      for (const p of pdfs) { if (!visitedPdfs.has(p) && !pdfQueue.includes(p)) { pdfQueue.push(p); newPdfs++ } }
      if (newPdfs > 0) log(`    📎 ${newPdfs} PDF(s) entdeckt`)
    } catch (e: any) {
      log(`  ❌ ${url.replace(rootUrl.origin, '')} → ${e.message}`)
      stats.errors++
    }
  }

  if (pdfQueue.length > 0) {
    log(`\n  📑 ${pdfQueue.length} PDFs – lade herunter…`)
    while (pdfQueue.length > 0) {
      if (Date.now() - startTime > MAX_RUN_MS) {
        log(`⏱️  Zeitlimit erreicht – pausiere (${pdfQueue.length} PDFs verbleibend)`)
        return {
          done: false,
          resume: { queue: [], visited: Array.from(visited), pdfQueue, visitedPdfs: Array.from(visitedPdfs) },
          stats,
        }
      }

      const pdfUrl = pdfQueue.shift()!
      visitedPdfs.add(pdfUrl)
      const filename = decodeURIComponent(pdfUrl.split('/').pop() ?? pdfUrl)
      try {
        await sleep(CRAWL_DELAY_MS)
        const text = await parsePdf(pdfUrl)
        const wc = text.split(/\s+/).filter(Boolean).length
        if (wc < 30) continue
        const title = filename.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ')
        log(`  📄 PDF: "${title}" (${wc} Wörter)`)
        const { inserted, error } = await saveChunks(admin, pdfUrl, title, text, 'datasheet', config.lang, crawlerId, log)
        if (error) stats.errors++
        else { stats.chunksInserted += inserted; stats.pdfsFound++ }
      } catch (e: any) {
        log(`  ❌ PDF ${filename} → ${e.message}`)
        stats.errors++
      }
    }
  }

  return { done: true, stats }
}
