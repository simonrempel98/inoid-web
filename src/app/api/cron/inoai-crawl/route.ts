// @ts-nocheck
import { createAdminClient } from '@/lib/supabase/admin'
import { runCrawlJob } from '@/lib/inoai/crawler'
import { waitUntil } from '@vercel/functions'
import { NextResponse } from 'next/server'

export const maxDuration = 60

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (secret && auth !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const admin = createAdminClient()

  const { data: job } = await admin
    .from('inoai_crawl_jobs')
    .select('id, status')
    .in('status', ['queued', 'paused'])
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (!job) return NextResponse.json({ ok: true, msg: 'Keine Jobs' })

  // Sofort 200 zurückgeben – runCrawlJob läuft im Hintergrund weiter
  // So kann selfTriggerCrawl() die Antwort empfangen und die Funktion endet sauber
  waitUntil(runCrawlJob(job.id))
  return NextResponse.json({ ok: true, jobId: job.id })
}
