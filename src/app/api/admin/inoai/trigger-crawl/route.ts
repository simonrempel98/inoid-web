// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { runCrawlJob } from '@/lib/inoai/crawler'
import { waitUntil } from '@vercel/functions'
import { NextResponse } from 'next/server'

export const maxDuration = 60

async function guard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: p } = await supabase.from('profiles').select('is_platform_admin').eq('id', user.id).single()
  return !!p?.is_platform_admin
}

// Browser-seitiger Backup-Trigger: holt nächsten pausierten/wartenden Job und startet ihn
export async function POST() {
  if (!await guard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const { data: job } = await admin
    .from('inoai_crawl_jobs')
    .select('id, status')
    .in('status', ['queued', 'paused'])
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (!job) return NextResponse.json({ ok: true, msg: 'Kein Job wartend' })

  waitUntil(runCrawlJob(job.id))
  return NextResponse.json({ ok: true, jobId: job.id })
}
