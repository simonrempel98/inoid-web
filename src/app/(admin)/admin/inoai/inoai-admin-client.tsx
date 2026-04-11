'use client'

import { useEffect, useRef, useState } from 'react'

type CrawlerRow = { id: string; name: string; url: string; lang: string; created_at: string }
type CrawlerStats = { chunks: number; pages: number; docs: number; lastUpdated: string | null }
type StatsMap = Record<string, CrawlerStats>
type JobStatus = 'queued' | 'running' | 'paused' | 'done' | 'error'
type JobRow = {
  id: string
  crawler_id: string
  status: JobStatus
  log: string[]
  stats: { pagesFound: number; pdfsFound: number; chunksInserted: number; errors: number } | null
  diff: { added: string[]; removed: string[] } | null
  created_at: string
  started_at: string | null
  finished_at: string | null
}

// ── Hilfsfunktionen ──────────────────────────────────────────────────────────

function StatBadge({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ fontSize: 11 }}>{icon}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--adm-text)' }}>{value.toLocaleString('de')}</span>
      <span style={{ fontSize: 10, color: 'var(--adm-text3)' }}>{label}</span>
    </div>
  )
}

function StatusPill({ status }: { status: JobStatus }) {
  const map: Record<JobStatus, { label: string; bg: string; color: string }> = {
    queued:  { label: '⏳ Warteschlange', bg: '#fef3c7', color: '#92400e' },
    running: { label: '▶ Läuft',          bg: '#dbeafe', color: '#1e40af' },
    paused:  { label: '⏸ Pausiert',       bg: '#e0e7ff', color: '#4338ca' },
    done:    { label: '✓ Fertig',          bg: '#d1fae5', color: '#065f46' },
    error:   { label: '✕ Fehler',          bg: '#fee2e2', color: '#991b1b' },
  }
  const s = map[status]
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
      background: s.bg, color: s.color,
    }}>{s.label}</span>
  )
}

function logLineColor(line: string): string {
  if (line.startsWith('❌')) return '#f85149'
  if (line.startsWith('✅') || line.startsWith('✓') || line.startsWith('↔')) return '#3fb950'
  if (line.startsWith('⚠️')) return '#f0883e'
  if (line.startsWith('📈')) return '#56d364'
  if (line.startsWith('📉')) return '#f0883e'
  if (line.startsWith('🚀') || line.startsWith('🕷️') || line.startsWith('⏳') || line.startsWith('▶')) return '#79c0ff'
  return '#e6edf3'
}

// ── Diff-Anzeige ─────────────────────────────────────────────────────────────

function DiffSummary({ diff }: { diff: NonNullable<JobRow['diff']> }) {
  const [showAdded, setShowAdded] = useState(false)
  const [showRemoved, setShowRemoved] = useState(false)
  const added = diff.added ?? []
  const removed = diff.removed ?? []
  if (added.length === 0 && removed.length === 0) return null

  return (
    <div style={{ padding: '10px 14px', background: '#0d1117', borderTop: '1px solid #30363d' }}>
      <p style={{ margin: '0 0 6px', fontSize: 11, color: '#8b949e', fontWeight: 700 }}>Änderungen gegenüber letztem Crawl</p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {added.length > 0 && (
          <div>
            <button onClick={() => setShowAdded(v => !v)} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              fontSize: 11, color: '#56d364', fontWeight: 700,
            }}>📈 +{added.length} neu {showAdded ? '▲' : '▼'}</button>
            {showAdded && (
              <div style={{ marginTop: 4, maxHeight: 120, overflowY: 'auto' }}>
                {added.map((u, i) => (
                  <div key={i} style={{ fontSize: 10, color: '#56d364', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 400 }}>{u}</div>
                ))}
              </div>
            )}
          </div>
        )}
        {removed.length > 0 && (
          <div>
            <button onClick={() => setShowRemoved(v => !v)} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              fontSize: 11, color: '#f0883e', fontWeight: 700,
            }}>📉 -{removed.length} entfernt {showRemoved ? '▲' : '▼'}</button>
            {showRemoved && (
              <div style={{ marginTop: 4, maxHeight: 120, overflowY: 'auto' }}>
                {removed.map((u, i) => (
                  <div key={i} style={{ fontSize: 10, color: '#f0883e', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 400 }}>{u}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── CrawlerCard ──────────────────────────────────────────────────────────────

function CrawlerCard({
  crawler: initialCrawler,
  stats,
  initialJob,
  onStatsRefresh,
  onDelete,
  onUpdate,
}: {
  crawler: CrawlerRow
  stats: CrawlerStats | undefined
  initialJob: JobRow | undefined
  onStatsRefresh: () => void
  onDelete: (id: string) => void
  onUpdate: (c: CrawlerRow) => void
}) {
  const [crawler, setCrawler] = useState(initialCrawler)
  const [job, setJob] = useState<JobRow | undefined>(initialJob)
  const [logOpen, setLogOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(crawler.name)
  const [editUrl, setEditUrl] = useState(crawler.url)
  const [editLang, setEditLang] = useState(crawler.lang)
  const [saving, setSaving] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const logEndRef = useRef<HTMLDivElement>(null)
  const lastTriggerRef = useRef<number>(0)

  const isActive = job?.status === 'queued' || job?.status === 'running' || job?.status === 'paused'

  // Polling wenn Job aktiv – bei "paused" auch Cron-Endpunkt anstoßen
  useEffect(() => {
    if (!isActive || !job) return
    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/admin/inoai/jobs/${job.id}`)
      if (!res.ok) return
      const updated: JobRow = await res.json()
      setJob(updated)
      if (updated.status === 'done' || updated.status === 'error') {
        clearInterval(pollRef.current!)
        onStatsRefresh()
      } else if (updated.status === 'paused') {
        // Browser als Backup-Trigger: Admin-Endpunkt anstoßen wenn Job feststeckt
        const now = Date.now()
        if (now - lastTriggerRef.current > 30_000) {
          lastTriggerRef.current = now
          fetch('/api/admin/inoai/trigger-crawl', { method: 'POST' }).catch(() => {})
        }
      }
    }, 3000)
    return () => clearInterval(pollRef.current!)
  }, [isActive, job?.id])

  // Log ans Ende scrollen
  useEffect(() => {
    if (logOpen) logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [job?.log?.length, logOpen])

  async function startCrawl() {
    const res = await fetch('/api/admin/inoai/crawl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ crawlerId: crawler.id }),
    })
    if (!res.ok) return
    const { jobId } = await res.json()
    setJob({ id: jobId, crawler_id: crawler.id, status: 'queued', log: ['⏳ In Warteschlange…'], stats: null, diff: null, created_at: new Date().toISOString(), started_at: null, finished_at: null })
    setLogOpen(true)
  }

  async function cancelCrawl() {
    if (!job) return
    await fetch('/api/admin/inoai/crawl', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId: job.id }),
    })
    setJob(j => j ? { ...j, status: 'error' } : j)
  }

  async function saveEdit() {
    setSaving(true)
    const res = await fetch(`/api/admin/inoai/crawlers/${crawler.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName, url: editUrl, lang: editLang }),
    })
    setSaving(false)
    if (!res.ok) return
    const updated = await res.json()
    setCrawler(updated)
    onUpdate(updated)
    setEditing(false)
  }

  async function deleteCrawler() {
    setDeleting(true)
    const res = await fetch(`/api/admin/inoai/crawlers/${crawler.id}`, { method: 'DELETE' })
    if (res.ok) onDelete(crawler.id)
    else setDeleting(false)
  }

  const inputStyle: React.CSSProperties = {
    padding: '6px 10px', borderRadius: 7, fontSize: 12, boxSizing: 'border-box' as const,
    background: 'var(--adm-bg)', border: '1px solid var(--adm-border)', color: 'var(--adm-text)',
    fontFamily: 'inherit',
  }

  return (
    <div style={{
      background: 'var(--adm-surface)', border: '1px solid var(--adm-border)',
      borderRadius: 14, overflow: 'hidden', marginBottom: 12,
    }}>
      {/* Header */}
      <div style={{ padding: '14px 18px' }}>
        {editing ? (
          // Edit-Modus
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--adm-text3)', display: 'block', marginBottom: 3 }}>Name</label>
                <input value={editName} onChange={e => setEditName(e.target.value)} style={{ ...inputStyle, width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--adm-text3)', display: 'block', marginBottom: 3 }}>Sprache</label>
                <select value={editLang} onChange={e => setEditLang(e.target.value)} style={{ ...inputStyle, width: '100%' }}>
                  <option value="de">DE</option>
                  <option value="en">EN</option>
                  <option value="fr">FR</option>
                  <option value="es">ES</option>
                  <option value="nl">NL</option>
                  <option value="pl">PL</option>
                  <option value="it">IT</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--adm-text3)', display: 'block', marginBottom: 3 }}>Einstiegs-URL</label>
              <input value={editUrl} onChange={e => setEditUrl(e.target.value)} style={{ ...inputStyle, width: '100%' }} type="url" />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={saveEdit} disabled={saving} style={{
                background: '#003366', color: 'white', border: 'none', borderRadius: 50,
                padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: saving ? 'default' : 'pointer',
              }}>{saving ? '…' : '✓ Speichern'}</button>
              <button onClick={() => setEditing(false)} style={{
                background: 'none', border: '1px solid var(--adm-border)', borderRadius: 50,
                padding: '6px 12px', fontSize: 12, color: 'var(--adm-text3)', cursor: 'pointer',
              }}>Abbrechen</button>
            </div>
          </div>
        ) : (
          // Normal-Anzeige
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--adm-text)' }}>{crawler.name}</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 8,
                  background: crawler.lang === 'en' ? '#e8f4fd' : '#f0fdf4',
                  color: crawler.lang === 'en' ? '#0099cc' : '#059669',
                }}>{crawler.lang.toUpperCase()}</span>
                {job && <StatusPill status={job.status} />}
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
              {isActive ? (
                <button onClick={cancelCrawl} style={{
                  background: '#7f1d1d', color: '#fca5a5', border: 'none', borderRadius: 50,
                  padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', border: '2px solid #fca5a5', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                  Abbrechen
                </button>
              ) : (
                <button onClick={startCrawl} style={{
                  background: '#003366', color: 'white', border: 'none', borderRadius: 50,
                  padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}>▶ Crawlen</button>
              )}

              <button onClick={() => setEditing(true)} style={{
                background: 'none', border: '1px solid var(--adm-border)', borderRadius: 50,
                padding: '7px 12px', fontSize: 12, color: 'var(--adm-text3)', cursor: 'pointer',
              }}>✏️</button>

              {!confirmDelete ? (
                <button onClick={() => setConfirmDelete(true)} style={{
                  background: 'none', border: '1px solid var(--adm-border)', borderRadius: 50,
                  padding: '7px 12px', fontSize: 12, color: '#6b7280', cursor: 'pointer',
                }}>🗑</button>
              ) : (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={deleteCrawler} disabled={deleting} style={{
                    background: '#ef4444', color: 'white', border: 'none', borderRadius: 50,
                    padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  }}>{deleting ? '…' : 'Löschen'}</button>
                  <button onClick={() => setConfirmDelete(false)} style={{
                    background: 'none', border: '1px solid var(--adm-border)', borderRadius: 50,
                    padding: '7px 10px', fontSize: 12, color: 'var(--adm-text3)', cursor: 'pointer',
                  }}>✕</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Log */}
      {job && (job.log ?? []).length > 0 && (
        <div style={{ background: '#0d1117', borderTop: '1px solid #30363d' }}>
          <div
            onClick={() => setLogOpen(o => !o)}
            style={{
              padding: '7px 14px', borderBottom: logOpen ? '1px solid #30363d' : 'none',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              cursor: 'pointer', userSelect: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontSize: 10, color: '#8b949e', transition: 'transform 0.15s', display: 'inline-block',
                transform: logOpen ? 'rotate(90deg)' : 'rotate(0deg)',
              }}>▶</span>
              <span style={{ fontSize: 11, color: '#8b949e', fontFamily: 'monospace', fontWeight: 700 }}>Log</span>
              <span style={{ fontSize: 10, color: '#8b949e' }}>({(job.log ?? []).length} Zeilen)</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {job.finished_at && (
                <span style={{ fontSize: 10, color: '#8b949e' }}>
                  {new Date(job.finished_at).toLocaleString('de-DE')}
                </span>
              )}
              <StatusPill status={job.status} />
            </div>
          </div>
          {logOpen && (
            <div style={{ padding: '10px 14px', maxHeight: 300, overflowY: 'auto', fontFamily: 'monospace', fontSize: 11, lineHeight: 1.7 }}>
              {(job.log ?? []).map((line, i) => (
                <div key={i} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: logLineColor(line) }}>
                  {line}
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          )}
        </div>
      )}

      {/* Diff-Anzeige */}
      {job?.status === 'done' && job.diff && (
        <DiffSummary diff={job.diff} />
      )}
    </div>
  )
}

// ── Neuen Crawler anlegen ────────────────────────────────────────────────────

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
        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--adm-text3)', display: 'block', marginBottom: 4 }}>
          Einstiegs-URL * <span style={{ fontWeight: 400 }}>(Crawler bleibt innerhalb dieses Pfades)</span>
        </label>
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

// ── Haupt-Client ─────────────────────────────────────────────────────────────

export function INOaiAdminClient({
  initialCrawlers,
  initialStats,
  initialJobs,
  total,
}: {
  initialCrawlers: CrawlerRow[]
  initialStats: StatsMap
  initialJobs: Record<string, JobRow>
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

  function handleUpdate(updated: CrawlerRow) {
    setCrawlers(c => c.map(x => x.id === updated.id ? updated : x))
  }

  return (
    <div style={{ maxWidth: 860, fontFamily: 'var(--adm-font, Arial, sans-serif)' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 4px', color: 'var(--adm-text)' }}>INOai · Wissensbasis</h1>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--adm-text3)' }}>
          {totalCount.toLocaleString('de')} Chunks gesamt · Crawler laufen im Hintergrund – Seite kann geschlossen werden
        </p>
      </div>

      {crawlers.map(c => (
        <CrawlerCard
          key={c.id}
          crawler={c}
          stats={stats[c.id]}
          initialJob={initialJobs[c.id] as JobRow | undefined}
          onStatsRefresh={refreshStats}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
        />
      ))}

      <div style={{ marginTop: 16 }}>
        <AddCrawlerForm onAdded={c => setCrawlers(prev => [...prev, c])} />
      </div>

      <div style={{ marginTop: 40, borderTop: '1px solid var(--adm-border)', paddingTop: 32 }}>
        <SynonymManager />
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ── Synonym-Manager ──────────────────────────────────────────────────────────

type SynonymRow = { id: number; terms: string[] }

// Pastelfarben für Term-Chips (rotierend nach Index)
const CHIP_COLORS = [
  { bg: '#dbeafe', color: '#1e40af' }, // blau – Hauptbegriff
  { bg: '#d1fae5', color: '#065f46' },
  { bg: '#fce7f3', color: '#9d174d' },
  { bg: '#fef3c7', color: '#92400e' },
  { bg: '#ede9fe', color: '#4c1d95' },
  { bg: '#fee2e2', color: '#991b1b' },
  { bg: '#e0f2fe', color: '#0369a1' },
]

function TermChip({ term, index, primary }: { term: string; index: number; primary?: boolean }) {
  const c = primary ? { bg: '#003366', color: 'white' } : CHIP_COLORS[index % CHIP_COLORS.length]
  return (
    <span style={{
      fontSize: 11, fontWeight: primary ? 700 : 500,
      padding: '3px 10px', borderRadius: 20,
      background: c.bg, color: c.color,
      letterSpacing: primary ? '0.02em' : 0,
    }}>{term}</span>
  )
}

function SynonymManager() {
  const [groups, setGroups] = useState<SynonymRow[]>([])
  const [loaded, setLoaded] = useState(false)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [newTerms, setNewTerms] = useState('')
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [editTerms, setEditTerms] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  async function load() {
    const res = await fetch('/api/admin/inoai/synonyms')
    if (res.ok) setGroups(await res.json())
    setLoaded(true)
  }

  function toggle() {
    if (!loaded) load()
    setOpen(v => !v)
  }

  async function addGroup() {
    const terms = newTerms.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
    if (terms.length < 2) return
    setSaving(true)
    const res = await fetch('/api/admin/inoai/synonyms', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ terms }),
    })
    if (res.ok) { const row = await res.json(); setGroups(g => [row, ...g]); setNewTerms('') }
    setSaving(false)
  }

  async function saveEdit(id: number) {
    const terms = editTerms.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
    if (terms.length < 2) return
    const res = await fetch(`/api/admin/inoai/synonyms/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ terms }),
    })
    if (res.ok) { setGroups(g => g.map(x => x.id === id ? { ...x, terms } : x)); setEditId(null) }
  }

  async function deleteGroup(id: number) {
    await fetch(`/api/admin/inoai/synonyms/${id}`, { method: 'DELETE' })
    setGroups(g => g.filter(x => x.id !== id))
    setConfirmDeleteId(null)
  }

  const totalTerms = groups.reduce((n, g) => n + g.terms.length, 0)
  const filtered = search.trim()
    ? groups.filter(g => g.terms.some(t => t.includes(search.toLowerCase())))
    : groups

  const inp: React.CSSProperties = {
    padding: '8px 12px', borderRadius: 9, fontSize: 13, boxSizing: 'border-box' as const,
    background: 'var(--adm-bg)', border: '1px solid var(--adm-border)', color: 'var(--adm-text)',
    fontFamily: 'inherit',
  }

  return (
    <div>
      {/* Header */}
      <button onClick={toggle} style={{
        display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none',
        cursor: 'pointer', padding: 0, marginBottom: open ? 20 : 0, width: '100%', textAlign: 'left',
      }}>
        <span style={{
          fontSize: 9, color: 'var(--adm-text3)', transition: 'transform 0.2s', display: 'inline-block',
          transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
        }}>▶</span>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--adm-text)' }}>Synonym-Datenbank</span>
          {loaded && (
            <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--adm-text3)' }}>
              {groups.length} Gruppen · {totalTerms} Begriffe
            </span>
          )}
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
          background: '#dbeafe', color: '#1e40af',
        }}>KI-Suche aktiv</span>
      </button>

      {open && (
        <div>
          {/* Info-Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
            border: '1px solid #bfdbfe', borderRadius: 12, padding: '12px 16px',
            marginBottom: 20, display: 'flex', gap: 14, alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>🔤</span>
            <div>
              <p style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 700, color: '#1e3a5f' }}>
                Wie Synonyme die KI verbessern
              </p>
              <p style={{ margin: 0, fontSize: 12, color: '#374151', lineHeight: 1.6 }}>
                Fragt ein Nutzer nach „Rasterwalze", erweitert die KI die Suche automatisch auf
                alle Synonyme dieser Gruppe — z.B. auch „Anilox", „Aniloxsleeve" und „Rastersleeve".
                So werden mehr relevante Texte gefunden. Nach jedem Crawl werden neue Synonyme
                automatisch aus dem Seiteninhalt abgeleitet.
              </p>
            </div>
          </div>

          {/* Neue Gruppe hinzufügen */}
          <div style={{
            background: 'var(--adm-surface)', border: '1px solid var(--adm-border)',
            borderRadius: 12, padding: '14px 16px', marginBottom: 16,
          }}>
            <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: 'var(--adm-text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Neue Gruppe
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <input
                  value={newTerms}
                  onChange={e => setNewTerms(e.target.value)}
                  placeholder="Begriff 1, Begriff 2, Begriff 3, …  (mind. 2)"
                  style={{ ...inp, width: '100%' }}
                  onKeyDown={e => e.key === 'Enter' && addGroup()}
                />
                {newTerms.trim() && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                    {newTerms.split(',').map(t => t.trim().toLowerCase()).filter(Boolean).map((t, i) => (
                      <TermChip key={i} term={t} index={i + 1} primary={i === 0} />
                    ))}
                  </div>
                )}
              </div>
              <button onClick={addGroup} disabled={saving || newTerms.split(',').filter(t => t.trim()).length < 2} style={{
                background: '#003366', color: 'white', border: 'none', borderRadius: 9,
                padding: '0 18px', fontSize: 13, fontWeight: 700,
                cursor: saving ? 'default' : 'pointer', flexShrink: 0, minHeight: 40,
                opacity: newTerms.split(',').filter(t => t.trim()).length < 2 ? 0.5 : 1,
              }}>
                {saving ? '…' : '+ Hinzufügen'}
              </button>
            </div>
          </div>

          {/* Suche */}
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--adm-text3)' }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`${groups.length} Gruppen durchsuchen…`}
              style={{ ...inp, width: '100%', paddingLeft: 34, boxSizing: 'border-box' }}
            />
          </div>

          {/* Gruppen-Liste */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filtered.map(g => (
              <div key={g.id} style={{
                background: 'var(--adm-surface)', border: '1px solid var(--adm-border)',
                borderRadius: 11, overflow: 'hidden',
                transition: 'border-color 0.15s',
              }}>
                {editId === g.id ? (
                  <div style={{ padding: '12px 14px', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      value={editTerms} onChange={e => setEditTerms(e.target.value)}
                      style={{ ...inp, flex: 1 }}
                      onKeyDown={e => e.key === 'Enter' && saveEdit(g.id)}
                      autoFocus
                    />
                    <button onClick={() => saveEdit(g.id)} style={{
                      background: '#003366', color: 'white', border: 'none', borderRadius: 7,
                      padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    }}>✓ Speichern</button>
                    <button onClick={() => setEditId(null)} style={{
                      background: 'none', border: '1px solid var(--adm-border)', borderRadius: 7,
                      padding: '7px 10px', fontSize: 12, color: 'var(--adm-text3)', cursor: 'pointer',
                    }}>✕</button>
                  </div>
                ) : (
                  <div style={{ padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {g.terms.map((t, i) => (
                        <TermChip key={i} term={t} index={i + 1} primary={i === 0} />
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      {confirmDeleteId === g.id ? (
                        <>
                          <button onClick={() => deleteGroup(g.id)} style={{
                            background: '#ef4444', color: 'white', border: 'none', borderRadius: 7,
                            padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                          }}>Löschen</button>
                          <button onClick={() => setConfirmDeleteId(null)} style={{
                            background: 'none', border: '1px solid var(--adm-border)', borderRadius: 7,
                            padding: '5px 8px', fontSize: 11, color: 'var(--adm-text3)', cursor: 'pointer',
                          }}>✕</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditId(g.id); setEditTerms(g.terms.join(', ')) }} style={{
                            background: 'none', border: '1px solid var(--adm-border)', borderRadius: 7,
                            padding: '5px 10px', fontSize: 11, color: 'var(--adm-text3)', cursor: 'pointer',
                          }}>✏️</button>
                          <button onClick={() => setConfirmDeleteId(g.id)} style={{
                            background: 'none', border: '1px solid var(--adm-border)', borderRadius: 7,
                            padding: '5px 10px', fontSize: 11, color: '#9ca3af', cursor: 'pointer',
                          }}>🗑</button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loaded && groups.length === 0 && (
              <div style={{
                textAlign: 'center', padding: '32px 20px',
                border: '2px dashed var(--adm-border)', borderRadius: 12,
              }}>
                <p style={{ fontSize: 14, color: 'var(--adm-text3)', margin: '0 0 4px' }}>Noch keine Synonym-Gruppen</p>
                <p style={{ fontSize: 12, color: 'var(--adm-text4)', margin: 0 }}>Führe Migration 032 aus oder füge manuell Gruppen hinzu.</p>
              </div>
            )}
            {loaded && groups.length > 0 && filtered.length === 0 && (
              <p style={{ fontSize: 12, color: 'var(--adm-text3)', textAlign: 'center', padding: 16 }}>
                Keine Gruppe enthält „{search}"
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
