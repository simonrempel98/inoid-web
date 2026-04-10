'use client'

import { useState, useRef, useEffect } from 'react'

type Stats = {
  total: number
  counts: Record<string, number>
  lastUpdated: string | null
}

const SOURCE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  website:   { label: 'Website-Seiten', color: '#0099cc', bg: '#e8f4fd' },
  datasheet: { label: 'Datenblätter (PDF)', color: '#059669', bg: '#f0fdf4' },
  brochure:  { label: 'Broschüren', color: '#b45309', bg: '#fef3c7' },
}

const CRAWL_DOMAINS = ['www.inometa.de', 'printing.inometa.de']

export function INOaiAdminClient({ initialStats }: { initialStats: Stats }) {
  const [stats, setStats] = useState<Stats>(initialStats)
  const [running, setRunning] = useState(false)
  const [log, setLog] = useState<string[]>([])
  const [done, setDone] = useState(false)
  const logEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [log])

  async function startCrawl() {
    setRunning(true)
    setDone(false)
    setLog(['Verbinde mit Server…'])

    try {
      const res = await fetch('/api/admin/inoai/crawl', { method: 'POST' })
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
            if (payload.msg !== undefined) {
              setLog(l => [...l, payload.msg])
            }
            if (payload.done) {
              setDone(true)
              // Stats neu laden
              const sr = await fetch('/api/admin/inoai/stats')
              if (sr.ok) setStats(await sr.json())
            }
          } catch { /* ignore parse errors */ }
        }
      }
    } catch (e: any) {
      setLog(l => [...l, `❌ Verbindungsfehler: ${e.message}`])
    } finally {
      setRunning(false)
    }
  }

  const adm: React.CSSProperties = {
    fontFamily: 'var(--adm-font, Arial, sans-serif)',
    color: 'var(--adm-text)',
  }

  return (
    <div style={{ maxWidth: 860, ...adm }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 4px', color: 'var(--adm-text)' }}>
          INOai · Wissensbasis
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--adm-text3)' }}>
          Crawlt {CRAWL_DOMAINS.join(' und ')} inkl. aller verlinkten PDFs
        </p>
      </div>

      {/* Stats-Karten */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div style={{
          background: 'var(--adm-surface)', border: '1px solid var(--adm-border)',
          borderRadius: 12, padding: '16px 20px',
        }}>
          <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--adm-text3)' }}>
            Chunks gesamt
          </p>
          <p style={{ margin: 0, fontSize: 28, fontWeight: 900, color: '#0099cc' }}>{stats.total.toLocaleString('de')}</p>
          {stats.lastUpdated && (
            <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--adm-text3)' }}>
              Letzte Aktualisierung: {new Date(stats.lastUpdated).toLocaleString('de-DE')}
            </p>
          )}
        </div>

        {Object.entries(SOURCE_LABELS).map(([key, { label, color, bg }]) => (
          <div key={key} style={{
            background: 'var(--adm-surface)', border: '1px solid var(--adm-border)',
            borderRadius: 12, padding: '16px 20px',
          }}>
            <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--adm-text3)' }}>
              {label}
            </p>
            <p style={{ margin: 0, fontSize: 28, fontWeight: 900, color }}>
              {(stats.counts[key] ?? 0).toLocaleString('de')}
            </p>
          </div>
        ))}
      </div>

      {/* Crawl starten */}
      <div style={{
        background: 'var(--adm-surface)', border: '1px solid var(--adm-border)',
        borderRadius: 14, padding: '20px 24px', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 700, color: 'var(--adm-text)' }}>
              Wissensbasis neu aufbauen
            </p>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--adm-text3)' }}>
              Crawlt beide Domains komplett neu (bestehende Website/PDF-Einträge werden ersetzt)
            </p>
          </div>
          <button
            type="button"
            onClick={startCrawl}
            disabled={running}
            style={{
              background: running ? 'var(--adm-border)' : '#003366',
              color: running ? 'var(--adm-text3)' : 'white',
              border: 'none', borderRadius: 50,
              padding: '10px 22px', fontSize: 13, fontWeight: 700,
              cursor: running ? 'default' : 'pointer',
              flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8,
              transition: 'background 0.2s',
            }}
          >
            {running ? (
              <>
                <span style={{
                  width: 12, height: 12, borderRadius: '50%',
                  border: '2px solid var(--adm-text3)',
                  borderTopColor: '#0099cc',
                  animation: 'spin 0.8s linear infinite',
                  display: 'inline-block',
                }} />
                Läuft…
              </>
            ) : (
              <>▶ Crawl starten</>
            )}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {CRAWL_DOMAINS.map(d => (
            <span key={d} style={{
              fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
              background: '#e8f4fd', color: '#0099cc', border: '1px solid #bfdbfe',
            }}>
              🌐 {d}
            </span>
          ))}
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
            background: '#f0fdf4', color: '#059669', border: '1px solid #a7f3d0',
          }}>
            📄 PDFs automatisch
          </span>
        </div>
      </div>

      {/* Live-Log */}
      {log.length > 0 && (
        <div style={{
          background: '#0d1117', borderRadius: 12, border: '1px solid #30363d',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '10px 16px', borderBottom: '1px solid #30363d',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#8b949e', fontFamily: 'monospace' }}>
              Crawl-Log
            </span>
            {done && (
              <span style={{
                fontSize: 11, fontWeight: 700, color: '#3fb950',
                background: '#1f2937', padding: '2px 10px', borderRadius: 10,
              }}>
                ✓ Abgeschlossen
              </span>
            )}
            {running && (
              <span style={{
                fontSize: 11, fontWeight: 700, color: '#f0883e',
                background: '#1f2937', padding: '2px 10px', borderRadius: 10,
              }}>
                ● Läuft
              </span>
            )}
          </div>
          <div style={{
            padding: '14px 16px', maxHeight: 420, overflowY: 'auto',
            fontFamily: 'monospace', fontSize: 12, lineHeight: 1.7,
          }}>
            {log.map((line, i) => (
              <div key={i} style={{
                color: line.startsWith('❌') ? '#f85149'
                  : line.startsWith('✅') || line.startsWith('✓') ? '#3fb950'
                  : line.startsWith('⚠️') ? '#f0883e'
                  : line.startsWith('🚀') || line.startsWith('🕷️') ? '#79c0ff'
                  : line.startsWith('💾') ? '#a5d6ff'
                  : '#e6edf3',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}>
                {line}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
