'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// ── Types ─────────────────────────────────────────────────────────────────────

type Source = { title: string; source_type: string; source_url: string | null; rank?: number }

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: Source[]
}

type Session = {
  id: string
  title: string
  created_at: string
  updated_at: string
}

// ── Markdown-Komponenten mit Inline-Styles ───────────────────────────────────

const mdComponents = {
  p: ({ children }: any) => (
    <p style={{ margin: '0 0 10px', lineHeight: 1.65, fontSize: 14 }}>{children}</p>
  ),
  strong: ({ children }: any) => (
    <strong style={{ fontWeight: 700, color: '#002855' }}>{children}</strong>
  ),
  em: ({ children }: any) => (
    <em style={{ fontStyle: 'italic', color: '#444' }}>{children}</em>
  ),
  h1: ({ children }: any) => (
    <h1 style={{ fontSize: 17, fontWeight: 700, color: '#003366', margin: '14px 0 8px', borderBottom: '2px solid #e8edf4', paddingBottom: 6 }}>{children}</h1>
  ),
  h2: ({ children }: any) => (
    <h2 style={{ fontSize: 15, fontWeight: 700, color: '#003366', margin: '12px 0 6px' }}>{children}</h2>
  ),
  h3: ({ children }: any) => (
    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0055aa', margin: '10px 0 5px' }}>{children}</h3>
  ),
  ul: ({ children }: any) => (
    <ul style={{ margin: '6px 0 10px', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 3 }}>{children}</ul>
  ),
  ol: ({ children }: any) => (
    <ol style={{ margin: '6px 0 10px', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 3 }}>{children}</ol>
  ),
  li: ({ children }: any) => (
    <li style={{ fontSize: 14, lineHeight: 1.55, color: '#1a2a3a' }}>{children}</li>
  ),
  code: ({ inline, children }: any) =>
    inline ? (
      <code style={{
        background: '#eef2ff', color: '#3730a3', padding: '1px 6px',
        borderRadius: 5, fontSize: 12.5, fontFamily: 'monospace',
      }}>{children}</code>
    ) : (
      <pre style={{
        background: '#0f172a', color: '#e2e8f0', borderRadius: 10,
        padding: '14px 16px', overflowX: 'auto', margin: '8px 0 12px',
        fontSize: 12.5, fontFamily: 'monospace', lineHeight: 1.6,
      }}>
        <code>{children}</code>
      </pre>
    ),
  blockquote: ({ children }: any) => (
    <blockquote style={{
      borderLeft: '3px solid #0099cc', paddingLeft: 14,
      margin: '8px 0', color: '#445', fontStyle: 'italic',
    }}>{children}</blockquote>
  ),
  table: ({ children }: any) => (
    <div style={{ overflowX: 'auto', margin: '10px 0 14px' }}>
      <table style={{
        borderCollapse: 'collapse', width: '100%',
        fontSize: 13, fontFamily: 'Arial, sans-serif',
        border: '1px solid #dde5f0', borderRadius: 8, overflow: 'hidden',
      }}>{children}</table>
    </div>
  ),
  thead: ({ children }: any) => (
    <thead style={{ background: 'linear-gradient(135deg, #003366, #0055aa)', color: 'white' }}>{children}</thead>
  ),
  tbody: ({ children }: any) => <tbody>{children}</tbody>,
  tr: ({ children }: any) => (
    <tr style={{ borderBottom: '1px solid #e8edf4' }}>{children}</tr>
  ),
  th: ({ children }: any) => (
    <th style={{ padding: '9px 14px', textAlign: 'left', fontWeight: 700, fontSize: 12, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{children}</th>
  ),
  td: ({ children }: any) => (
    <td style={{ padding: '8px 14px', color: '#1a2a3a', verticalAlign: 'top' }}>{children}</td>
  ),
  hr: () => <hr style={{ border: 'none', borderTop: '1px solid #e8edf4', margin: '12px 0' }} />,
  a: ({ href, children }: any) => (
    <a href={href} target="_blank" rel="noopener noreferrer"
      style={{ color: '#0099cc', textDecoration: 'underline', textDecorationColor: '#0099cc40' }}>
      {children}
    </a>
  ),
}

// ── SourceBadge ───────────────────────────────────────────────────────────────

function SourceBadge({ type }: { type: string }) {
  const colors: Record<string, { bg: string; color: string; label: string }> = {
    website:   { bg: '#e8f4fd', color: '#0099cc', label: 'Website' },
    datasheet: { bg: '#f0fdf4', color: '#059669', label: 'Datenblatt' },
    brochure:  { bg: '#fef3c7', color: '#b45309', label: 'Broschüre' },
    manual:    { bg: '#f3e8ff', color: '#7c3aed', label: 'Dokument' },
    pdf:       { bg: '#fef2f2', color: '#dc2626', label: 'PDF' },
  }
  const c = colors[type] ?? colors.website
  return (
    <span style={{
      display: 'inline-block', background: c.bg, color: c.color,
      fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 10,
      fontFamily: 'Arial, sans-serif',
    }}>
      {c.label}
    </span>
  )
}

// ── INOai Avatar ─────────────────────────────────────────────────────────────

function Avatar() {
  return (
    <div style={{
      width: 32, height: 32, borderRadius: 10, flexShrink: 0,
      background: 'linear-gradient(135deg, #003366, #0099cc)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      alignSelf: 'flex-end', boxShadow: '0 2px 8px rgba(0,51,102,0.25)',
    }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    </div>
  )
}

// ── Hauptkomponente ───────────────────────────────────────────────────────────

export function INOaiChat() {
  const [messages, setMessages] = useState<Message[]>([{
    id: '0',
    role: 'assistant',
    content: 'Hallo! Ich bin **INOai**, dein Assistent für Fragen zu INOMETA-Produkten – Rasterwalzen, Rakelklingen, Sleeves und Flexodruck.\n\nWie kann ich dir helfen?',
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)

  // History sidebar
  const [sessions, setSessions] = useState<Session[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loadingSessions, setLoadingSessions] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Sessions laden wenn Sidebar geöffnet
  const loadSessions = useCallback(async () => {
    setLoadingSessions(true)
    try {
      const res = await fetch('/api/inoai/sessions')
      const data = await res.json()
      setSessions(data.sessions ?? [])
    } finally {
      setLoadingSessions(false)
    }
  }, [])

  useEffect(() => {
    if (sidebarOpen) loadSessions()
  }, [sidebarOpen, loadSessions])

  // Session aus History laden
  async function loadSession(id: string) {
    const res = await fetch(`/api/inoai/sessions/${id}`)
    const data = await res.json()
    if (!data.messages) return

    setSessionId(id)
    setMessages(data.messages.map((m: any) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      sources: m.sources ?? [],
    })))
    setSidebarOpen(false)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'instant' }), 50)
  }

  // Session löschen
  async function deleteSession(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    await fetch('/api/inoai/sessions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: id }),
    })
    setSessions(prev => prev.filter(s => s.id !== id))
    if (sessionId === id) startNew()
  }

  function startNew() {
    setSessionId(null)
    setMessages([{
      id: '0',
      role: 'assistant',
      content: 'Hallo! Ich bin **INOai**, dein Assistent für Fragen zu INOMETA-Produkten – Rasterwalzen, Rakelklingen, Sleeves und Flexodruck.\n\nWie kann ich dir helfen?',
    }])
    setInput('')
    setError(null)
    setSidebarOpen(false)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setError(null)

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    const history = messages
      .filter(m => !(m.role === 'assistant' && m.id === '0'))
      .map(m => ({ role: m.role, content: m.content }))

    try {
      const res = await fetch('/api/inoai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history, session_id: sessionId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Fehler')

      if (data.session_id && !sessionId) setSessionId(data.session_id)

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        sources: data.sources?.filter((s: any) => s.rank > 0) ?? [],
      }])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Fehler beim Laden der Antwort')
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  function formatDate(iso: string) {
    const d = new Date(iso)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 60000) return 'Gerade eben'
    if (diff < 3600000) return `vor ${Math.floor(diff / 60000)} Min.`
    if (diff < 86400000) return `vor ${Math.floor(diff / 3600000)} Std.`
    if (diff < 604800000) return `vor ${Math.floor(diff / 86400000)} Tagen`
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })
  }

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0, fontFamily: 'Arial, sans-serif', position: 'relative' }}>

      {/* ── History Sidebar ──────────────────────────────────────────────── */}
      {sidebarOpen && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 50,
          display: 'flex',
        }}>
          {/* Backdrop */}
          <div
            onClick={() => setSidebarOpen(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)' }}
          />

          {/* Panel */}
          <div style={{
            position: 'relative', zIndex: 1,
            width: 320, maxWidth: '85vw',
            background: 'white', borderRight: '1px solid #e8edf4',
            display: 'flex', flexDirection: 'column',
            boxShadow: '4px 0 24px rgba(0,51,102,0.12)',
          }}>
            {/* Sidebar Header */}
            <div style={{
              padding: '16px 18px', borderBottom: '1px solid #e8edf4',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#003366' }}>Gesprächsverlauf</span>
              <button
                onClick={() => setSidebarOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 20, lineHeight: 1, padding: 2 }}
              >×</button>
            </div>

            {/* Neues Gespräch */}
            <div style={{ padding: '12px 14px', borderBottom: '1px solid #f0f4f8' }}>
              <button onClick={startNew} style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                background: '#003366', color: 'white', border: 'none',
                cursor: 'pointer', fontSize: 13, fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Neues Gespräch
              </button>
            </div>

            {/* Session-Liste */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loadingSessions ? (
                <div style={{ padding: 24, textAlign: 'center', color: '#999', fontSize: 13 }}>Lädt…</div>
              ) : sessions.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: '#999', fontSize: 13 }}>
                  Noch keine gespeicherten Gespräche
                </div>
              ) : (
                sessions.map(s => (
                  <div
                    key={s.id}
                    onClick={() => loadSession(s.id)}
                    style={{
                      padding: '11px 14px 11px 16px',
                      borderBottom: '1px solid #f4f6f9',
                      cursor: 'pointer',
                      background: s.id === sessionId ? '#f0f6ff' : 'transparent',
                      display: 'flex', alignItems: 'center', gap: 10,
                      transition: 'background 0.15s',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        margin: 0, fontSize: 13, fontWeight: s.id === sessionId ? 700 : 500,
                        color: s.id === sessionId ? '#003366' : '#1a2a3a',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {s.title}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9ca3af' }}>
                        {formatDate(s.updated_at)}
                      </p>
                    </div>
                    <button
                      onClick={e => deleteSession(s.id, e)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#ccc', fontSize: 16, lineHeight: 1, padding: '2px 4px',
                        borderRadius: 4, flexShrink: 0,
                      }}
                      title="Löschen"
                    >×</button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Chat-Bereich ──────────────────────────────────────────────────── */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', maxWidth: 800, width: '100%', margin: '0 auto' }}>

        {/* Topbar */}
        <div className="inoai-topbar" style={{
          padding: '10px 16px', borderBottom: '1px solid #e8edf4',
          display: 'flex', alignItems: 'center', gap: 10, background: 'white', flexShrink: 0,
        }}>
          {/* History Button */}
          <button
            onClick={() => setSidebarOpen(true)}
            title="Gesprächsverlauf"
            style={{
              background: '#f4f6f9', border: '1px solid #e8edf4', borderRadius: 8,
              cursor: 'pointer', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 7,
              color: '#555', fontSize: 12, fontWeight: 600,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="15" y2="18"/>
            </svg>
            <span className="inoai-topbar-label">Verlauf</span>
          </button>

          {/* Titel */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{
              fontSize: 13, fontWeight: 700, color: '#003366',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block',
            }}>
              INOai
            </span>
          </div>

          {/* New Chat */}
          <button
            onClick={startNew}
            title="Neues Gespräch"
            style={{
              background: '#003366', border: 'none', borderRadius: 8,
              cursor: 'pointer', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6,
              color: 'white', fontSize: 12, fontWeight: 700,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Neu
          </button>
        </div>

        {/* Message list */}
        <div className="inoai-msgs" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {messages.map(msg => (
            <div key={msg.id} style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              gap: 10,
            }}>
              {msg.role === 'assistant' && <Avatar />}

              <div className="inoai-bubble-wrap" style={{ maxWidth: '82%', minWidth: 0 }}>
                {/* Bubble */}
                <div style={{
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, #003366, #004e9a)'
                    : 'white',
                  color: msg.role === 'user' ? 'white' : '#1a2a3a',
                  padding: msg.role === 'user' ? '11px 16px' : '14px 18px',
                  borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                  fontSize: 14, lineHeight: 1.6,
                  border: msg.role === 'assistant' ? '1px solid #e8edf4' : 'none',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
                }}>
                  {msg.role === 'user' ? (
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.55 }}>{msg.content}</p>
                  ) : (
                    <div style={{ fontSize: 14 }}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>

                {/* Quellen */}
                {msg.sources && msg.sources.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {msg.sources.slice(0, 4).map((s, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        background: '#f4f6f9', borderRadius: 8, padding: '4px 10px',
                        border: '1px solid #e8edf4',
                      }}>
                        <SourceBadge type={s.source_type} />
                        {s.source_url ? (
                          <a href={s.source_url} target="_blank" rel="noopener noreferrer"
                            style={{ fontSize: 11, color: '#6b7280', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                            {s.title}
                          </a>
                        ) : (
                          <span style={{ fontSize: 11, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{s.title}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
              <Avatar />
              <div style={{
                background: 'white', border: '1px solid #e8edf4',
                borderRadius: '4px 18px 18px 18px',
                padding: '14px 20px', display: 'flex', gap: 5, alignItems: 'center',
                boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
              }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 7, height: 7, borderRadius: '50%', background: '#0099cc',
                    animation: `inoai-pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 12, padding: '12px 16px', maxWidth: 500 }}>
              <p style={{ margin: 0, fontSize: 13, color: '#ef4444', fontWeight: 600 }}>{error}</p>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="inoai-input-area" style={{ padding: '10px 14px 14px', borderTop: '1px solid #e8edf4', background: '#f8faff', flexShrink: 0 }}>
          <div style={{
            display: 'flex', gap: 10, background: 'white',
            border: '1.5px solid #c8d4e8', borderRadius: 16,
            padding: '8px 8px 8px 16px',
            boxShadow: '0 2px 16px rgba(0,51,102,0.08)',
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Frage zu INOMETA-Produkten stellen…"
              rows={1}
              style={{
                flex: 1, border: 'none', outline: 'none', resize: 'none',
                fontSize: 14, fontFamily: 'Arial, sans-serif', color: '#1a2a3a',
                background: 'transparent', lineHeight: 1.5,
                maxHeight: 120, overflowY: 'auto', paddingTop: 4,
              }}
              onInput={e => {
                const t = e.currentTarget
                t.style.height = 'auto'
                t.style.height = Math.min(t.scrollHeight, 120) + 'px'
              }}
            />
            <button
              type="button"
              onClick={send}
              disabled={loading || !input.trim()}
              style={{
                width: 38, height: 38, borderRadius: 10, border: 'none', flexShrink: 0,
                background: loading || !input.trim()
                  ? '#c8d4e8'
                  : 'linear-gradient(135deg, #003366, #0055aa)',
                cursor: loading || !input.trim() ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: loading || !input.trim() ? 'none' : '0 2px 8px rgba(0,51,102,0.3)',
                transition: 'all 0.2s',
                alignSelf: 'flex-end',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
          <p className="inoai-hint" style={{ margin: '6px 0 0', fontSize: 11, color: '#9ca3af', textAlign: 'center' }}>
            <span className="inoai-topbar-label">INOai nutzt INOMETA-Produktinformationen · Enter zum Senden · </span>
            Shift+Enter für Zeilenumbruch
          </p>
        </div>
      </div>

      <style>{`
        @keyframes inoai-pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        /* Letzter Absatz kein Bottom-Margin */
        .inoai-md p:last-child { margin-bottom: 0 !important; }
        /* Zebra-Streifen für Tabellen */
        .inoai-md tbody tr:nth-child(even) { background: #f8faff; }

        /* ── Mobile Optimierungen ── */
        @media (max-width: 767px) {
          /* Bubbles breiter auf Mobile */
          .inoai-bubble-wrap { max-width: 92% !important; }
          /* Weniger horizontales Padding bei Nachrichten */
          .inoai-msgs { padding: 12px 10px !important; gap: 12px !important; }
          /* Input-Bereich: extra Padding unten für Bottom-Nav (56px) */
          .inoai-input-area { padding: 8px 10px 68px !important; }
          /* Topbar kompakter */
          .inoai-topbar { padding: 8px 12px !important; }
          /* Topbar "Verlauf"-Text auf Mobile ausblenden, nur Icon */
          .inoai-topbar-label { display: none !important; }
        }
      `}</style>
    </div>
  )
}
