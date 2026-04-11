// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { runCrawlJob } from '@/lib/inoai/crawler'
import { NextResponse } from 'next/server'

export const maxDuration = 60

async function guard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: p } = await supabase.from('profiles').select('is_platform_admin').eq('id', user.id).single()
  return !!p?.is_platform_admin
}

// Job starten – erzeugt DB-Eintrag, Cron übernimmt Ausführung
export async function POST(req: Request) {
  if (!await guard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { crawlerId } = await req.json()
  if (!crawlerId) return NextResponse.json({ error: 'crawlerId fehlt' }, { status: 400 })

  const admin = createAdminClient()

  // Laufende/ausstehende Jobs für diesen Crawler beenden
  await admin.from('inoai_crawl_jobs')
    .update({ status: 'error', finished_at: new Date().toISOString() })
    .eq('crawler_id', crawlerId)
    .in('status', ['queued', 'running', 'paused'])

  const { data: job, error } = await admin.from('inoai_crawl_jobs').insert({
    crawler_id: crawlerId,
    status: 'queued',
    log: ['🚀 Starte…'],
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Sofort starten (fire-and-forget) – Cron übernimmt Fortsetzung nach Pausen
  runCrawlJob(job.id).catch(console.error)

  return NextResponse.json({ jobId: job.id })
}

// Job abbrechen
export async function DELETE(req: Request) {
  if (!await guard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { jobId } = await req.json()
  if (!jobId) return NextResponse.json({ error: 'jobId fehlt' }, { status: 400 })

  const admin = createAdminClient()
  await admin.from('inoai_crawl_jobs')
    .update({ status: 'error', finished_at: new Date().toISOString() })
    .eq('id', jobId)
    .in('status', ['queued', 'running', 'paused'])

  return NextResponse.json({ ok: true })
}
