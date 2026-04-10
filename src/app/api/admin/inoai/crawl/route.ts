// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { runCrawl } from '@/lib/inoai/crawler'

export const maxDuration = 60

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('is_platform_admin').eq('id', user.id).single()
  if (!profile?.is_platform_admin) return new Response('Forbidden', { status: 403 })

  const { crawlerId, resume } = await req.json()
  if (!crawlerId) return new Response('crawlerId fehlt', { status: 400 })

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      function log(msg: string) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ msg })}\n\n`))
      }
      try {
        if (!resume) log(`🚀 Starte Crawler "${crawlerId}"…`)
        const result = await runCrawl(crawlerId, log, resume ?? undefined)

        if (result.done) {
          const s = result.stats
          log(`\n✅ Fertig! ${s.pagesFound} Seiten · ${s.pdfsFound} PDFs · ${s.chunksInserted} Chunks · ${s.errors} Fehler`)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, stats: s })}\n\n`))
        } else {
          // Noch nicht fertig – Client soll nächste Instanz starten
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ continue: true, resume: result.resume, stats: result.stats })}\n\n`))
        }
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
