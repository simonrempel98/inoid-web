'use client'

import { useState, useRef, useEffect } from 'react'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: { title: string; source_type: string; source_url: string | null }[]
}

function SourceBadge({ type }: { type: string }) {
  const colors: Record<string, { bg: string; color: string; label: string }> = {
    website:   { bg: '#e8f4fd', color: '#0099cc', label: 'Website' },
    datasheet: { bg: '#f0fdf4', color: '#059669', label: 'Datenblatt' },
    brochure:  { bg: '#fef3c7', color: '#b45309', label: 'Broschüre' },
  }
  const c = colors[type] ?? colors.website
  return (
    <span style={{
      display: 'inline-block', background: c.bg, color: c.color,
      fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 10,
      fontFamily: 'Arial, sans-serif', marginRight: 4,
    }}>
      {c.label}
    </span>
  )
}

export function INOaiChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: 'Hallo! Ich bin INOai, dein Assistent für Fragen zu INOMETA-Produkten. Wie kann ich dir helfen?',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setError(null)

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    const history = messages
      .filter(m => m.role !== 'assistant' || m.id !== '0')
      .map(m => ({ role: m.role, content: m.content }))

    try {
      const res = await fetch('/api/inoai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Fehler')
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        sources: data.sources?.filter((s: any) => s.rank > 0) ?? [],
      }
      setMessages(prev => [...prev, aiMsg])
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', maxWidth: 760, fontFamily: 'Arial, sans-serif' }}>

      {/* Message list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {messages.map(msg => (
          <div key={msg.id} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
          }}>
            {msg.role === 'assistant' && (
              <div style={{
                width: 32, height: 32, borderRadius: 10, flexShrink: 0, marginRight: 10,
                background: 'linear-gradient(135deg, #003366, #0099cc)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                alignSelf: 'flex-end',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z"/>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                  <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3"/>
                  <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3"/>
                </svg>
              </div>
            )}

            <div style={{ maxWidth: '78%' }}>
              <div style={{
                background: msg.role === 'user' ? '#003366' : 'white',
                color: msg.role === 'user' ? 'white' : '#1a2a3a',
                padding: '12px 16px',
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                fontSize: 14, lineHeight: 1.6,
                border: msg.role === 'assistant' ? '1px solid #e8edf4' : 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                whiteSpace: 'pre-wrap',
              }}>
                {msg.content}
              </div>

              {/* Quellen */}
              {msg.sources && msg.sources.length > 0 && (
                <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {msg.sources.slice(0, 4).map((s, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      background: '#f4f6f9', borderRadius: 8, padding: '3px 8px',
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

        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg, #003366, #0099cc)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z"/>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3"/>
                <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3"/>
              </svg>
            </div>
            <div style={{
              background: 'white', border: '1px solid #e8edf4', borderRadius: '18px 18px 18px 4px',
              padding: '12px 18px', display: 'flex', gap: 5, alignItems: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: '50%', background: '#0099cc',
                  animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 14px' }}>
            <p style={{ margin: 0, fontSize: 13, color: '#ef4444' }}>{error}</p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px 24px 20px', borderTop: '1px solid #e8edf4', background: '#f4f6f9' }}>
        <div style={{
          display: 'flex', gap: 10, background: 'white',
          border: '1.5px solid #c8d4e8', borderRadius: 16,
          padding: '8px 8px 8px 16px',
          boxShadow: '0 2px 12px rgba(0,51,102,0.08)',
          transition: 'border-color 0.2s',
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
              maxHeight: 120, overflowY: 'auto',
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
              background: loading || !input.trim() ? '#c8d4e8' : '#003366',
              cursor: loading || !input.trim() ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.2s',
              alignSelf: 'flex-end',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
        <p style={{ margin: '8px 0 0', fontSize: 11, color: '#9ca3af', textAlign: 'center' }}>
          INOai nutzt INOMETA-Produktinformationen. Angaben ohne Gewähr.
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </div>
  )
}
