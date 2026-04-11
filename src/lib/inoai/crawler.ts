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

async function selfTriggerCrawl() {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
    'http://localhost:3000'
  const secret = process.env.CRON_SECRET ?? ''
  try {
    // Await bis der Cron-Endpoint die 200-Antwort schickt (nicht bis der Job fertig ist)
    await fetch(`${base}/api/cron/inoai-crawl`, {
      headers: { Authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(8000),
    })
  } catch { /* ignore */ }
}

// ── Synonyme aus Crawl-Daten anreichern ──────────────────────────────────────
// Nach jedem erfolgreichen Crawl:
// 1. Bestehende Gruppen mit neuen Termen ergänzen (aus Seitentiteln + Inhalt)
// 2. Komplett neue Gruppen für bisher unbekannte Fachbegriffe anlegen
// 3. Strikte Duplikatprüfung über ALLE bekannten Terme

async function enrichSynonymsFromCrawl(
  admin: ReturnType<typeof createAdminClient>,
  crawlerId: string,
  log: (msg: string) => void,
): Promise<void> {
  try {
    // Gecrawlte Inhalte + alle bestehenden Gruppen parallel laden
    const [{ data: knowledge }, { data: existingGroups }] = await Promise.all([
      admin.from('inometa_knowledge')
        .select('title, content')
        .eq('crawler_id', crawlerId)
        .limit(80),
      admin.from('inoai_synonyms').select('id, terms, group_type'),
    ])
    if (!knowledge?.length) return

    // Alle bekannten Terme in einer Menge (für Duplikatcheck)
    const allKnown = new Map<string, number>() // term → group id
    for (const g of (existingGroups ?? []) as any[]) {
      for (const t of g.terms as string[]) allKnown.set(t.toLowerCase(), g.id)
    }

    // Textmaterial: Titel + erste 300 Zeichen jedes Chunks
    const textSample = (knowledge as any[])
      .map(k => `${k.title ?? ''}\n${(k.content as string).slice(0, 300)}`)
      .join('\n---\n')
      .slice(0, 6000)

    // Bestehende Gruppen kompakt als "id: primaryTerm" für den Prompt
    const groupIndex = ((existingGroups ?? []) as any[])
      .map(g => `${g.id}:${(g.terms as string[])[0]}`)
      .join(', ')

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1200,
      messages: [{
        role: 'user',
        content: `You are a flexo printing terminology expert. Analyze crawled content and improve the synonym database.

EXISTING GROUPS (id:primaryTerm) — do NOT create duplicates for these:
${groupIndex}

ALL KNOWN TERMS (never repeat any of these): ${[...allKnown.keys()].slice(0, 120).join(', ')}

CRAWLED CONTENT SAMPLE:
${textSample}

Your tasks:
1. ENRICH existing groups: find technical terms in the content that clearly belong to an existing group but are missing. Include multilingual variants (all 28 app languages where genuinely used in technical literature).
2. NEW groups: find technical flexo printing terms not covered by any existing group. Each new group must be multilingual from the start.

Rules:
- Never repeat a term already in "ALL KNOWN TERMS"
- A term can only belong to ONE group
- Minimum 2 terms per group
- All terms lowercase

Respond ONLY with compact JSON, no explanation:
{
  "enrich": [{"id": 12, "add": ["neuerterm", "nouveau terme"]}, ...],
  "new": [["term1","term2","term3"], ...]
}`,
      }],
    })

    const raw = response.content[0]?.type === 'text' ? response.content[0].text : ''
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return

    const result: { enrich?: { id: number; add: string[] }[]; new?: string[][] } = JSON.parse(jsonMatch[0])

    let enriched = 0
    let created = 0

    // 1. Bestehende Gruppen anreichern
    for (const e of result.enrich ?? []) {
      const group = (existingGroups as any[])?.find((g: any) => g.id === e.id)
      if (!group) continue
      const fresh = e.add
        .map((t: string) => t.toLowerCase().trim())
        .filter((t: string) => t.length > 1 && !allKnown.has(t))
      if (fresh.length === 0) continue
      const merged = [...new Set([...(group.terms as string[]), ...fresh])]
      const { error } = await admin.from('inoai_synonyms').update({ terms: merged }).eq('id', e.id)
      if (!error) { fresh.forEach((t: string) => allKnown.set(t, e.id)); enriched++ }
    }

    // 2. Neue Gruppen anlegen
    for (const terms of result.new ?? []) {
      const clean = [...new Set(
        terms.map((t: string) => t.toLowerCase().trim()).filter((t: string) => t.length > 1 && !allKnown.has(t))
      )]
      if (clean.length < 2) continue
      const { data, error } = await admin.from('inoai_synonyms').insert({ terms: clean }).select('id').single()
      if (!error && data) { clean.forEach((t: string) => allKnown.set(t, (data as any).id)); created++ }
    }

    const parts = []
    if (enriched > 0) parts.push(`${enriched} Gruppen erweitert`)
    if (created > 0) parts.push(`${created} neue Gruppen`)
    if (parts.length > 0) log(`🔤 Synonyme: ${parts.join(' · ')}`)
  } catch (e: any) {
    log(`⚠️ Synonym-Anreicherung: ${e.message}`)
  }
}

// ── Synonym-Matrix automatisch pflegen ───────────────────────────────────────
// Läuft nach jedem erfolgreichen Crawl:
// 1. Klassifiziert ungetaggte Gruppen als base/modifier/standalone per KI
// 2. Generiert fehlende Kombinationsbegriffe für base×modifier-Paare per KI

export async function syncSynonymMatrix(
  admin: ReturnType<typeof createAdminClient>,
  log: (msg: string) => void,
): Promise<void> {
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    // 1. Alle Gruppen laden
    const { data: groups } = await admin.from('inoai_synonyms').select('id, terms, group_type')
    if (!groups?.length) return

    // 2. Ungetaggte Gruppen klassifizieren
    const untagged = groups.filter((g: any) => g.group_type === 'standalone')
    if (untagged.length > 0) {
      const classifyRes = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        messages: [{
          role: 'user',
          content: `Classify these flexo printing synonym groups for a search matrix.
"base" = physical objects/components (anilox, rakel, walze, sleeve, druckplatte, trockner, druckmaschine, keramik, substrat, farbe)
"modifier" = actions/properties (reinigung, verschleiß, wartung, beschichtung, kalibrierung, gravur, viskosität, prüfung, härtung, tonwertzuwachs)
"standalone" = everything else (processes, technologies, materials, general concepts)

Groups (id: primary_term):
${untagged.map((g: any) => `${g.id}: ${(g.terms as string[])[0]}`).join('\n')}

Respond ONLY with compact JSON array, no explanation:
[{"id":1,"t":"base"},{"id":2,"t":"modifier"},{"id":3,"t":"standalone"}]`,
        }],
      })
      const raw = classifyRes.content[0]?.type === 'text' ? classifyRes.content[0].text : ''
      const jsonMatch = raw.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const classifications: { id: number; t: string }[] = JSON.parse(jsonMatch[0])
        let updated = 0
        for (const c of classifications) {
          if (c.t === 'base' || c.t === 'modifier') {
            await admin.from('inoai_synonyms').update({ group_type: c.t }).eq('id', c.id)
            updated++
          }
        }
        if (updated > 0) log(`🏷️  ${updated} Synonym-Gruppen klassifiziert (Basis/Modifikator)`)
      }
    }

    // 3. Aktuelle Klassifizierung neu laden
    const { data: current } = await admin.from('inoai_synonyms').select('id, terms, group_type')
    const bases = (current ?? []).filter((g: any) => g.group_type === 'base')
    const modifiers = (current ?? []).filter((g: any) => g.group_type === 'modifier')
    if (bases.length === 0 || modifiers.length === 0) return

    // 4. Fehlende Kombinationen finden
    const { data: existing } = await admin.from('inoai_synonym_combinations').select('base_id, modifier_id')
    const existingSet = new Set((existing ?? []).map((c: any) => `${c.base_id}-${c.modifier_id}`))

    const missing: { base: any; mod: any }[] = []
    for (const b of bases) {
      for (const m of modifiers) {
        if (!existingSet.has(`${b.id}-${m.id}`)) missing.push({ base: b, mod: m })
      }
    }
    if (missing.length === 0) return

    // 5. Kombinationsbegriffe in Batches generieren (max 12 pro Anfrage)
    const BATCH = 12
    let generated = 0
    for (let i = 0; i < missing.length; i += BATCH) {
      const batch = missing.slice(i, i + BATCH)
      const genRes = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        messages: [{
          role: 'user',
          content: `Generate 3-5 German/English compound search terms for flexo printing concept pairs.
Only include terms that would actually appear in technical texts about flexo printing.
If a combination doesn't make practical sense, return an empty array for it.

Pairs (index: base × modifier):
${batch.map((p, j) => `${j}: ${(p.base.terms as string[])[0]} × ${(p.mod.terms as string[])[0]}`).join('\n')}

Respond ONLY with compact JSON, no explanation:
[{"i":0,"terms":["compound1","compound2"]},{"i":1,"terms":[]}]`,
        }],
      })
      const raw2 = genRes.content[0]?.type === 'text' ? genRes.content[0].text : ''
      const jsonMatch2 = raw2.match(/\[[\s\S]*\]/)
      if (!jsonMatch2) continue
      const results: { i: number; terms: string[] }[] = JSON.parse(jsonMatch2[0])
      for (const r of results) {
        const pair = batch[r.i]
        if (!pair || r.terms.length === 0) continue
        const { error } = await admin.from('inoai_synonym_combinations').insert({
          base_id: pair.base.id,
          modifier_id: pair.mod.id,
          extra_terms: r.terms.map((t: string) => t.toLowerCase()),
          active: true,
        }).select()
        if (!error) generated++
      }
    }
    if (generated > 0) log(`⊞ ${generated} Kreuzreferenz-Kombinationen automatisch generiert`)
  } catch (e: any) {
    log(`⚠️ Matrix-Pflege: ${e.message}`)
  }
}

// ── Mehrsprachige Synonyme ergänzen ──────────────────────────────────────────
// Reichert bestehende Gruppen mit Übersetzungen in allen Sprachen an.
// Manuell triggerbar + läuft nach jedem Crawl auf ungefüllten Gruppen.

// Alle App-Sprachen aus src/i18n/config.ts
const SUPPORTED_LANGS = [
  'de', 'en', 'fr', 'es', 'it', 'pt', 'nl', 'pl', 'tr',
  'ru', 'uk', 'bg', 'ro', 'cs', 'sk', 'hu', 'hr', 'sr',
  'el', 'fi', 'sv', 'da', 'no', 'lt', 'lv', 'et', 'ja', 'zh',
]

export async function syncMultilingualSynonyms(
  admin: ReturnType<typeof createAdminClient>,
  log: (msg: string) => void,
): Promise<void> {
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const { data: groups } = await admin.from('inoai_synonyms').select('id, terms')
    if (!groups?.length) return

    // Nur Gruppen mit wenigen Termen anreichern (wahrscheinlich einsprachig)
    const needsEnrichment = (groups as any[]).filter(g => (g.terms as string[]).length < 5)
    if (needsEnrichment.length === 0) return

    const BATCH = 5
    let enriched = 0

    for (let i = 0; i < needsEnrichment.length; i += BATCH) {
      const batch = needsEnrichment.slice(i, i + BATCH)

      const res = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        messages: [{
          role: 'user',
          content: `Flexo printing expert. Add translations for these synonym groups.
Languages: ${SUPPORTED_LANGS.join(', ')}.
Only add terms genuinely used in flexo printing technical texts. Skip brand names.
Return only groups where you added terms.

Groups (id: terms):
${batch.map((g: any) => `${g.id}: ${(g.terms as string[]).join(', ')}`).join('\n')}

Respond ONLY with JSON array:
[{"id":1,"terms":["existing1","new_fr","new_es"]}]`,
        }],
      })

      const raw = res.content[0]?.type === 'text' ? res.content[0].text : ''
      const match = raw.match(/\[[\s\S]*\]/)
      if (!match) continue

      let updates: { id: number; terms: string[] }[]
      try {
        updates = JSON.parse(match[0])
      } catch {
        continue
      }

      for (const u of updates) {
        const original = batch.find((g: any) => g.id === u.id)
        if (!original || !Array.isArray(u.terms)) continue
        const merged = [...new Set([...(original.terms as string[]), ...u.terms.map((t: string) => t.toLowerCase())])]
        if (merged.length > (original.terms as string[]).length) {
          await admin.from('inoai_synonyms').update({ terms: merged }).eq('id', u.id)
          enriched++
        }
      }
    }

    log(`🌍 ${enriched} Synonym-Gruppen mehrsprachig erweitert`)
  } catch (e: any) {
    log(`⚠️ Mehrsprachig-Sync: ${e.message}`)
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

      // Synonymdatenbank automatisch erweitern + Matrix pflegen
      log(`\n🔤 Analysiere Inhalte für neue Synonyme…`)
      await flushLog(true)
      await enrichSynonymsFromCrawl(admin, job.crawler_id, log)
      await syncMultilingualSynonyms(admin, log)
      await syncSynonymMatrix(admin, log)
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

      // Self-trigger: await bis Cron-Endpoint 200 antwortet, dann ist Kette gesichert
      await selfTriggerCrawl()
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
