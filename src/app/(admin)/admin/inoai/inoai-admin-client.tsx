'use client'

import { useEffect, useRef, useState } from 'react'

type CrawlerRow = { id: string; name: string; url: string; lang: string; created_at: string }
type CrawlerStats = { chunks: number; pages: number; lastUpdated: string | null }
type StatsMap = Record<string, CrawlerStats>
type JobStatus = 'queued' | 'running' | 'paused' | 'done' | 'error'
type JobRow = {
  id: string
  crawler_id: string
  status: JobStatus
  log: string[]
  stats: { pagesFound: number; chunksInserted: number; errors: number } | null
  diff: { added: string[]; removed: string[]; failedPages: string[] } | null
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
  if (line.startsWith('❌')) return '#f87171'
  if (line.startsWith('✅') || line.startsWith('✓') || line.startsWith('↔')) return '#4ade80'
  if (line.startsWith('⚠️')) return '#fb923c'
  if (line.startsWith('📈')) return '#4ade80'
  if (line.startsWith('📉')) return '#fb923c'
  if (line.startsWith('🚀') || line.startsWith('🕷️') || line.startsWith('⏳') || line.startsWith('▶')) return '#60a5fa'
  if (line.startsWith('  📄')) return '#94a3b8'
  return '#cbd5e1'
}

// ── Crawl-Footer (Diff + Failed) ─────────────────────────────────────────────

function CrawlFooter({ diff }: { diff: NonNullable<JobRow['diff']> }) {
  const [openKey, setOpenKey] = useState<'added' | 'removed' | 'failed' | null>(null)
  const added = diff.added ?? []
  const removed = diff.removed ?? []
  const failed = diff.failedPages ?? []
  if (added.length === 0 && removed.length === 0 && failed.length === 0) return null

  const toggle = (key: typeof openKey) => setOpenKey(o => o === key ? null : key)

  const chips: { key: typeof openKey; label: string; count: number; bg: string; color: string; border: string; urls: string[]; linkable?: boolean }[] = [
    added.length > 0   ? { key: 'added',   label: 'neu',         count: added.length,   bg: '#f0fdf4', color: '#166534', border: '#bbf7d0', urls: added }   : null,
    removed.length > 0 ? { key: 'removed', label: 'entfernt',    count: removed.length, bg: '#fff7ed', color: '#9a3412', border: '#fed7aa', urls: removed } : null,
    failed.length > 0  ? { key: 'failed',  label: 'nicht erreichbar', count: failed.length, bg: '#fef2f2', color: '#991b1b', border: '#fecaca', urls: failed, linkable: true } : null,
  ].filter(Boolean) as any[]

  return (
    <div style={{ borderTop: '1px solid var(--adm-border)', background: 'var(--adm-bg2)', borderRadius: '0 0 12px 12px' }}>
      {/* Chip-Leiste */}
      <div style={{ padding: '8px 16px', display: 'flex', gap: 8, flexWrap: 'wrap' as const, alignItems: 'center' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--adm-text3)', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Crawl-Ergebnis</span>
        {chips.map(chip => (
          <button key={chip.key} onClick={() => toggle(chip.key)} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '3px 10px 3px 8px', border: `1px solid ${openKey === chip.key ? chip.color : chip.border}`,
            borderRadius: 20, background: openKey === chip.key ? chip.bg : 'transparent',
            cursor: 'pointer', fontSize: 11, fontWeight: 700, color: chip.color,
            transition: 'all 0.15s',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: chip.color, flexShrink: 0 }} />
            {chip.count} {chip.label}
            <span style={{ fontSize: 9, opacity: 0.7 }}>{openKey === chip.key ? '▲' : '▼'}</span>
          </button>
        ))}
      </div>

      {/* Aufgeklappte URL-Liste */}
      {openKey && (() => {
        const chip = chips.find(c => c.key === openKey)!
        return (
          <div style={{
            margin: '0 16px 10px', padding: '8px 12px',
            background: chip.bg, border: `1px solid ${chip.border}`,
            borderRadius: 8, maxHeight: 160, overflowY: 'auto' as const,
            display: 'flex', flexDirection: 'column' as const, gap: 2,
          }}>
            {chip.urls.map((u: string, i: number) => (
              chip.linkable
                ? <a key={i} href={u} target="_blank" rel="noopener noreferrer" style={{
                    fontSize: 10, color: chip.color, fontFamily: 'monospace',
                    whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis',
                    maxWidth: '100%', display: 'block', textDecoration: 'none',
                  }}>{u}</a>
                : <span key={i} style={{
                    fontSize: 10, color: chip.color, fontFamily: 'monospace',
                    whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis',
                    maxWidth: '100%', display: 'block',
                  }}>{u}</span>
            ))}
          </div>
        )
      })()}
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
  onJobChange,
}: {
  crawler: CrawlerRow
  stats: CrawlerStats | undefined
  initialJob: JobRow | undefined
  onStatsRefresh: () => void
  onDelete: (id: string) => void
  onUpdate: (c: CrawlerRow) => void
  onJobChange?: (j: JobRow) => void
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
      onJobChange?.(updated)
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
    setLogOpen(false)
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
        <div style={{ borderTop: '1px solid var(--adm-border)' }}>
          {/* Log-Header */}
          <div onClick={() => setLogOpen(o => !o)} style={{
            padding: '8px 16px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            cursor: 'pointer', userSelect: 'none' as const,
            background: 'var(--adm-bg2)',
            borderBottom: logOpen ? '1px solid var(--adm-border)' : 'none',
            borderRadius: !logOpen && !(job?.diff) ? '0 0 12px 12px' : 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transition: 'transform 0.15s', transform: logOpen ? 'rotate(90deg)' : 'rotate(0deg)', flexShrink: 0 }}>
                <path d="M4 2l4 4-4 4" stroke="var(--adm-text3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--adm-text2)' }}>Log</span>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 10,
                background: 'var(--adm-border)', color: 'var(--adm-text3)',
              }}>{(job.log ?? []).length} Zeilen</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {job.finished_at && (
                <span style={{ fontSize: 10, color: 'var(--adm-text3)' }}>
                  {new Date(job.finished_at).toLocaleString('de-DE')}
                </span>
              )}
              <StatusPill status={job.status} />
            </div>
          </div>
          {/* Log-Inhalt – Terminal-Stil bewusst beibehalten */}
          {logOpen && (
            <div style={{
              background: '#0d1117',
              borderRadius: !(job?.diff) ? '0 0 12px 12px' : 0,
              padding: '10px 16px', maxHeight: 280, overflowY: 'auto' as const,
              fontFamily: 'monospace', fontSize: 11, lineHeight: 1.75,
            }}>
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

      {/* Crawl-Footer: Diff + Failed als Chips */}
      {job?.diff && <CrawlFooter diff={job.diff} />}
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

// ── Accordion-Sektion ────────────────────────────────────────────────────────

function AccordionSection({
  icon, title, meta, accent = '#003366', open, onToggle, children,
}: {
  icon: string
  title: string
  meta?: React.ReactNode
  accent?: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div style={{
      borderRadius: 14, overflow: 'hidden', marginBottom: 10,
      border: '1px solid var(--adm-border)',
      borderLeft: `3px solid ${accent}`,
    }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '14px 18px',
          background: 'var(--adm-surface)', border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 17, lineHeight: 1 }}>{icon}</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--adm-text)' }}>{title}</span>
          {meta}
        </div>
        <span style={{
          fontSize: 10, color: 'var(--adm-text3)', flexShrink: 0, marginLeft: 12,
          transition: 'transform 0.2s', transform: open ? 'rotate(90deg)' : 'none', display: 'inline-block',
        }}>▶</span>
      </button>
      {open && (
        <div style={{ padding: '22px 20px', borderTop: '1px solid var(--adm-border)', background: 'var(--adm-bg)' }}>
          {children}
        </div>
      )}
    </div>
  )
}

function Chip({ label, color = '#1e3a5f', text = '#93c5fd' }: { label: string; color?: string; text?: string }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 20, background: color, color: text }}>
      {label}
    </span>
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
  const [jobs, setJobs] = useState<Record<string, JobRow>>(initialJobs)
  const [open, setOpen] = useState({ crawlers: false, synonyms: false, docs: false })

  function toggle(k: keyof typeof open) { setOpen(p => ({ ...p, [k]: !p[k] })) }

  async function refreshStats() {
    const res = await fetch('/api/admin/inoai/stats')
    if (!res.ok) return
    const data = await res.json()
    setStats(data.perCrawler)
    setTotalCount(data.total)
  }

  useEffect(() => {
    const hasActive = Object.values(jobs).some(j => ['queued', 'running', 'paused'].includes(j.status))
    if (!hasActive) return
    const id = setInterval(refreshStats, 10_000)
    return () => clearInterval(id)
  }, [JSON.stringify(Object.values(jobs).map(j => j.status))])

  function handleDelete(id: string) {
    setCrawlers(c => c.filter(x => x.id !== id))
    setStats(s => { const n = { ...s }; delete n[id]; return n })
    refreshStats()
  }

  function handleUpdate(updated: CrawlerRow) {
    setCrawlers(c => c.map(x => x.id === updated.id ? updated : x))
  }

  const hasActive = Object.values(jobs).some(j => ['queued', 'running', 'paused'].includes(j.status))
  const totalDocs = 0
  const totalPages = Object.values(stats).reduce((a, b) => a + (b.pages ?? 0), 0)
  const activeCount = Object.values(jobs).filter(j => ['queued', 'running', 'paused'].includes(j.status)).length

  return (
    <div style={{ maxWidth: 880, fontFamily: 'var(--adm-font, Arial, sans-serif)' }}>

      {/* ── Hero-Karte ── */}
      <div style={{
        marginBottom: 20, padding: '20px 24px', borderRadius: 16,
        background: 'var(--adm-surface)', border: '1px solid var(--adm-border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, color: 'var(--adm-text)', letterSpacing: -0.5 }}>INOai</h1>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--adm-text3)' }}>Wissensbasis · KI-Suche · Synonyme · Dokumente</p>
          </div>
          {hasActive && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 14px', borderRadius: 20, background: '#0a1f0a', border: '1px solid #1a4a20' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#3fb950', display: 'inline-block', animation: 'pulse 1.5s ease-in-out infinite' }} />
              <span style={{ fontSize: 11, color: '#56d364', fontWeight: 700 }}>{activeCount} Crawler aktiv</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {[
            { icon: '🧩', value: totalCount, label: 'Chunks' },
            { icon: '🕷️', value: crawlers.length, label: 'Quellen' },
            { icon: '🌐', value: totalPages, label: 'Seiten' },
            { icon: '📄', value: totalDocs, label: 'PDFs' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10, background: 'var(--adm-card)',
                border: '1px solid var(--adm-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
              }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 19, fontWeight: 900, color: 'var(--adm-text)', lineHeight: 1.1 }}>{s.value.toLocaleString('de')}</div>
                <div style={{ fontSize: 10, color: 'var(--adm-text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Crawler ── */}
      <AccordionSection
        icon="🕷️" title="Crawler" accent="#0066cc" open={open.crawlers} onToggle={() => toggle('crawlers')}
        meta={<>
          <Chip label={`${crawlers.length} Quellen`} />
          {hasActive && <Chip label="● Aktiv" color="#0a1f0a" text="#56d364" />}
        </>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {crawlers.map(c => (
            <CrawlerCard
              key={c.id}
              crawler={c}
              stats={stats[c.id]}
              initialJob={initialJobs[c.id] as JobRow | undefined}
              onStatsRefresh={refreshStats}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
              onJobChange={j => setJobs(prev => ({ ...prev, [c.id]: j }))}
            />
          ))}
          <AddCrawlerForm onAdded={c => setCrawlers(prev => [...prev, c])} />
        </div>
      </AccordionSection>

      {/* ── Synonyme & Matrix ── */}
      <AccordionSection
        icon="🔤" title="Synonyme & Matrix" accent="#6366f1" open={open.synonyms} onToggle={() => toggle('synonyms')}
        meta={<Chip label="KI-Wissensgraph" color="#1e1b4b" text="#a5b4fc" />}
      >
        <SynonymManager />
      </AccordionSection>

      {/* ── Wissensdokumente ── */}
      <AccordionSection
        icon="📚" title="Wissensdokumente" accent="#059669" open={open.docs} onToggle={() => toggle('docs')}
        meta={<Chip label="PDF · DOCX · PPTX · TXT · …" color="#052e16" text="#6ee7b7" />}
      >
        <KnowledgeLibrary crawlers={crawlers} />
      </AccordionSection>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.35; } }
      `}</style>
    </div>
  )
}

// ── Synonym-Manager ──────────────────────────────────────────────────────────

type SynonymRow = { id: number; terms: string[]; group_type: 'standalone' | 'base' | 'modifier' }
type CombinationRow = { id: string; base_id: number; modifier_id: number; extra_terms: string[]; active: boolean }

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

// ── Multilingual-Sync-Button ─────────────────────────────────────────────────

function MultilingualSyncButton({ onDone }: { onDone: () => void }) {
  const [syncing, setSyncing] = useState(false)

  async function sync() {
    setSyncing(true)
    const res = await fetch('/api/admin/inoai/synonyms/translate', { method: 'POST' })
    setSyncing(false)
    if (res.ok) onDone()
  }

  return (
    <div style={{ flexShrink: 0, textAlign: 'right' }}>
      <button onClick={sync} disabled={syncing} title="KI ergänzt alle Gruppen mit Übersetzungen in allen Sprachen" style={{
        background: syncing ? '#bfdbfe' : '#1e40af',
        color: 'white', border: 'none', borderRadius: 9,
        padding: '7px 13px', fontSize: 11, fontWeight: 700,
        cursor: syncing ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
      }}>
        <span style={{ animation: syncing ? 'spin 1s linear infinite' : 'none', display: 'inline-block' }}>🌍</span>
        {syncing ? 'KI übersetzt…' : 'Sprachen sync'}
      </button>
    </div>
  )
}

// ── Matrix-Sync-Button ───────────────────────────────────────────────────────

function SyncMatrixButton({ onSync }: { onSync: (newCombos: CombinationRow[]) => void }) {
  const [syncing, setSyncing] = useState(false)
  const [log, setLog] = useState<string[]>([])
  const [done, setDone] = useState(false)

  async function sync() {
    setSyncing(true); setLog([]); setDone(false)
    const res = await fetch('/api/admin/inoai/combinations/sync', { method: 'POST' })
    const data = await res.json()
    setLog(data.log ?? [])
    setDone(true)
    setSyncing(false)
    // Nach Sync Kombinationen neu laden
    const combosRes = await fetch('/api/admin/inoai/combinations')
    if (combosRes.ok) onSync(await combosRes.json())
  }

  return (
    <div style={{ flexShrink: 0 }}>
      <button onClick={sync} disabled={syncing} title="KI klassifiziert Gruppen und generiert fehlende Kombinationen" style={{
        background: syncing ? '#1e3a5f' : 'linear-gradient(135deg, #003366, #0055aa)',
        color: 'white', border: 'none', borderRadius: 9,
        padding: '8px 14px', fontSize: 12, fontWeight: 700,
        cursor: syncing ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 6,
        whiteSpace: 'nowrap',
      }}>
        <span style={{
          display: 'inline-block',
          animation: syncing ? 'spin 1s linear infinite' : 'none',
        }}>⊞</span>
        {syncing ? 'KI läuft…' : 'KI-Sync'}
      </button>
      {done && log.length > 0 && (
        <div style={{
          position: 'absolute', background: '#111827', border: '1px solid #374151',
          borderRadius: 9, padding: '8px 12px', marginTop: 6, zIndex: 10,
          fontSize: 11, color: '#e5e7eb', maxWidth: 280, lineHeight: 1.6,
        }}>
          {log.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}
    </div>
  )
}

// ── Kreuzreferenz-Matrix ──────────────────────────────────────────────────────

type CellEditorState = {
  baseId: number
  modifierId: number
  basePrimary: string
  modifierPrimary: string
  comboId: string | null
  extraTerms: string[]
}

function SynonymMatrix({ groups, combinations, onCombosChange }: {
  groups: SynonymRow[]
  combinations: CombinationRow[]
  onCombosChange: (combos: CombinationRow[]) => void
}) {
  const [editor, setEditor] = useState<CellEditorState | null>(null)
  const [editInput, setEditInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    if (!fullscreen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && !editor) setFullscreen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [fullscreen, editor])

  const bases = groups.filter(g => g.group_type === 'base').sort((a, b) => a.terms[0].localeCompare(b.terms[0]))
  const modifiers = groups.filter(g => g.group_type === 'modifier').sort((a, b) => a.terms[0].localeCompare(b.terms[0]))

  const comboMap = new Map<string, CombinationRow>()
  for (const c of combinations) comboMap.set(`${c.base_id}-${c.modifier_id}`, c)

  function openCell(base: SynonymRow, mod: SynonymRow) {
    const key = `${base.id}-${mod.id}`
    const existing = comboMap.get(key)
    setEditor({
      baseId: base.id,
      modifierId: mod.id,
      basePrimary: base.terms[0],
      modifierPrimary: mod.terms[0],
      comboId: existing?.id ?? null,
      extraTerms: existing?.extra_terms ?? [],
    })
    setEditInput(existing?.extra_terms.join(', ') ?? '')
  }

  async function saveCombo() {
    if (!editor) return
    const terms = editInput.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
    setSaving(true)
    if (editor.comboId) {
      const res = await fetch(`/api/admin/inoai/combinations/${editor.comboId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extra_terms: terms, active: true }),
      })
      if (res.ok) {
        const updated = await res.json()
        onCombosChange(combinations.map(c => c.id === updated.id ? updated : c))
      }
    } else {
      const res = await fetch('/api/admin/inoai/combinations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base_id: editor.baseId, modifier_id: editor.modifierId, extra_terms: terms }),
      })
      if (res.ok) {
        const created = await res.json()
        onCombosChange([...combinations, created])
      }
    }
    setSaving(false)
    setEditor(null)
  }

  async function deleteCombo() {
    if (!editor?.comboId) { setEditor(null); return }
    setSaving(true)
    await fetch(`/api/admin/inoai/combinations/${editor.comboId}`, { method: 'DELETE' })
    onCombosChange(combinations.filter(c => c.id !== editor.comboId))
    setSaving(false)
    setEditor(null)
  }

  if (bases.length === 0 || modifiers.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '24px', color: 'var(--adm-text3)', fontSize: 13 }}>
        Migration 035 ausführen um Gruppen zu klassifizieren.
      </div>
    )
  }

  const matrixContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: fullscreen ? '100%' : 'auto' }}>
      {/* Legende + Vollbild-Toggle */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 14, height: 14, borderRadius: 3, background: 'linear-gradient(135deg,#003366,#0055aa)' }} />
          <span style={{ fontSize: 11, color: fullscreen ? '#9ca3af' : 'var(--adm-text3)' }}>Aktive Kombination</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 14, height: 14, borderRadius: 3, border: '2px dashed #374151', background: 'transparent' }} />
          <span style={{ fontSize: 11, color: fullscreen ? '#9ca3af' : 'var(--adm-text3)' }}>Keine – klicken zum Erstellen</span>
        </div>
        <span style={{ fontSize: 11, color: fullscreen ? '#9ca3af' : 'var(--adm-text3)' }}>
          {combinations.filter(c => c.active).length} aktive Kombinationen
        </span>
        <button
          onClick={() => setFullscreen(v => !v)}
          title={fullscreen ? 'Vollbild schließen (Esc)' : 'Vollbild öffnen'}
          style={{
            marginLeft: 'auto', background: 'none',
            border: `1px solid ${fullscreen ? '#374151' : 'var(--adm-border)'}`,
            borderRadius: 7, padding: '5px 10px', cursor: 'pointer',
            color: fullscreen ? '#9ca3af' : 'var(--adm-text3)', fontSize: 13,
          }}
        >{fullscreen ? '✕ Schließen' : '⛶ Vollbild'}</button>
      </div>

      {/* Matrix */}
      <div style={{ overflowX: 'auto', overflowY: fullscreen ? 'auto' : 'visible', flex: fullscreen ? 1 : 'none', borderRadius: 12, border: '1px solid #1e2d3d' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th style={{
                width: 110, minWidth: 110, padding: '10px 12px',
                background: '#0a0f1a', borderBottom: '2px solid var(--adm-border)',
                borderRight: '1px solid var(--adm-border)',
                fontSize: 10, fontWeight: 700, color: '#4b5563', textAlign: 'left', letterSpacing: '0.06em',
              }}>BASIS → MOD</th>
              {modifiers.map(m => (
                <th key={m.id} style={{
                  padding: '8px 6px', background: '#0a0f1a',
                  borderBottom: '2px solid var(--adm-border)',
                  borderRight: '1px solid #1e2330',
                  fontSize: 10, fontWeight: 700, color: '#93c5fd',
                  textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden',
                  textOverflow: 'ellipsis', maxWidth: 80, letterSpacing: '0.03em',
                  textTransform: 'uppercase',
                }}>
                  {m.terms[0].length > 10 ? m.terms[0].slice(0, 9) + '…' : m.terms[0]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bases.map((base, ri) => (
              <tr key={base.id}>
                <td style={{
                  padding: '8px 12px', background: ri % 2 === 0 ? '#0d1117' : '#0a0f1a',
                  borderRight: '1px solid var(--adm-border)',
                  borderBottom: '1px solid #1e2330',
                  fontSize: 11, fontWeight: 700, color: '#e2e8f0',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {base.terms[0].charAt(0).toUpperCase() + base.terms[0].slice(1)}
                </td>
                {modifiers.map(mod => {
                  const combo = comboMap.get(`${base.id}-${mod.id}`)
                  const active = combo?.active && (combo.extra_terms?.length ?? 0) > 0
                  return (
                    <td key={mod.id}
                      onClick={() => openCell(base, mod)}
                      title={combo ? combo.extra_terms.join(', ') : `${base.terms[0]} × ${mod.terms[0]} – klicken zum Definieren`}
                      style={{
                        padding: 4, textAlign: 'center',
                        background: ri % 2 === 0 ? '#0d1117' : '#0a0f1a',
                        borderRight: '1px solid #1e2330',
                        borderBottom: '1px solid #1e2330',
                        cursor: 'pointer', transition: 'background 0.12s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#1a2a3a')}
                      onMouseLeave={e => (e.currentTarget.style.background = ri % 2 === 0 ? '#0d1117' : '#0a0f1a')}
                    >
                      {active ? (
                        <div style={{
                          display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
                          justifyContent: 'center', width: 40, height: 32, borderRadius: 6,
                          background: 'linear-gradient(135deg, #003366 0%, #0055aa 100%)',
                          boxShadow: '0 1px 6px rgba(0,85,170,0.4)',
                        }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: 'white', lineHeight: 1 }}>{combo!.extra_terms.length}</span>
                          <span style={{ fontSize: 8, color: '#93c5fd', lineHeight: 1 }}>TERMS</span>
                        </div>
                      ) : (
                        <div style={{
                          display: 'inline-block', width: 40, height: 32, borderRadius: 6,
                          border: '1px dashed #2d3748',
                        }} />
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cell-Editor Modal */}
      {editor && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000,
        }} onClick={e => { if (e.target === e.currentTarget) setEditor(null) }}>
          <div style={{
            background: '#111827', border: '1px solid #374151', borderRadius: 16,
            padding: 24, width: 440, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                background: '#1e3a5f', color: '#93c5fd', textTransform: 'uppercase',
              }}>{editor.basePrimary}</span>
              <span style={{ color: '#6b7280', fontSize: 14 }}>×</span>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                background: '#14532d', color: '#6ee7b7', textTransform: 'uppercase',
              }}>{editor.modifierPrimary}</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: '#6b7280' }}>
                {editor.comboId ? 'Bearbeiten' : 'Neue Kombination'}
              </span>
            </div>

            <label style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Kombinierte Suchbegriffe
            </label>
            <textarea
              value={editInput}
              onChange={e => setEditInput(e.target.value)}
              placeholder={`z.B. ${editor.basePrimary}reinigung, ${editor.basePrimary} cleaning, …`}
              rows={3}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 9, fontSize: 12,
                background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb',
                fontFamily: 'monospace', resize: 'vertical', boxSizing: 'border-box' as const,
                lineHeight: 1.6,
              }}
            />
            {editInput.trim() && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                {editInput.split(',').map(t => t.trim().toLowerCase()).filter(Boolean).map((t, i) => (
                  <span key={i} style={{
                    fontSize: 11, padding: '2px 9px', borderRadius: 20,
                    background: '#1e3a5f', color: '#93c5fd',
                  }}>{t}</span>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={saveCombo} disabled={saving || !editInput.trim()} style={{
                flex: 1, background: editInput.trim() ? '#003366' : '#374151',
                color: 'white', border: 'none', borderRadius: 9,
                padding: '10px', fontSize: 13, fontWeight: 700,
                cursor: (saving || !editInput.trim()) ? 'default' : 'pointer',
              }}>{saving ? '…' : '✓ Speichern'}</button>
              {editor.comboId && (
                <button onClick={deleteCombo} disabled={saving} style={{
                  background: 'none', border: '1px solid #ef4444', borderRadius: 9,
                  padding: '10px 14px', fontSize: 12, color: '#ef4444',
                  cursor: saving ? 'default' : 'pointer',
                }}>🗑 Löschen</button>
              )}
              <button onClick={() => setEditor(null)} style={{
                background: 'none', border: '1px solid #374151', borderRadius: 9,
                padding: '10px 14px', fontSize: 13, color: '#9ca3af', cursor: 'pointer',
              }}>✕</button>
            </div>

            <p style={{ margin: '12px 0 0', fontSize: 11, color: '#6b7280', lineHeight: 1.5 }}>
              Diese Begriffe werden zur KI-Suche hinzugefügt wenn eine Anfrage sowohl
              <strong style={{ color: '#93c5fd' }}> {editor.basePrimary}</strong> als auch
              <strong style={{ color: '#6ee7b7' }}> {editor.modifierPrimary}</strong> enthält.
            </p>
          </div>
        </div>
      )}
    </div>
  )

  // Vollbild-Overlay oder normale Darstellung
  if (fullscreen) {
    return (
      <>
        {/* Backdrop + Vollbild-Container */}
        <div
          onKeyDown={e => e.key === 'Escape' && setFullscreen(false)}
          tabIndex={-1}
          style={{
            position: 'fixed', inset: 0, background: '#060a12',
            zIndex: 9998, display: 'flex', flexDirection: 'column',
            padding: 24, outline: 'none',
          }}
        >
          {/* Fullscreen-Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexShrink: 0 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#93c5fd' }}>⊞ Kreuzreferenz-Matrix</span>
            <span style={{ fontSize: 12, color: '#4b5563' }}>
              {bases.length} Basis-Gruppen × {modifiers.length} Modifikatoren
            </span>
          </div>
          {matrixContent}
        </div>
      </>
    )
  }

  return matrixContent
}

function SynonymManager() {
  const [groups, setGroups] = useState<SynonymRow[]>([])
  const [combinations, setCombinations] = useState<CombinationRow[]>([])
  const [loaded, setLoaded] = useState(false)
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'gruppen' | 'matrix'>('gruppen')
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'base' | 'modifier' | 'standalone'>('all')
  const [sortBy, setSortBy] = useState<'default' | 'alpha' | 'size'>('default')
  const [newTerms, setNewTerms] = useState('')
  const [newGroupType, setNewGroupType] = useState<'standalone' | 'base' | 'modifier'>('standalone')
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [editTerms, setEditTerms] = useState('')
  const [editGroupType, setEditGroupType] = useState<'standalone' | 'base' | 'modifier'>('standalone')
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  async function load() {
    const [synRes, comboRes] = await Promise.all([
      fetch('/api/admin/inoai/synonyms'),
      fetch('/api/admin/inoai/combinations'),
    ])
    if (synRes.ok) setGroups(await synRes.json())
    if (comboRes.ok) setCombinations(await comboRes.json())
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
      body: JSON.stringify({ terms, group_type: newGroupType }),
    })
    if (res.ok) { const row = await res.json(); setGroups(g => [row, ...g]); setNewTerms(''); setNewGroupType('standalone') }
    setSaving(false)
  }

  async function saveEdit(id: number) {
    const terms = editTerms.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
    if (terms.length < 2) return
    const res = await fetch(`/api/admin/inoai/synonyms/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ terms, group_type: editGroupType }),
    })
    if (res.ok) { setGroups(g => g.map(x => x.id === id ? { ...x, terms, group_type: editGroupType } : x)); setEditId(null) }
  }

  async function deleteGroup(id: number) {
    await fetch(`/api/admin/inoai/synonyms/${id}`, { method: 'DELETE' })
    setGroups(g => g.filter(x => x.id !== id))
    setConfirmDeleteId(null)
  }

  const totalTerms = groups.reduce((n, g) => n + g.terms.length, 0)

  const q = search.trim().toLowerCase()
  let filtered = groups
  if (q) filtered = filtered.filter(g => g.terms.some(t => t.includes(q)))
  if (filterType !== 'all') filtered = filtered.filter(g => g.group_type === filterType)
  if (sortBy === 'alpha') filtered = [...filtered].sort((a, b) => a.terms[0].localeCompare(b.terms[0]))
  if (sortBy === 'size') filtered = [...filtered].sort((a, b) => b.terms.length - a.terms.length)

  const inp: React.CSSProperties = {
    padding: '8px 12px', borderRadius: 9, fontSize: 13, boxSizing: 'border-box' as const,
    background: 'var(--adm-bg)', border: '1px solid var(--adm-border)', color: 'var(--adm-text)',
    fontFamily: 'inherit',
  }

  const groupTypeBadge = (gt: SynonymRow['group_type']) => {
    if (gt === 'base') return { label: 'Basis', bg: '#1e3a5f', color: '#93c5fd' }
    if (gt === 'modifier') return { label: 'Modifik.', bg: '#14532d', color: '#6ee7b7' }
    return { label: 'Allg.', bg: '#1f2937', color: '#9ca3af' }
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
              {groups.length} Gruppen · {totalTerms} Begriffe · {combinations.filter(c => c.active).length} Kombinationen
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
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--adm-border)', paddingBottom: 0 }}>
            {(['gruppen', 'matrix'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '8px 18px', background: 'none', border: 'none',
                borderBottom: tab === t ? '2px solid #003366' : '2px solid transparent',
                color: tab === t ? 'var(--adm-text)' : 'var(--adm-text3)',
                fontSize: 13, fontWeight: tab === t ? 700 : 500, cursor: 'pointer',
                transition: 'all 0.15s', marginBottom: -1,
              }}>
                {t === 'gruppen' ? `Synonym-Gruppen` : '⊞ Kreuzreferenz-Matrix'}
              </button>
            ))}
          </div>

          {tab === 'gruppen' && (
            <div>
              {/* Info-Banner */}
              <div style={{
                background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
                border: '1px solid #bfdbfe', borderRadius: 12, padding: '12px 16px',
                marginBottom: 20, display: 'flex', gap: 14, alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>🔤</span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 700, color: '#1e3a5f' }}>
                    Wie Synonyme die KI verbessern
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: '#374151', lineHeight: 1.6 }}>
                    Die KI sucht in allen 28 App-Sprachen gleichzeitig — DE, EN, FR, ES, IT, PT, NL, PL, TR, RU, UK, BG, RO, CS, SK, HU, HR, SR, EL, FI, SV, DA, NO, LT, LV, ET, JA, ZH.
                    Nach jedem Crawl werden alle Synonym-Gruppen automatisch mehrsprachig angereichert.
                  </p>
                </div>
                <MultilingualSyncButton onDone={load} />
              </div>

              {/* Neue Gruppe */}
              <div style={{
                background: 'var(--adm-surface)', border: '1px solid var(--adm-border)',
                borderRadius: 12, padding: '14px 16px', marginBottom: 16,
              }}>
                <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: 'var(--adm-text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Neue Gruppe
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <select value={newGroupType} onChange={e => setNewGroupType(e.target.value as SynonymRow['group_type'])} style={{
                    ...inp, width: 130, flexShrink: 0,
                  }}>
                    <option value="standalone">Allgemein</option>
                    <option value="base">Basis (Objekt)</option>
                    <option value="modifier">Modifikator</option>
                  </select>
                  <div style={{ flex: 1, minWidth: 200 }}>
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

              {/* Such- und Filterleiste */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                {/* Suche */}
                <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
                  <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--adm-text3)', pointerEvents: 'none' }}>🔍</span>
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={`${groups.length} Gruppen durchsuchen…`}
                    style={{ ...inp, width: '100%', paddingLeft: 32, boxSizing: 'border-box' }}
                  />
                  {search && (
                    <button onClick={() => setSearch('')} style={{
                      position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 12, color: 'var(--adm-text3)', padding: '0 2px',
                    }}>✕</button>
                  )}
                </div>

                {/* Typ-Filter */}
                <div style={{ display: 'flex', gap: 4 }}>
                  {([
                    { v: 'all',        label: 'Alle',       count: groups.length },
                    { v: 'base',       label: 'Basis',      count: groups.filter(g => g.group_type === 'base').length },
                    { v: 'modifier',   label: 'Modifik.',   count: groups.filter(g => g.group_type === 'modifier').length },
                    { v: 'standalone', label: 'Allgemein',  count: groups.filter(g => g.group_type === 'standalone').length },
                  ] as const).map(f => (
                    <button key={f.v} onClick={() => setFilterType(f.v)} style={{
                      padding: '6px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                      border: filterType === f.v ? 'none' : '1px solid var(--adm-border)',
                      background: filterType === f.v
                        ? (f.v === 'base' ? '#1e3a5f' : f.v === 'modifier' ? '#14532d' : f.v === 'standalone' ? '#1f2937' : '#003366')
                        : 'var(--adm-surface)',
                      color: filterType === f.v
                        ? (f.v === 'base' ? '#93c5fd' : f.v === 'modifier' ? '#6ee7b7' : f.v === 'standalone' ? '#9ca3af' : 'white')
                        : 'var(--adm-text3)',
                      cursor: 'pointer',
                    }}>
                      {f.label} <span style={{ opacity: 0.7, fontWeight: 400 }}>{f.count}</span>
                    </button>
                  ))}
                </div>

                {/* Sortierung */}
                <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)} style={{
                  ...inp, fontSize: 11, padding: '6px 10px', minWidth: 110,
                }}>
                  <option value="default">Standard</option>
                  <option value="alpha">A → Z</option>
                  <option value="size">Meiste Begriffe</option>
                </select>
              </div>

              {/* Treffer-Info */}
              {(q || filterType !== 'all') && (
                <div style={{ fontSize: 11, color: 'var(--adm-text3)', marginBottom: 10 }}>
                  {filtered.length} von {groups.length} Gruppen
                  {q && <span> · enthält „<strong style={{ color: 'var(--adm-text)' }}>{q}</strong>"</span>}
                  {filterType !== 'all' && <button onClick={() => { setFilterType('all'); setSearch('') }} style={{
                    marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 11, color: '#60a5fa', padding: 0,
                  }}>× Filter zurücksetzen</button>}
                </div>
              )}

              {/* Gruppen-Liste */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {filtered.map(g => {
                  const badge = groupTypeBadge(g.group_type)
                  return (
                    <div key={g.id} style={{
                      background: 'var(--adm-surface)', border: '1px solid var(--adm-border)',
                      borderRadius: 11, overflow: 'hidden',
                    }}>
                      {editId === g.id ? (
                        <div style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                            <select value={editGroupType} onChange={e => setEditGroupType(e.target.value as SynonymRow['group_type'])} style={{ ...inp, fontSize: 11 }}>
                              <option value="standalone">Allgemein</option>
                              <option value="base">Basis (Objekt)</option>
                              <option value="modifier">Modifikator</option>
                            </select>
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <input
                              value={editTerms} onChange={e => setEditTerms(e.target.value)}
                              style={{ ...inp, flex: 1 }}
                              onKeyDown={e => e.key === 'Enter' && saveEdit(g.id)}
                              autoFocus
                            />
                            <button onClick={() => saveEdit(g.id)} style={{
                              background: '#003366', color: 'white', border: 'none', borderRadius: 7,
                              padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                            }}>✓</button>
                            <button onClick={() => setEditId(null)} style={{
                              background: 'none', border: '1px solid var(--adm-border)', borderRadius: 7,
                              padding: '7px 10px', fontSize: 12, color: 'var(--adm-text3)', cursor: 'pointer',
                            }}>✕</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{
                            fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, flexShrink: 0,
                            background: badge.bg, color: badge.color, letterSpacing: '0.04em',
                          }}>{badge.label}</span>
                          <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                            {g.terms.map((t, i) => {
                              const isMatch = q && t.includes(q)
                              return (
                                <span key={i} style={{
                                  fontSize: 11, fontWeight: i === 0 ? 700 : 500,
                                  padding: '3px 10px', borderRadius: 20,
                                  background: isMatch
                                    ? '#92400e'
                                    : i === 0 ? '#003366' : CHIP_COLORS[(i) % CHIP_COLORS.length].bg,
                                  color: isMatch ? '#fef3c7' : i === 0 ? 'white' : CHIP_COLORS[(i) % CHIP_COLORS.length].color,
                                  outline: isMatch ? '2px solid #f59e0b' : 'none',
                                  outlineOffset: 1,
                                }}>{t}</span>
                              )
                            })}
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
                                <button onClick={() => { setEditId(g.id); setEditTerms(g.terms.join(', ')); setEditGroupType(g.group_type) }} style={{
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
                  )
                })}

                {loaded && groups.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '32px 20px', border: '2px dashed var(--adm-border)', borderRadius: 12 }}>
                    <p style={{ fontSize: 14, color: 'var(--adm-text3)', margin: '0 0 4px' }}>Noch keine Synonym-Gruppen</p>
                    <p style={{ fontSize: 12, color: 'var(--adm-text4)', margin: 0 }}>Führe Migration 032 aus oder füge manuell Gruppen hinzu.</p>
                  </div>
                )}
                {loaded && groups.length > 0 && filtered.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px', border: '1px dashed var(--adm-border)', borderRadius: 10 }}>
                    <p style={{ fontSize: 13, color: 'var(--adm-text3)', margin: '0 0 8px' }}>Keine Treffer</p>
                    <button onClick={() => { setSearch(''); setFilterType('all') }} style={{
                      background: 'none', border: '1px solid var(--adm-border)', borderRadius: 7,
                      padding: '5px 12px', fontSize: 12, color: 'var(--adm-text3)', cursor: 'pointer',
                    }}>Filter zurücksetzen</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'matrix' && (
            <div>
              <div style={{
                background: 'linear-gradient(135deg, #0a0f1a 0%, #111827 100%)',
                border: '1px solid #1e3a5f', borderRadius: 12, padding: '12px 16px',
                marginBottom: 20, display: 'flex', gap: 14, alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>⊞</span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 700, color: '#93c5fd' }}>
                    Kreuzreferenz-Matrix
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: '#9ca3af', lineHeight: 1.6 }}>
                    Jede Zelle verbindet ein <strong style={{ color: '#93c5fd' }}>Basisobjekt</strong> (Zeile) mit einem{' '}
                    <strong style={{ color: '#6ee7b7' }}>Modifikator</strong> (Spalte). Aktive Zellen erweitern die KI-Suche
                    automatisch um kombinierte Fachbegriffe wie „Aniloxreinigung". Klicke eine Zelle zum Bearbeiten.{' '}
                    Die Matrix wird nach jedem Crawl automatisch aktualisiert.
                  </p>
                </div>
                <SyncMatrixButton onSync={(newCombos) => setCombinations(prev => {
                  const map = new Map(prev.map(c => [c.id, c]))
                  newCombos.forEach((c: CombinationRow) => map.set(c.id, c))
                  return Array.from(map.values())
                })} />
              </div>
              <SynonymMatrix
                groups={groups}
                combinations={combinations}
                onCombosChange={setCombinations}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── PDF-Bibliothek ───────────────────────────────────────────────────────────

const LANG_LABELS: Record<string, string> = {
  de: 'DE', en: 'EN', fr: 'FR', es: 'ES', it: 'IT', pt: 'PT', nl: 'NL', pl: 'PL',
  tr: 'TR', ru: 'RU', uk: 'UK', bg: 'BG', ro: 'RO', cs: 'CS', sk: 'SK', hu: 'HU',
  hr: 'HR', sr: 'SR', el: 'EL', fi: 'FI', sv: 'SV', da: 'DA', no: 'NO', lt: 'LT',
  lv: 'LV', et: 'ET', ja: 'JA', zh: 'ZH',
}


// ── Wissensdokumente (unified library) ───────────────────────────────────────

type KnowledgeDoc = {
  title: string
  source_url: string
  language: string
  created_at: string
  source_type: string
  crawler_id: string | null
  crawler_name: string | null
  chunks: number
  tags: string[]
}

const ALL_LANGS = [
  { code: 'de', label: 'Deutsch' }, { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' }, { code: 'es', label: 'Español' },
  { code: 'it', label: 'Italiano' }, { code: 'pt', label: 'Português' },
  { code: 'nl', label: 'Nederlands' }, { code: 'pl', label: 'Polski' },
  { code: 'tr', label: 'Türkçe' }, { code: 'ru', label: 'Русский' },
  { code: 'uk', label: 'Українська' }, { code: 'bg', label: 'Български' },
  { code: 'ro', label: 'Română' }, { code: 'cs', label: 'Čeština' },
  { code: 'sk', label: 'Slovenčina' }, { code: 'hu', label: 'Magyar' },
  { code: 'hr', label: 'Hrvatski' }, { code: 'sr', label: 'Srpski' },
  { code: 'el', label: 'Ελληνικά' }, { code: 'fi', label: 'Suomi' },
  { code: 'sv', label: 'Svenska' }, { code: 'da', label: 'Dansk' },
  { code: 'no', label: 'Norsk' }, { code: 'lt', label: 'Lietuvių' },
  { code: 'lv', label: 'Latviešu' }, { code: 'et', label: 'Eesti' },
  { code: 'ja', label: '日本語' }, { code: 'zh', label: '中文' },
]

const ACCEPT = '.pdf,.docx,.pptx,.txt,.md,.csv,.html,.htm,.xml,.json,.log,.rtf'


function KnowledgeLibrary({ crawlers }: { crawlers: CrawlerRow[] }) {
  const [tab, setTab] = useState<'upload' | 'library'>('upload')

  // Upload state
  const [files, setFiles] = useState<File[]>([])
  const [text, setText] = useState('')
  const [textTitle, setTextTitle] = useState('')
  const [lang, setLang] = useState('de')
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadResults, setUploadResults] = useState<{ name: string; status: 'ok' | 'error' | 'duplicate'; msg: string }[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  // Library state
  const [docs, setDocs] = useState<KnowledgeDoc[]>([])
  const [docsLoading, setDocsLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterLang, setFilterLang] = useState('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title' | 'chunks'>('newest')
  const [activeTag, setActiveTag] = useState<string | null>(null)

  useEffect(() => {
    if (tab === 'library') loadDocs()
  }, [tab])

  async function loadDocs() {
    setDocsLoading(true)
    const res = await fetch('/api/admin/inoai/manual')
    if (res.ok) { const d = await res.json(); setDocs(d.docs ?? []) }
    setDocsLoading(false)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false)
    setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)])
  }
  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFiles(prev => [...prev, ...Array.from(e.target.files ?? [])])
    e.target.value = ''
  }
  function removeFile(i: number) { setFiles(prev => prev.filter((_, idx) => idx !== i)) }

  async function submit() {
    if (!files.length && !text.trim()) return
    setUploading(true)
    setUploadResults([])
    const fd = new FormData()
    for (const f of files) fd.append('file', f)
    if (text.trim()) { fd.append('text', text); fd.append('title', textTitle) }
    fd.append('lang', lang)
    try {
      const res = await fetch('/api/admin/inoai/manual', { method: 'POST', body: fd })
      const data = await res.json()
      const results = (data.results ?? []).map((r: any) => ({
        name: r.title || r.sourceUrl,
        status: r.error ? 'error' : r.existed ? 'duplicate' : 'ok',
        msg: r.error ? r.error : r.existed
          ? 'Bereits vorhanden'
          : `${r.inserted} Chunks gespeichert${r.skipped > 0 ? `, ${r.skipped} übersprungen` : ''}`,
      }))
      setUploadResults(results)
      if (results.some((r: any) => r.status === 'ok')) { setFiles([]); setText(''); setTextTitle('') }
    } catch (e: any) {
      setUploadResults([{ name: 'Fehler', status: 'error', msg: e.message }])
    }
    setUploading(false)
  }

  async function deleteDoc(sourceUrl: string) {
    if (!confirm('Dieses Dokument aus der Wissensbasis löschen?')) return
    await fetch('/api/admin/inoai/manual', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceUrl }),
    })
    setDocs(prev => prev.filter(d => d.source_url !== sourceUrl))
  }

  const q = search.trim().toLowerCase()
  const filtered = docs.filter(d => {
    if (filterType === 'manual' && d.source_type !== 'manual') return false
    if (filterType === 'crawler' && d.source_type === 'manual') return false
    if (filterLang !== 'all' && d.language !== filterLang) return false
    if (activeTag && !d.tags.includes(activeTag)) return false
    if (q && !d.title.toLowerCase().includes(q) && !d.tags.some(t => t.includes(q))) return false
    return true
  })
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    if (sortBy === 'title') return a.title.localeCompare(b.title, 'de')
    if (sortBy === 'chunks') return b.chunks - a.chunks
    return 0
  })
  const allTags = [...new Set(docs.flatMap(d => d.tags))].sort()
  const langs = [...new Set(docs.map(d => d.language))].sort()
  const manualCount = docs.filter(d => d.source_type === 'manual').length
  const crawlerCount = docs.filter(d => d.source_type !== 'manual').length

  const inp: React.CSSProperties = {
    padding: '7px 10px', borderRadius: 7, fontSize: 12, boxSizing: 'border-box' as const,
    background: 'var(--adm-bg)', border: '1px solid var(--adm-border)',
    color: 'var(--adm-text)', fontFamily: 'inherit',
  }
  const tabStyle = (t: string) => ({
    background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0', marginRight: 24,
    fontSize: 13, fontWeight: tab === t ? 700 : 500,
    borderBottom: tab === t ? '2px solid #003366' : '2px solid transparent',
    color: tab === t ? 'var(--adm-text)' : 'var(--adm-text3)',
  } as React.CSSProperties)

  return (
    <div>
      <div style={{ borderBottom: '1px solid var(--adm-border)', marginBottom: 20 }}>
        <button style={tabStyle('upload')} onClick={() => setTab('upload')}>⬆ Upload</button>
        <button style={tabStyle('library')} onClick={() => setTab('library')}>
          📚 Bibliothek {docs.length > 0 && <span style={{ fontSize: 10, opacity: 0.6 }}>({docs.length})</span>}
        </button>
      </div>

      {/* ── Upload Tab ── */}
      {tab === 'upload' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? '#003366' : 'var(--adm-border)'}`,
              borderRadius: 12, padding: '28px 20px', textAlign: 'center',
              cursor: 'pointer', background: dragging ? 'rgba(0,51,102,0.06)' : 'var(--adm-card)',
              transition: 'all 0.15s',
            }}
          >
            <input ref={fileRef} type="file" accept={ACCEPT} multiple style={{ display: 'none' }} onChange={onFileChange} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 28 }}>📂</span>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--adm-text)' }}>
                Dateien hierher ziehen oder klicken
              </p>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--adm-text3)' }}>
                PDF · DOCX · PPTX · TXT · MD · CSV · HTML · XML · JSON — auch mehrere gleichzeitig
              </p>
            </div>
          </div>

          {/* File queue */}
          {files.length > 0 && (
            <div style={{ border: '1px solid var(--adm-border)', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{
                padding: '8px 14px', background: 'var(--adm-card)',
                borderBottom: '1px solid var(--adm-border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--adm-text)' }}>
                  {files.length} Datei{files.length !== 1 ? 'en' : ''} ausgewählt
                </span>
                <button onClick={() => setFiles([])} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--adm-text3)' }}>
                  Alle entfernen
                </button>
              </div>
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {files.map((f, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '7px 14px',
                    borderTop: i > 0 ? '1px solid var(--adm-border)' : 'none',
                  }}>
                    <span style={{ fontSize: 15 }}>
                      {f.name.endsWith('.pdf') ? '📄' : f.name.match(/\.docx?$/) ? '📝' : f.name.match(/\.pptx?$/) ? '📊' : '📃'}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'var(--adm-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</p>
                      <p style={{ margin: 0, fontSize: 10, color: 'var(--adm-text3)' }}>{(f.size / 1024).toFixed(0)} KB</p>
                    </div>
                    <button onClick={() => removeFile(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--adm-text3)', fontSize: 14 }}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Text divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--adm-border)' }} />
            <span style={{ fontSize: 11, color: 'var(--adm-text3)' }}>oder Text direkt eingeben</span>
            <div style={{ flex: 1, height: 1, background: 'var(--adm-border)' }} />
          </div>

          <textarea
            value={text} onChange={e => setText(e.target.value)}
            placeholder="Text hier einfügen…"
            rows={4}
            style={{ ...inp, width: '100%', resize: 'vertical', outline: 'none', fontFamily: 'inherit' }}
          />

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {text.trim() && (
              <input
                value={textTitle} onChange={e => setTextTitle(e.target.value)}
                placeholder="Titel für Text (optional)"
                style={{ ...inp, flex: '1 1 180px' }}
              />
            )}
            <select value={lang} onChange={e => setLang(e.target.value)} style={{ ...inp, minWidth: 140 }}>
              {ALL_LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </div>

          {/* Upload results */}
          {uploadResults.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {uploadResults.map((r, i) => (
                <div key={i} style={{
                  padding: '8px 12px', borderRadius: 8, fontSize: 12, display: 'flex', gap: 8,
                  background: r.status === 'ok' ? '#0d2010' : r.status === 'duplicate' ? '#0d1a2e' : '#1a0d0d',
                  border: `1px solid ${r.status === 'ok' ? '#1a4a20' : r.status === 'duplicate' ? '#1e3a5f' : '#4a1a1a'}`,
                  color: r.status === 'ok' ? '#56d364' : r.status === 'duplicate' ? '#93c5fd' : '#f85149',
                }}>
                  <span>{r.status === 'ok' ? '✓' : r.status === 'duplicate' ? 'ℹ' : '✕'}</span>
                  <span style={{ fontWeight: 600, marginRight: 4 }}>{r.name}</span>
                  <span style={{ opacity: 0.8 }}>— {r.msg}</span>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={submit}
            disabled={uploading || (!files.length && !text.trim())}
            style={{
              padding: '10px 24px', fontSize: 13, fontWeight: 700, borderRadius: 7, cursor: 'pointer',
              background: '#003366', border: 'none', color: '#fff', alignSelf: 'flex-start',
              opacity: uploading || (!files.length && !text.trim()) ? 0.5 : 1,
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            {uploading && <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>}
            {uploading
              ? `Verarbeite${files.length > 1 ? ' ' + files.length + ' Dateien' : ''}…`
              : '⬆ In Wissensbasis speichern'}
          </button>
        </div>
      )}

      {/* ── Library Tab ── */}
      {tab === 'library' && (
        <div>
          {/* Filter row */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 180px' }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--adm-text3)', pointerEvents: 'none' }}>🔍</span>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Titel oder Hashtag suchen…"
                style={{ ...inp, width: '100%', paddingLeft: 28 }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--adm-text3)', padding: '0 2px' }}>✕</button>
              )}
            </div>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} style={inp}>
              <option value="all">Alle ({docs.length})</option>
              <option value="manual">Manuell ({manualCount})</option>
              <option value="crawler">Crawler ({crawlerCount})</option>
            </select>
            <select value={filterLang} onChange={e => setFilterLang(e.target.value)} style={inp}>
              <option value="all">Alle Sprachen</option>
              {langs.map(l => <option key={l} value={l}>{LANG_LABELS[l] ?? l.toUpperCase()}</option>)}
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)} style={inp}>
              <option value="newest">Neueste</option>
              <option value="oldest">Älteste</option>
              <option value="title">A → Z</option>
              <option value="chunks">Meiste Chunks</option>
            </select>
            <button onClick={loadDocs} disabled={docsLoading} style={{ ...inp, cursor: docsLoading ? 'default' : 'pointer', minWidth: 34, textAlign: 'center' as const }}>
              <span style={{ display: 'inline-block', animation: docsLoading ? 'spin 1s linear infinite' : 'none' }}>⟳</span>
            </button>
          </div>

          {/* Hashtag cloud */}
          {allTags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14, padding: '10px 12px', background: 'var(--adm-card)', borderRadius: 10, border: '1px solid var(--adm-border)' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--adm-text3)', alignSelf: 'center', marginRight: 4 }}>#</span>
              {allTags.map(tag => (
                <button key={tag} onClick={() => setActiveTag(activeTag === tag ? null : tag)} style={{
                  padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  border: '1px solid var(--adm-border)',
                  background: activeTag === tag ? '#003366' : 'transparent',
                  color: activeTag === tag ? 'white' : 'var(--adm-text3)',
                  transition: 'all 0.12s',
                }}>#{tag}</button>
              ))}
            </div>
          )}

          {/* Active filter info */}
          {(search || filterType !== 'all' || filterLang !== 'all' || activeTag) && (
            <div style={{ fontSize: 11, color: 'var(--adm-text3)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{sorted.length} von {docs.length} Dokumenten</span>
              <button onClick={() => { setSearch(''); setFilterType('all'); setFilterLang('all'); setActiveTag(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#60a5fa', padding: 0 }}>
                × Filter zurücksetzen
              </button>
            </div>
          )}

          {/* Doc list */}
          {docsLoading ? (
            <p style={{ color: 'var(--adm-text3)', fontSize: 13, textAlign: 'center', padding: '24px' }}>Lade…</p>
          ) : sorted.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 20px', border: '2px dashed var(--adm-border)', borderRadius: 12 }}>
              <p style={{ fontSize: 14, color: 'var(--adm-text3)', margin: '0 0 4px' }}>
                {docs.length === 0 ? 'Noch keine Dokumente in der Wissensbasis' : 'Keine Treffer'}
              </p>
              <p style={{ fontSize: 12, color: 'var(--adm-text3)', margin: 0 }}>
                {docs.length === 0 ? 'Lade Dateien hoch oder führe einen Crawler-Lauf aus.' : 'Filter anpassen'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {sorted.map(doc => {
                const isManual = doc.source_type === 'manual'
                const filename = isManual
                  ? decodeURIComponent(doc.source_url.replace('manual://', ''))
                  : doc.source_url
                const date = new Date(doc.created_at).toLocaleDateString('de', { day: '2-digit', month: '2-digit', year: '2-digit' })
                const langLabel = LANG_LABELS[doc.language] ?? doc.language?.toUpperCase()

                return (
                  <div key={doc.source_url} style={{
                    border: '1px solid var(--adm-border)', borderRadius: 10,
                    background: 'var(--adm-surface)', padding: '10px 14px',
                    display: 'flex', flexDirection: 'column', gap: 7,
                  }}>
                    {/* Top row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>
                        {isManual ? '📂' : doc.source_type === 'pdf' || doc.source_type === 'datasheet' ? '📄' : '🌐'}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--adm-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={doc.title}>
                          {doc.title}
                        </p>
                        <p style={{ margin: '1px 0 0', fontSize: 10, color: 'var(--adm-text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {isManual ? filename : doc.crawler_name ?? doc.crawler_id}
                        </p>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20, flexShrink: 0, background: isManual ? '#1c1505' : '#0a1f0a', color: isManual ? '#fcd34d' : '#6ee7b7' }}>
                        {isManual ? 'Manuell' : 'Crawler'}
                      </span>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: '#1e3a5f', color: '#93c5fd', flexShrink: 0 }}>
                        {langLabel}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--adm-text3)', flexShrink: 0, whiteSpace: 'nowrap' }}>
                        {doc.chunks} Chunks
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--adm-text3)', flexShrink: 0, minWidth: 46, textAlign: 'right' as const }}>
                        {date}
                      </span>
                      {isManual && (
                        <button onClick={() => deleteDoc(doc.source_url)} title="Löschen" style={{
                          flexShrink: 0, background: 'none', border: '1px solid #4a1a1a',
                          borderRadius: 5, padding: '3px 8px', fontSize: 11, color: '#f85149', cursor: 'pointer',
                        }}>✕</button>
                      )}
                    </div>

                    {/* Hashtag row */}
                    {doc.tags.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, paddingLeft: 26 }}>
                        {doc.tags.map(tag => (
                          <button key={tag} onClick={() => setActiveTag(activeTag === tag ? null : tag)} style={{
                            padding: '1px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600, cursor: 'pointer',
                            border: '1px solid var(--adm-border)',
                            background: activeTag === tag ? '#003366' : 'transparent',
                            color: activeTag === tag ? 'white' : 'var(--adm-text3)',
                          }}>#{tag}</button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
