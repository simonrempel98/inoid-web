// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { runCrawl } from '@/lib/inoai/crawler'

export const maxDuration = 300 // 5 Minuten (Vercel Pro/Hobby limit)

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('is_platform_admin').eq('id', user.id).single()
  if (!profile?.is_platform_admin) return new Response('Forbidden', { status: 403 })

  // Streaming response via ReadableStream
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      function log(msg: string) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ msg })}\n\n`))
      }

      try {
        log('🚀 Crawl gestartet…')
        const stats = await runCrawl(log)
        log(`\n✅ Fertig! ${stats.pagesFound} Seiten · ${stats.pdfsFound} PDFs · ${stats.chunksInserted} Chunks · ${stats.errors} Fehler`)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, stats })}\n\n`))
      } catch (e: any) {
        log(`❌ Fehler: ${e.message}`)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, error: e.message })}\n\n`))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
