'use client'

import { useState } from 'react'

type CrawlerRow = { id: string; name: string; url: string; lang: string; created_at: string }
type CrawlerStats = { chunks: number; pages: number; docs: number; lastUpdated: string | null }
type StatsMap = Record<string, CrawlerStats>

function StatBadge({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ fontSize: 11 }}>{icon}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--adm-text)' }}>
        {value.toLocaleString('de')}
      </span>
      <span style={{ fontSize: 10, color: 'var(--adm-text3)' }}>{label}</span>
    </div>
  )
}

function CrawlerCard({
  crawler,
  stats,
  onStatsRefresh,
  onDelete,
}: {
  crawler: CrawlerRow
  stats: CrawlerStats | undefined
  onStatsRefresh: () => void
  onDelete: (id: string) => void
}) {
  const [running, setRunning] = useState(false)
  const [log, setLog] = useState<string[]>([])
  const [done, setDone] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

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
      if (!res.ok || !res.body) { setLog(l => [...l, `❌ HTTP ${res.status}`]); setRunning(false); return }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      while (true) {
        const { done: sd, value } = await reader.read()
        if (sd) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n'); buf = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const p = JSON.parse(line.slice(6))
            if (p.msg !== undefined) setLog(l => [...l, p.msg])
            if (p.done) { setDone(true); onStatsRefresh() }
          } catch { /* ignore */ }
        }
      }
    } catch (e: any) {
      setLog(l => [...l, `❌ ${e.message}`])
    } finally {
      setRunning(false)
    }
  }

  async function deleteCrawler() {
    setDeleting(true)
    const res = await fetch(`/api/admin/inoai/crawlers/${crawler.id}`, { method: 'DELETE' })
    if (res.ok) onDelete(crawler.id)
    else setDeleting(false)
  }

  return (
    <div style={{
      background: 'var(--adm-surface)', border: '1px solid var(--adm-border)',
      borderRadius: 14, overflow: 'hidden', marginBottom: 12,
    }}>
      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--adm-text)' }}>{crawler.name}</span>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 8,
              background: crawler.lang === 'en' ? '#e8f4fd' : '#f0fdf4',
              color: crawler.lang === 'en' ? '#0099cc' : '#059669',
            }}>{crawler.lang.toUpperCase()}</span>
          </div>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--adm-text3)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {crawler.url}
          </p>
          {stats ? (
            <div style={{ marginTop: 5, display: 'flex', flexWrap: 'wrap', gap: '6px 14px' }}>
              <StatBadge icon="🌐" label="Unterseiten" value={stats.pages} />
              <StatBadge icon="📄" label="Dokumente" value={stats.docs} />
              <StatBadge icon="🧩" label="Chunks" value={stats.chunks} />
              {stats.lastUpdated && (
                <span style={{ fontSize: 10, color: 'var(--adm-text3)', alignSelf: 'center' }}>
                  · {new Date(stats.lastUpdated).toLocaleString('de-DE')}
                </span>
              )}
            </div>
          ) : (
            <p style={{ margin: '3px 0 0', fontSize: 11, color: '#f59e0b' }}>Noch nicht gecrawlt</p>
          )}
        </div>

        {/* Aktionen */}
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button type="button" onClick={start} disabled={running} style={{
            background: running ? 'var(--adm-border)' : '#003366', color: running ? 'var(--adm-text3)' : 'white',
            border: 'none', borderRadius: 50, padding: '7px 16px', fontSize: 12, fontWeight: 700,
            cursor: running ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {running ? (
              <><span style={{ width: 9, height: 9, borderRadius: '50%', border: '2px solid var(--adm-text3)', borderTopColor: '#0099cc', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />Läuft…</>
            ) : '▶ Crawlen'}
          </button>

          {!confirmDelete ? (
            <button type="button" onClick={() => setConfirmDelete(true)} style={{
              background: 'none', border: '1px solid var(--adm-border)', borderRadius: 50,
              padding: '7px 12px', fontSize: 12, color: '#6b7280', cursor: 'pointer',
            }}>🗑</button>
          ) : (
            <div style={{ display: 'flex', gap: 6 }}>
              <button type="button" onClick={deleteCrawler} disabled={deleting} style={{
                background: '#ef4444', color: 'white', border: 'none', borderRadius: 50,
                padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}>{deleting ? '…' : 'Löschen'}</button>
              <button type="button" onClick={() => setConfirmDelete(false)} style={{
                background: 'none', border: '1px solid var(--adm-border)', borderRadius: 50,
                padding: '7px 10px', fontSize: 12, color: 'var(--adm-text3)', cursor: 'pointer',
              }}>✕</button>
            </div>
          )}
        </div>
      </div>

      {/* Log */}
      {log.length > 0 && (
        <div style={{ background: '#0d1117', borderTop: '1px solid #30363d' }}>
          <div style={{ padding: '7px 14px', borderBottom: '1px solid #30363d', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: '#8b949e', fontFamily: 'monospace', fontWeight: 700 }}>Log</span>
            {done && <span style={{ fontSize: 11, color: '#3fb950', fontWeight: 700 }}>✓ Fertig</span>}
            {running && <span style={{ fontSize: 11, color: '#f0883e', fontWeight: 700 }}>● Läuft</span>}
          </div>
          <div style={{ padding: '10px 14px', maxHeight: 280, overflowY: 'auto', fontFamily: 'monospace', fontSize: 11, lineHeight: 1.7 }}>
            {log.map((line, i) => (
              <div key={i} style={{
                whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                color: line.startsWith('❌') ? '#f85149' : line.startsWith('✅') || line.startsWith('✓') ? '#3fb950' : line.startsWith('⚠️') ? '#f0883e' : line.startsWith('🚀') || line.startsWith('🕷️') ? '#79c0ff' : line.startsWith('💾') ? '#a5d6ff' : '#e6edf3',
              }}>{line}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function AddCrawlerForm({ onAdded }: { onAdded: (c: CrawlerRow) => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [lang, setLang] = useState('de')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(null)
    const res = await fetch('/api/admin/inoai/crawlers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, url, lang }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error ?? 'Fehler'); return }
    onAdded(data)
    setName(''); setUrl(''); setLang('de'); setOpen(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: 8,
    border: '1px solid var(--adm-border)', background: 'var(--adm-bg)',
    color: 'var(--adm-text)', fontSize: 13, fontFamily: 'Arial, sans-serif',
    boxSizing: 'border-box',
  }

  if (!open) return (
    <button type="button" onClick={() => setOpen(true)} style={{
      width: '100%', padding: '12px', border: '2px dashed var(--adm-border)', borderRadius: 14,
      background: 'transparent', color: 'var(--adm-text3)', fontSize: 13, fontWeight: 700,
      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    }}>
      + Website hinzufügen
    </button>
  )

  return (
    <form onSubmit={submit} style={{
      background: 'var(--adm-surface)', border: '1px solid var(--adm-border)',
      borderRadius: 14, padding: '18px 20px',
    }}>
      <p style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: 'var(--adm-text)' }}>
        Neue Website hinzufügen
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--adm-text3)', display: 'block', marginBottom: 4 }}>Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="z.B. INOMETA (DE)" required style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--adm-text3)', display: 'block', marginBottom: 4 }}>Sprache</label>
          <select value={lang} onChange={e => setLang(e.target.value)} style={inputStyle}>
            <option value="de">Deutsch (de)</option>
            <option value="en">Englisch (en)</option>
            <option value="fr">Französisch (fr)</option>
            <option value="es">Spanisch (es)</option>
            <option value="nl">Niederländisch (nl)</option>
            <option value="pl">Polnisch (pl)</option>
            <option value="it">Italienisch (it)</option>
          </select>
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--adm-text3)', display: 'block', marginBottom: 4 }}>Einstiegs-URL * <span style={{ fontWeight: 400 }}>(Crawler bleibt innerhalb dieses Pfades)</span></label>
        <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://www.example.com/produkte/" required type="url" style={inputStyle} />
      </div>
      {error && <p style={{ margin: '0 0 10px', fontSize: 12, color: '#f87171' }}>{error}</p>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" disabled={saving} style={{
          background: saving ? 'var(--adm-border)' : '#003366', color: 'white', border: 'none',
          borderRadius: 50, padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: saving ? 'default' : 'pointer',
        }}>{saving ? 'Speichern…' : 'Hinzufügen'}</button>
        <button type="button" onClick={() => setOpen(false)} style={{
          background: 'none', border: '1px solid var(--adm-border)', borderRadius: 50,
          padding: '8px 14px', fontSize: 13, color: 'var(--adm-text3)', cursor: 'pointer',
        }}>Abbrechen</button>
      </div>
    </form>
  )
}

export function INOaiAdminClient({
  initialCrawlers,
  initialStats,
  total,
}: {
  initialCrawlers: CrawlerRow[]
  initialStats: StatsMap
  total: number
}) {
  const [crawlers, setCrawlers] = useState<CrawlerRow[]>(initialCrawlers)
  const [stats, setStats] = useState<StatsMap>(initialStats)
  const [totalCount, setTotalCount] = useState(total)

  async function refreshStats() {
    const res = await fetch('/api/admin/inoai/stats')
    if (!res.ok) return
    const data = await res.json()
    setStats(data.perCrawler)
    setTotalCount(data.total)
  }

  function handleDelete(id: string) {
    setCrawlers(c => c.filter(x => x.id !== id))
    setStats(s => { const n = { ...s }; delete n[id]; return n })
    refreshStats()
  }

  return (
    <div style={{ maxWidth: 860, fontFamily: 'var(--adm-font, Arial, sans-serif)' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 4px', color: 'var(--adm-text)' }}>INOai · Wissensbasis</h1>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--adm-text3)' }}>
          {totalCount.toLocaleString('de')} Chunks gesamt · Jeden Crawler unabhängig starten
        </p>
      </div>

      {crawlers.map(c => (
        <CrawlerCard key={c.id} crawler={c} stats={stats[c.id]} onStatsRefresh={refreshStats} onDelete={handleDelete} />
      ))}

      <div style={{ marginTop: 16 }}>
        <AddCrawlerForm onAdded={c => setCrawlers(prev => [...prev, c])} />
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
