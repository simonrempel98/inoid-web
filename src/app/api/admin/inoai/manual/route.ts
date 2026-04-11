// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

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

  // PDF
  if (ext === 'pdf' || mimeType === 'application/pdf') {
    const pdfParse = require('pdf-parse')
    const data = await pdfParse(buffer)
    return { text: data.text.replace(/\s{2,}/g, ' ').trim(), title: baseName }
  }

  // DOCX
  if (ext === 'docx' || mimeType.includes('wordprocessingml')) {
    const mammoth = require('mammoth')
    const result = await mammoth.extractRawText({ buffer })
    return { text: result.value.replace(/\s{2,}/g, ' ').trim(), title: baseName }
  }

  // Plain text variants
  if (['txt', 'md', 'csv', 'log', 'rtf'].includes(ext) || mimeType.startsWith('text/')) {
    const text = buffer.toString('utf-8').replace(/\s{2,}/g, ' ').trim()
    return { text, title: baseName }
  }

  // HTML
  if (['html', 'htm'].includes(ext) || mimeType.includes('html')) {
    const html = buffer.toString('utf-8')
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : baseName
    return { text: stripHtml(html), title }
  }

  // XML / JSON — extract raw text
  if (['xml', 'json'].includes(ext)) {
    const text = buffer.toString('utf-8').replace(/<[^>]+>/g, ' ').replace(/[{}"[\]:,]/g, ' ').replace(/\s{2,}/g, ' ').trim()
    return { text, title: baseName }
  }

  throw new Error(`Dateityp .${ext} wird nicht unterstützt. Unterstützt: PDF, DOCX, TXT, MD, CSV, HTML`)
}

// GET: list all manually uploaded documents
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('is_platform_admin').eq('id', user.id).single()
  if (!profile?.is_platform_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const { data: rows } = await admin
    .from('inometa_knowledge')
    .select('title, source_url, language, created_at')
    .eq('source_type', 'manual')
    .order('created_at', { ascending: false })

  // Deduplicate by source_url, count chunks
  const map = new Map<string, { title: string; source_url: string; language: string; created_at: string; chunks: number }>()
  for (const r of rows ?? []) {
    if (map.has(r.source_url)) {
      map.get(r.source_url)!.chunks++
    } else {
      map.set(r.source_url, { ...r, chunks: 1 })
    }
  }

  return NextResponse.json({ docs: Array.from(map.values()) })
}

// POST: upload and process a file or text
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('is_platform_admin').eq('id', user.id).single()
  if (!profile?.is_platform_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const formData = await req.formData()

  const file = formData.get('file') as File | null
  const rawText = formData.get('text') as string | null
  const lang = (formData.get('lang') as string | null) ?? 'de'
  const overwrite = formData.get('overwrite') === 'true'
  let title = (formData.get('title') as string | null) ?? ''

  let textContent = ''

  if (file) {
    const buffer = Buffer.from(await file.arrayBuffer())
    try {
      const extracted = await extractText(buffer, file.name, file.type)
      textContent = extracted.text
      if (!title) title = extracted.title
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 })
    }
  } else if (rawText?.trim()) {
    textContent = rawText.trim()
    if (!title) title = textContent.split(/\s+/).slice(0, 6).join(' ') + '…'
  } else {
    return NextResponse.json({ error: 'Keine Datei und kein Text übergeben' }, { status: 400 })
  }

  if (textContent.split(/\s+/).length < 10) {
    return NextResponse.json({ error: 'Text zu kurz (min. 10 Wörter)' }, { status: 400 })
  }

  // Build source_url
  const sourceUrl = file
    ? `manual://${encodeURIComponent(file.name)}`
    : `manual://text/${Date.now()}`

  // Check if already exists
  const { data: existing } = await admin
    .from('inometa_knowledge')
    .select('id')
    .eq('source_url', sourceUrl)
    .limit(1)

  if (existing?.length && !overwrite) {
    return NextResponse.json({ existed: true, sourceUrl, title })
  }

  // Delete existing if overwrite
  if (existing?.length && overwrite) {
    await admin.from('inometa_knowledge').delete().eq('source_url', sourceUrl)
  }

  // Load all existing content for dedup (only first 200 chars per chunk for speed)
  const { data: existingChunks } = await admin
    .from('inometa_knowledge')
    .select('content')

  const existingSet = new Set<string>(
    (existingChunks ?? []).map(r => r.content.slice(0, 80).toLowerCase().trim())
  )

  // Chunk and save
  const chunks = chunkText(textContent)
  const rows = []
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
    return NextResponse.json({ inserted: 0, skipped, duplicate: true, title })
  }

  const { error } = await admin.from('inometa_knowledge').insert(rows)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ inserted: rows.length, skipped, title, sourceUrl })
}

// DELETE: remove all chunks for a source_url
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
