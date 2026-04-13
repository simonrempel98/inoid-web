// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// ── Text extraction ──────────────────────────────────────────────────────────

function chunkText(text: string, maxWords = 400): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const chunks: string[] = []
  for (let i = 0; i < words.length; i += maxWords) {
    chunks.push(words.slice(i, i + maxWords).join(' '))
  }
  return chunks.filter(c => c.length > 0)
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s{2,}/g, ' ').trim()
}

async function extractText(
  buffer: Buffer,
  filename: string,
  mimeType: string,
): Promise<{ text: string; title: string }> {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  const baseName = filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')

  if (ext === 'pdf' || mimeType === 'application/pdf') {
    const pdfParse = require('pdf-parse')
    const data = await pdfParse(buffer)
    return { text: data.text.replace(/\s{2,}/g, ' ').trim(), title: baseName }
  }
  if (ext === 'docx' || mimeType.includes('wordprocessingml')) {
    const mammoth = require('mammoth')
    const result = await mammoth.extractRawText({ buffer })
    return { text: result.value.replace(/\s{2,}/g, ' ').trim(), title: baseName }
  }
  if (ext === 'pptx' || mimeType.includes('presentationml')) {
    const AdmZip = require('adm-zip')
    const zip = new AdmZip(buffer)
    const entries = zip.getEntries()
    const slideEntries = entries
      .filter((e: any) => /^ppt\/slides\/slide\d+\.xml$/.test(e.entryName))
      .sort((a: any, b: any) => {
        const numA = parseInt(a.entryName.match(/\d+/)?.[0] ?? '0')
        const numB = parseInt(b.entryName.match(/\d+/)?.[0] ?? '0')
        return numA - numB
      })
    const parts: string[] = []
    for (const entry of slideEntries) {
      const xml = entry.getData().toString('utf-8')
      const texts = [...xml.matchAll(/<a:t[^>]*>([^<]+)<\/a:t>/g)].map(m => m[1])
      if (texts.length > 0) parts.push(texts.join(' '))
    }
    return { text: parts.join('\n\n').replace(/\s{2,}/g, ' ').trim(), title: baseName }
  }
  if (['txt', 'md', 'csv', 'log', 'rtf'].includes(ext) || mimeType.startsWith('text/')) {
    return { text: buffer.toString('utf-8').replace(/\s{2,}/g, ' ').trim(), title: baseName }
  }
  if (['html', 'htm'].includes(ext) || mimeType.includes('html')) {
    const html = buffer.toString('utf-8')
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : baseName
    return { text: stripHtml(html), title }
  }
  if (['xml', 'json'].includes(ext)) {
    const text = buffer.toString('utf-8').replace(/<[^>]+>/g, ' ').replace(/[{}"[\]:,]/g, ' ').replace(/\s{2,}/g, ' ').trim()
    return { text, title: baseName }
  }
  throw new Error(`Dateityp .${ext} wird nicht unterstützt. Unterstützt: PDF, DOCX, PPTX, TXT, MD, CSV, HTML, XML, JSON`)
}

// ── Tag extraction ────────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  // German
  'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'eines', 'einer', 'einen',
  'und', 'oder', 'aber', 'auch', 'noch', 'nicht', 'mit', 'von', 'bei', 'nach', 'seit',
  'aus', 'auf', 'für', 'ist', 'sind', 'war', 'wird', 'werden', 'haben', 'hat', 'hatte',
  'ich', 'sie', 'er', 'wir', 'ihr', 'es', 'an', 'im', 'am', 'als', 'zu', 'bis', 'zum',
  'so', 'wie', 'dass', 'wenn', 'dann', 'durch', 'über', 'unter', 'vor', 'nach', 'zwischen',
  'sich', 'kann', 'können', 'wurde', 'worden', 'sein', 'alle', 'mehr', 'nur', 'sehr',
  'schon', 'hier', 'dort', 'immer', 'diesem', 'dieser', 'dieses', 'diese', 'einem',
  'ihrer', 'ihres', 'ihrem', 'ihren', 'diesem', 'diese', 'diesen', 'welche', 'welchen',
  'werden', 'wurden', 'worden', 'diese', 'etwa', 'dabei', 'damit', 'dafür', 'daran',
  'neben', 'ohne', 'sowie', 'werden', 'sonst', 'falls', 'beim', 'beim',
  // English
  'the', 'and', 'for', 'are', 'with', 'this', 'that', 'from', 'they', 'will',
  'have', 'been', 'more', 'also', 'which', 'their', 'than', 'not', 'can', 'was',
  'but', 'all', 'has', 'may', 'one', 'its', 'our', 'you', 'any', 'your', 'each',
  'when', 'were', 'what', 'into', 'these', 'those', 'such', 'some', 'other', 'about',
])

function extractTags(text: string, maxTags = 7): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-zäöüßa-z0-9\-]/gi, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 4 && !STOP_WORDS.has(w) && !/^\d+$/.test(w))

  const freq = new Map<string, number>()
  for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1)

  return [...freq.entries()]
    .filter(([, count]) => count >= 2)  // only words that appear ≥ 2 times
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxTags)
    .map(([w]) => w)
}

// ── GET: Unified knowledge library ───────────────────────────────────────────

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('is_platform_admin').eq('id', user.id).single()
  if (!profile?.is_platform_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()

  // Step 1: All rows (metadata only)
  const { data: allRows } = await admin
    .from('inometa_knowledge')
    .select('source_url, title, language, created_at, source_type, crawler_id')
    .order('created_at', { ascending: false })

  // Step 2: First chunks for tag extraction (chunk_index = 0)
  const { data: firstChunks } = await admin
    .from('inometa_knowledge')
    .select('source_url, content')
    .eq('chunk_index', 0)
    .limit(5000)

  // Step 3: Crawler names
  const { data: crawlers } = await admin
    .from('inoai_crawlers')
    .select('id, name')

  const crawlerNames = new Map((crawlers ?? []).map((c: any) => [c.id, c.name]))
  const contentMap = new Map((firstChunks ?? []).map((r: any) => [r.source_url, r.content as string]))

  // Step 4: Aggregate by source_url
  const docMap = new Map<string, {
    title: string; source_url: string; language: string; created_at: string
    source_type: string; crawler_id: string | null; chunks: number
  }>()

  for (const row of allRows ?? []) {
    if (!docMap.has(row.source_url)) {
      docMap.set(row.source_url, {
        title: row.title,
        source_url: row.source_url,
        language: row.language,
        created_at: row.created_at,
        source_type: row.source_type,
        crawler_id: row.crawler_id,
        chunks: 0,
      })
    }
    docMap.get(row.source_url)!.chunks++
  }

  // Step 5: Build final list with tags
  const docs = Array.from(docMap.values()).map(doc => ({
    ...doc,
    crawler_name: doc.crawler_id ? (crawlerNames.get(doc.crawler_id) ?? null) : null,
    tags: extractTags(contentMap.get(doc.source_url) ?? ''),
  }))

  return NextResponse.json({ docs })
}

// ── POST: Upload one or more files ────────────────────────────────────────────

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('is_platform_admin').eq('id', user.id).single()
  if (!profile?.is_platform_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const formData = await req.formData()

  const files = formData.getAll('file') as File[]
  const rawText = formData.get('text') as string | null
  const lang = (formData.get('lang') as string | null) ?? 'de'
  const overwrite = formData.get('overwrite') === 'true'

  // Load existing fingerprints for dedup
  const { data: existingChunks } = await admin
    .from('inometa_knowledge')
    .select('content')
  const existingSet = new Set<string>(
    (existingChunks ?? []).map((r: any) => r.content.slice(0, 80).toLowerCase().trim())
  )

  const results: { title: string; sourceUrl: string; inserted: number; skipped: number; error?: string; existed?: boolean }[] = []

  // ── Process files ──
  for (const file of files) {
    let title = (formData.get(`title_${file.name}`) as string | null) ?? file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
    const sourceUrl = `manual://${encodeURIComponent(file.name)}`

    try {
      const buffer = Buffer.from(await file.arrayBuffer())
      const extracted = await extractText(buffer, file.name, file.type)
      const textContent = extracted.text
      if (!title) title = extracted.title

      if (textContent.split(/\s+/).length < 10) {
        results.push({ title, sourceUrl, inserted: 0, skipped: 0, error: 'Text zu kurz (min. 10 Wörter)' })
        continue
      }

      // Check if exists
      const { data: existing } = await admin
        .from('inometa_knowledge')
        .select('id')
        .eq('source_url', sourceUrl)
        .limit(1)

      if (existing?.length && !overwrite) {
        results.push({ title, sourceUrl, inserted: 0, skipped: 0, existed: true })
        continue
      }
      if (existing?.length && overwrite) {
        await admin.from('inometa_knowledge').delete().eq('source_url', sourceUrl)
      }

      const chunks = chunkText(textContent)
      const rows: any[] = []
      let skipped = 0
      for (let i = 0; i < chunks.length; i++) {
        const content = chunks[i]
        const fingerprint = content.slice(0, 80).toLowerCase().trim()
        if (existingSet.has(fingerprint)) { skipped++; continue }
        rows.push({
          title: chunks.length > 1 ? `${title} (${i + 1}/${chunks.length})` : title,
          content,
          source_url: sourceUrl,
          source_type: 'manual',
          language: lang,
          crawler_id: 'manual',
          chunk_index: i,
        })
        existingSet.add(fingerprint)
      }

      if (rows.length === 0) {
        results.push({ title, sourceUrl, inserted: 0, skipped, error: 'Alle Inhalte bereits vorhanden' })
        continue
      }

      const { error } = await admin.from('inometa_knowledge').insert(rows)
      if (error) {
        results.push({ title, sourceUrl, inserted: 0, skipped, error: error.message })
      } else {
        results.push({ title, sourceUrl, inserted: rows.length, skipped })
      }
    } catch (e: any) {
      results.push({ title, sourceUrl, inserted: 0, skipped: 0, error: e.message })
    }
  }

  // ── Process raw text ──
  if (rawText?.trim()) {
    const textContent = rawText.trim()
    const title = (formData.get('title') as string | null) || textContent.split(/\s+/).slice(0, 6).join(' ') + '…'
    const sourceUrl = `manual://text/${Date.now()}`

    if (textContent.split(/\s+/).length >= 10) {
      const chunks = chunkText(textContent)
      const rows: any[] = []
      let skipped = 0
      for (let i = 0; i < chunks.length; i++) {
        const content = chunks[i]
        const fingerprint = content.slice(0, 80).toLowerCase().trim()
        if (existingSet.has(fingerprint)) { skipped++; continue }
        rows.push({
          title: chunks.length > 1 ? `${title} (${i + 1}/${chunks.length})` : title,
          content,
          source_url: sourceUrl,
          source_type: 'manual',
          language: lang,
          crawler_id: 'manual',
          chunk_index: i,
        })
        existingSet.add(fingerprint)
      }
      if (rows.length > 0) {
        const { error } = await admin.from('inometa_knowledge').insert(rows)
        results.push({ title, sourceUrl, inserted: error ? 0 : rows.length, skipped, error: error?.message })
      } else {
        results.push({ title, sourceUrl, inserted: 0, skipped, error: 'Alle Inhalte bereits vorhanden' })
      }
    }
  }

  return NextResponse.json({ results })
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('is_platform_admin').eq('id', user.id).single()
  if (!profile?.is_platform_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { sourceUrl } = await req.json()
  if (!sourceUrl) return NextResponse.json({ error: 'sourceUrl fehlt' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from('inometa_knowledge').delete().eq('source_url', sourceUrl)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
