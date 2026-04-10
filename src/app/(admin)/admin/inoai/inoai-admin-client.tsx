'use client'

import { useState } from 'react'

type CrawlerInfo = { id: string; name: string; url: string; lang: string }
type StatsMap = Record<string, { count: number; lastUpdated: string | null }>

const CRAWLERS: CrawlerInfo[] = [
  { id: 'inometa-de',  name: 'INOMETA (DE)',            url: 'https://www.inometa.de/',           lang: 'DE' },
  { id: 'inometa-en',  name: 'INOMETA (EN)',            url: 'https://www.inometa.de/en/',         lang: 'EN' },
  { id: 'printing-de', name: 'Printing INOMETA (DE)',   url: 'https://printing.inometa.de/',       lang: 'DE' },
  { id: 'printing-en', name: 'Printing INOMETA (EN)',   url: 'https://printing.inometa.de/en/',    lang: 'EN' },
  { id: 'apex-de',     name: 'APEX International (DE)', url: 'https://de.apexinternational.com/',  lang: 'DE' },
]

function CrawlerCard({
  crawler,
  stats,
  onStatsRefresh,
}: {
  crawler: CrawlerInfo
  stats: { count: number; lastUpdated: string | null } | undefined
  onStatsRefresh: () => void
}) {
  const [running, setRunning] = useState(false)
  const [log, setLog] = useState<string[]>([])
  const [done, setDone] = useState(false)

  async function start() {
    setRunning(true)
    setDone(false)
    setLog(['Verbinde…'])

    try {
      const res = await fetch('/api/admin/inoai/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crawlerId: crawler.id }),
      })
      if (!res.ok || !res.body) {
        setLog(l => [...l, `❌ HTTP ${res.status}`])
        setRunning(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''

      while (true) {
        const { done: streamDone, value } = await reader.read()
        if (streamDone) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const payload = JSON.parse(line.slice(6))
            if (payload.msg !== undefined) setLog(l => [...l, payload.msg])
            if (payload.done) { setDone(true); onStatsRefresh() }
          } catch { /* ignore */ }
        }
      }
    } catch (e: any) {
      setLog(l => [...l, `❌ ${e.message}`])
    } finally {
      setRunning(false)
    }
  }

  return (
    <div style={{
      background: 'var(--adm-surface)', border: '1px solid var(--adm-border)',
      borderRadius: 14, overflow: 'hidden', marginBottom: 16,
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 16,
        borderBottom: log.length > 0 ? '1px solid var(--adm-border)' : 'none',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--adm-text)' }}>{crawler.name}</span>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 10,
              background: crawler.lang === 'EN' ? '#e8f4fd' : '#f0fdf4',
              color: crawler.lang === 'EN' ? '#0099cc' : '#059669',
              border: `1px solid ${crawler.lang === 'EN' ? '#bfdbfe' : '#a7f3d0'}`,
            }}>{crawler.lang}</span>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--adm-text3)', fontFamily: 'monospace' }}>
            {crawler.url}
          </p>
          {stats && (
            <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--adm-text3)' }}>
              {stats.count.toLocaleString('de')} Chunks
              {stats.lastUpdated && ` · ${new Date(stats.lastUpdated).toLocaleString('de-DE')}`}
            </p>
          )}
          {!stats && (
            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#f59e0b' }}>Noch nicht gecrawlt</p>
          )}
        </div>

        <button
          type="button"
          onClick={start}
          disabled={running}
          style={{
            background: running ? 'var(--adm-border)' : '#003366',
            color: running ? 'var(--adm-text3)' : 'white',
            border: 'none', borderRadius: 50,
            padding: '8px 18px', fontSize: 12, fontWeight: 700,
            cursor: running ? 'default' : 'pointer',
            flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7,
            transition: 'background 0.2s',
          }}
        >
          {running ? (
            <>
              <span style={{
                width: 10, height: 10, borderRadius: '50%',
                border: '2px solid var(--adm-text3)', borderTopColor: '#0099cc',
                animation: 'spin 0.8s linear infinite', display: 'inline-block',
              }} />
              Läuft…
            </>
          ) : '▶ Starten'}
        </button>
      </div>

      {/* Live-Log */}
      {log.length > 0 && (
        <div style={{ background: '#0d1117' }}>
          <div style={{
            padding: '8px 16px', borderBottom: '1px solid #30363d',
            display: 'flex', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#8b949e', fontFamily: 'monospace' }}>Log</span>
            {done && <span style={{ fontSize: 11, color: '#3fb950', fontWeight: 700 }}>✓ Abgeschlossen</span>}
            {running && <span style={{ fontSize: 11, color: '#f0883e', fontWeight: 700 }}>● Läuft</span>}
          </div>
          <div style={{
            padding: '12px 16px', maxHeight: 320, overflowY: 'auto',
            fontFamily: 'monospace', fontSize: 11, lineHeight: 1.7,
          }}>
            {log.map((line, i) => (
              <div key={i} style={{
                color: line.startsWith('❌') ? '#f85149'
                  : line.startsWith('✅') || line.startsWith('✓') ? '#3fb950'
                  : line.startsWith('⚠️') ? '#f0883e'
                  : line.startsWith('🚀') || line.startsWith('🕷️') ? '#79c0ff'
                  : line.startsWith('💾') ? '#a5d6ff'
                  : '#e6edf3',
                whiteSpace: 'pre-wrap', wordBreak: 'break-all',
              }}>
                {line}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function INOaiAdminClient({
  initialStats,
  total,
}: {
  initialStats: StatsMap
  total: number
}) {
  const [stats, setStats] = useState<StatsMap>(initialStats)
  const [totalCount, setTotalCount] = useState(total)

  async function refreshStats() {
    const res = await fetch('/api/admin/inoai/stats')
    if (!res.ok) return
    const data = await res.json()
    setStats(data.perCrawler)
    setTotalCount(data.total)
  }

  return (
    <div style={{ maxWidth: 860, fontFamily: 'var(--adm-font, Arial, sans-serif)' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 4px', color: 'var(--adm-text)' }}>
          INOai · Wissensbasis
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--adm-text3)' }}>
          {totalCount.toLocaleString('de')} Chunks gesamt · Jeden Crawler unabhängig starten
        </p>
      </div>

      {CRAWLERS.map(c => (
        <CrawlerCard
          key={c.id}
          crawler={c}
          stats={stats[c.id]}
          onStatsRefresh={refreshStats}
        />
      ))}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
