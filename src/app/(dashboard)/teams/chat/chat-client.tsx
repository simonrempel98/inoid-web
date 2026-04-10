'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

// ── Typen ─────────────────────────────────────────────────────────────────────

type ChatMessage = {
  id: string
  user_id: string
  sender_name: string
  sender_role: string | null
  content: string
  asset_mentions: string[]
  created_at: string
}

type AssetHit = { id: string; title: string; category: string | null }

// ── Hilfsfunktionen ───────────────────────────────────────────────────────────

const ROLE_COLOR: Record<string, string> = {
  superadmin: '#a78bfa',
  admin:      '#fbbf24',
  technician: '#94a3b8',
  viewer:     '#d97706',
}
const ROLE_LABEL: Record<string, string> = {
  superadmin: 'Superadmin',
  admin:      'Admin',
  technician: 'Techniker',
  viewer:     'Leser',
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1)
  const isYesterday = d.toDateString() === yesterday.toDateString()
  const time = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  if (isToday)     return time
  if (isYesterday) return `Gestern ${time}`
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) + ' ' + time
}

// @[Name](uuid) → React-Element mit Link
function renderContent(content: string) {
  const parts = content.split(/(@\[[^\]]+\]\([^)]+\))/g)
  return parts.map((part, i) => {
    const m = part.match(/^@\[([^\]]+)\]\(([^)]+)\)$/)
    if (m) {
      return (
        <Link key={i} href={`/assets/${m[2]}`} style={{
          color: '#0099cc', fontWeight: 700, textDecoration: 'none',
          background: '#e8f4fb', borderRadius: 4, padding: '0 3px',
          fontSize: 'inherit',
        }}>
          @{m[1]}
        </Link>
      )
    }
    return <span key={i}>{part}</span>
  })
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

// ── Haupt-Komponente ──────────────────────────────────────────────────────────

export function ChatClient({
  initialMessages,
  currentUserId,
  orgId,
}: {
  initialMessages: ChatMessage[]
  currentUserId: string
  orgId: string
}) {
  const supabase = createClient()
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Asset-Mention State
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionResults, setMentionResults] = useState<AssetHit[]>([])
  const [mentionIndex, setMentionIndex] = useState(0)
  const [atPos, setAtPos] = useState<number>(-1)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)

  // ── Scroll to bottom ──
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Realtime ──
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${orgId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `organization_id=eq.${orgId}` },
        payload => {
          setMessages(prev => {
            if (prev.find(m => m.id === (payload.new as ChatMessage).id)) return prev
            return [...prev, payload.new as ChatMessage]
          })
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [orgId])

  // ── Asset-Suche ──
  const searchAssets = useCallback(async (q: string) => {
    if (!q.trim()) { setMentionResults([]); return }
    const { data } = await supabase
      .from('assets')
      .select('id, title, category')
      .eq('organization_id', orgId)
      .ilike('title', `%${q}%`)
      .is('deleted_at', null)
      .limit(6)
    setMentionResults((data ?? []) as AssetHit[])
    setMentionIndex(0)
  }, [orgId])

  // ── Input-Handler ──
  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value
    setInput(val)
    setError(null)

    // @ erkennen
    const cursor = e.target.selectionStart ?? val.length
    const textUpToCursor = val.slice(0, cursor)
    const atMatch = textUpToCursor.match(/@([^@\s]*)$/)
    if (atMatch) {
      setAtPos(cursor - atMatch[0].length)
      setMentionQuery(atMatch[1])
      searchAssets(atMatch[1])
    } else {
      setMentionQuery(null)
      setMentionResults([])
    }
  }

  function insertMention(asset: AssetHit) {
    const mention = `@[${asset.title}](${asset.id})`
    const before = input.slice(0, atPos)
    const after  = input.slice(inputRef.current?.selectionStart ?? input.length)
    const newVal = before + mention + ' ' + after
    setInput(newVal)
    setMentionQuery(null)
    setMentionResults([])
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (mentionResults.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIndex(i => Math.min(i + 1, mentionResults.length - 1)); return }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setMentionIndex(i => Math.max(i - 1, 0)); return }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); insertMention(mentionResults[mentionIndex]); return }
      if (e.key === 'Escape')    { setMentionQuery(null); setMentionResults([]); return }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ── Senden ──
  async function handleSend() {
    const content = input.trim()
    if (!content || sending) return

    // Asset-IDs aus Mentions extrahieren
    const mentions = [...content.matchAll(/@\[[^\]]+\]\(([^)]+)\)/g)].map(m => m[1])

    setSending(true)
    setError(null)
    const res = await fetch('/api/chat/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, assetMentions: mentions }),
    })
    setSending(false)
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Fehler beim Senden')
      return
    }
    setInput('')
    setMentionQuery(null)
    setMentionResults([])
  }

  // ── Gruppierung: Nachrichten nach Datum ──
  function groupByDate(msgs: ChatMessage[]) {
    const groups: { label: string; msgs: ChatMessage[] }[] = []
    let lastDate = ''
    for (const m of msgs) {
      const d = new Date(m.created_at)
      const label = d.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' })
      if (label !== lastDate) { groups.push({ label, msgs: [] }); lastDate = label }
      groups[groups.length - 1].msgs.push(m)
    }
    return groups
  }

  const groups = groupByDate(messages)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 130px)', fontFamily: 'Arial, sans-serif' }}>

      {/* ── Nachrichten-Liste ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 0 }}>
        {messages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#aab', paddingBottom: 40 }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#c8d4e8" strokeWidth="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#96aed2' }}>Noch keine Nachrichten</p>
            <p style={{ margin: 0, fontSize: 12, color: '#c8d4e8' }}>Schreibe die erste Nachricht an dein Team</p>
          </div>
        )}

        {groups.map(group => (
          <div key={group.label}>
            {/* Datum-Trenner */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '16px 0 12px' }}>
              <div style={{ flex: 1, height: 1, background: '#eef1f6' }} />
              <span style={{ fontSize: 11, color: '#96aed2', fontWeight: 600, whiteSpace: 'nowrap' }}>{group.label}</span>
              <div style={{ flex: 1, height: 1, background: '#eef1f6' }} />
            </div>

            {group.msgs.map((msg, idx) => {
              const isMine = msg.user_id === currentUserId
              const prevMsg = group.msgs[idx - 1]
              const isSameSender = prevMsg?.user_id === msg.user_id
              const roleColor = ROLE_COLOR[msg.sender_role ?? ''] ?? '#96aed2'

              return (
                <div key={msg.id} style={{
                  display: 'flex',
                  flexDirection: isMine ? 'row-reverse' : 'row',
                  alignItems: 'flex-end',
                  gap: 8,
                  marginBottom: isSameSender ? 3 : 10,
                }}>
                  {/* Avatar */}
                  {!isMine && (
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                      background: `${roleColor}22`,
                      border: `1.5px solid ${roleColor}44`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 800, color: roleColor,
                      visibility: isSameSender ? 'hidden' : 'visible',
                    }}>
                      {getInitials(msg.sender_name)}
                    </div>
                  )}

                  {/* Bubble */}
                  <div style={{ maxWidth: '72%' }}>
                    {/* Absender-Name (nur erste Nachricht einer Gruppe) */}
                    {!isMine && !isSameSender && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, paddingLeft: 2 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#000' }}>{msg.sender_name}</span>
                        {msg.sender_role && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: roleColor }}>{ROLE_LABEL[msg.sender_role]}</span>
                        )}
                      </div>
                    )}
                    <div style={{
                      background: isMine ? '#003366' : 'white',
                      color: isMine ? 'white' : '#000',
                      borderRadius: isMine
                        ? (isSameSender ? '14px 4px 4px 14px' : '14px 4px 14px 14px')
                        : (isSameSender ? '4px 14px 14px 4px' : '4px 14px 14px 14px'),
                      padding: '9px 13px',
                      fontSize: 14, lineHeight: 1.45,
                      boxShadow: '0 1px 4px rgba(0,40,100,0.08)',
                      border: isMine ? 'none' : '1px solid #e8eef6',
                      wordBreak: 'break-word',
                    }}>
                      {renderContent(msg.content)}
                    </div>
                    <div style={{
                      fontSize: 10, color: '#96aed2', marginTop: 3,
                      textAlign: isMine ? 'right' : 'left',
                      paddingLeft: isMine ? 0 : 2, paddingRight: isMine ? 2 : 0,
                    }}>
                      {formatTime(msg.created_at)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* ── Asset-Mention Dropdown ── */}
      {mentionResults.length > 0 && (
        <div style={{
          margin: '0 16px', borderRadius: 12,
          background: 'white', border: '1px solid #dde4ee',
          boxShadow: '0 4px 20px rgba(0,40,100,0.12)',
          overflow: 'hidden', marginBottom: 4,
        }}>
          {mentionResults.map((a, i) => (
            <button
              key={a.id}
              type="button"
              onClick={() => insertMention(a)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '10px 14px',
                background: i === mentionIndex ? '#f0f7ff' : 'transparent',
                border: 'none', borderBottom: i < mentionResults.length - 1 ? '1px solid #f0f4f8' : 'none',
                cursor: 'pointer', textAlign: 'left', fontFamily: 'Arial, sans-serif',
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: '#e8f4fb',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0099cc" strokeWidth="2">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                  <rect x="8" y="2" width="8" height="4" rx="1"/>
                </svg>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#000' }}>{a.title}</p>
                {a.category && <p style={{ margin: 0, fontSize: 11, color: '#96aed2' }}>{a.category}</p>}
              </div>
            </button>
          ))}
          <div style={{ padding: '6px 14px', background: '#fafbfc', borderTop: '1px solid #f0f4f8' }}>
            <span style={{ fontSize: 10, color: '#c8d4e8', fontFamily: 'Arial, sans-serif' }}>↑↓ navigieren · Enter einfügen · Esc schließen</span>
          </div>
        </div>
      )}

      {/* ── Eingabe ── */}
      <div style={{ padding: '8px 16px 16px', background: 'white', borderTop: '1px solid #eef1f6' }}>
        {error && (
          <p style={{ margin: '0 0 6px', fontSize: 12, color: '#E74C3C' }}>{error}</p>
        )}
        <div style={{
          display: 'flex', gap: 8, alignItems: 'flex-end',
          background: '#f4f7fb', borderRadius: 16,
          border: '1.5px solid #dde4ee', padding: '8px 8px 8px 14px',
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Nachricht schreiben… (@Name für Asset-Erwähnung)"
            rows={1}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontSize: 14, fontFamily: 'Arial, sans-serif', color: '#000',
              resize: 'none', lineHeight: 1.5, maxHeight: 120, overflowY: 'auto',
              paddingTop: 2,
            }}
            onInput={e => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = Math.min(el.scrollHeight, 120) + 'px'
            }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || sending}
            style={{
              width: 36, height: 36, borderRadius: '50%', border: 'none', flexShrink: 0,
              background: !input.trim() || sending ? '#dde4ee' : '#003366',
              cursor: !input.trim() || sending ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
        <p style={{ margin: '5px 0 0', fontSize: 10, color: '#c8d4e8', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
          Nachrichten werden nach 30 Tagen automatisch gelöscht · Shift+Enter für neue Zeile
        </p>
      </div>
    </div>
  )
}
