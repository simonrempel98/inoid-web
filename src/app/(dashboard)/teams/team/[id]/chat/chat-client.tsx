'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type ChatMessage = {
  id: string
  user_id: string
  sender_name: string
  sender_role: string | null
  content: string
  asset_mentions: string[]
  created_at: string
  edited_at: string | null
}

type AssetHit = { id: string; title: string; category: string | null }
type AssetPreview = { id: string; title: string; category: string | null; description: string | null }

const ROLE_COLOR: Record<string, string> = {
  superadmin: '#a78bfa',
  admin:      '#fbbf24',
  techniker:  '#94a3b8',
  leser:      '#d97706',
}
const ROLE_LABEL: Record<string, string> = {
  superadmin: 'Superadmin',
  admin:      'Admin',
  techniker:  'Techniker',
  leser:      'Leser',
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1)
  const time = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  if (d.toDateString() === now.toDateString())       return time
  if (d.toDateString() === yesterday.toDateString()) return `Gestern ${time}`
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) + ' ' + time
}

// Rendert Nachrichteninhalt: @[Name](uuid) → klickbarer Chip (nur Name, keine UUID)
function renderContent(content: string) {
  const parts = content.split(/(@\[[^\]]+\]\([^)]+\))/g)
  return parts.map((part, i) => {
    const m = part.match(/^@\[([^\]]+)\]\(([^)]+)\)$/)
    if (m) {
      return (
        <span key={i} style={{
          display: 'inline-flex', alignItems: 'center', gap: 3,
          background: 'rgba(0,153,204,0.15)', color: '#0099cc',
          borderRadius: 6, padding: '1px 6px 1px 4px',
          fontWeight: 700, fontSize: '0.95em', cursor: 'default',
        }}>
          <span style={{ fontSize: '0.8em', opacity: 0.7 }}>@</span>{m[1]}
        </span>
      )
    }
    return <span key={i}>{part}</span>
  })
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

function AssetPreviewCard({ asset, isMine }: { asset: AssetPreview; isMine: boolean }) {
  return (
    <Link href={`/assets/${asset.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{
        marginTop: 6,
        borderRadius: 10,
        overflow: 'hidden',
        border: isMine ? '1px solid rgba(255,255,255,0.18)' : '1px solid #e2eaf5',
        borderLeft: '3px solid #0099cc',
        background: isMine ? 'rgba(255,255,255,0.08)' : '#f7fafd',
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px',
        transition: 'background 0.15s',
        cursor: 'pointer',
      }}>
        {/* Icon */}
        <div style={{
          width: 34, height: 34, borderRadius: 8, flexShrink: 0,
          background: isMine ? 'rgba(0,153,204,0.25)' : '#e8f4fb',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0099cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
            <rect x="8" y="2" width="8" height="4" rx="1"/>
          </svg>
        </div>

        {/* Text */}
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{
            margin: 0, fontSize: 12, fontWeight: 700,
            color: isMine ? 'rgba(255,255,255,0.92)' : '#1a2a3a',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {asset.title}
          </p>
          {(asset.category || asset.description) && (
            <p style={{
              margin: '1px 0 0', fontSize: 10,
              color: isMine ? 'rgba(255,255,255,0.55)' : '#96aed2',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {asset.category ?? asset.description?.slice(0, 60)}
            </p>
          )}
        </div>

        {/* Arrow */}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke={isMine ? 'rgba(255,255,255,0.4)' : '#c8d4e8'} strokeWidth="2.5" strokeLinecap="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>
    </Link>
  )
}

export function ChatClient({
  initialMessages,
  currentUserId,
  orgId,
  teamId,
  avatarsByUserId = {},
}: {
  initialMessages: ChatMessage[]
  currentUserId: string
  orgId: string
  teamId: string
  avatarsByUserId?: Record<string, string | null>
}) {
  const supabase = createClient()
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionResults, setMentionResults] = useState<AssetHit[]>([])
  const [mentionIndex, setMentionIndex] = useState(0)
  const [atPos, setAtPos] = useState<number>(-1)
  const [input, setInput] = useState('')

  // Asset-Cache für Preview-Karten
  const [assetCache, setAssetCache] = useState<Record<string, AssetPreview>>({})

  const scrollRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLTextAreaElement>(null)
  const isAtBottom = useRef(true)

  // Merken ob Nutzer selbst hochgescrollt hat
  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    isAtBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60
  }

  // Nur ans Ende scrollen wenn schon am Ende (oder neue eigene Nachricht)
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    if (isAtBottom.current) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages])

  // Beim ersten Laden immer ans Ende
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [])

  // Beim Öffnen des Chats: als gelesen markieren
  useEffect(() => {
    localStorage.setItem(`chat_last_read_${teamId}`, new Date().toISOString())
  }, [teamId])

  // Asset-Previews nachladen für alle erwähnten Assets
  useEffect(() => {
    const allIds = new Set<string>()
    for (const m of messages) {
      for (const id of m.asset_mentions ?? []) allIds.add(id)
    }
    const unknownIds = [...allIds].filter(id => !assetCache[id])
    if (!unknownIds.length) return

    supabase
      .from('assets')
      .select('id, title, category, description')
      .in('id', unknownIds)
      .is('deleted_at', null)
      .then(({ data }) => {
        if (!data?.length) return
        setAssetCache(prev => {
          const next = { ...prev }
          for (const a of data) next[a.id] = { id: a.id, title: a.title, category: a.category ?? null, description: (a as any).description ?? null }
          return next
        })
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages])

  useEffect(() => {
    const channel = supabase
      .channel(`chat:${teamId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `team_id=eq.${teamId}` },
        payload => {
          const msg = payload.new as ChatMessage
          // Leere Payloads ignorieren (Supabase Realtime + RLS liefert manchmal unvollständige Rows)
          if (!msg?.id || !msg?.content?.trim()) return
          setMessages(prev => {
            if (prev.find(m => m.id === msg.id)) return prev
            return [...prev, msg]
          })
          isAtBottom.current = true  // Neue Nachricht → ans Ende scrollen
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chat_messages', filter: `team_id=eq.${teamId}` },
        payload => {
          setMessages(prev => prev.map(m =>
            m.id === (payload.new as ChatMessage).id ? { ...m, ...(payload.new as ChatMessage) } : m
          ))
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [teamId])

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

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value
    setInput(val)
    setError(null)
    const cursor = e.target.selectionStart ?? val.length
    const atMatch = val.slice(0, cursor).match(/@([^@\s]*)$/)
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
    setInput(before + mention + ' ' + after)
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

  function startEdit(msg: ChatMessage) {
    setEditingId(msg.id)
    setEditContent(msg.content)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditContent('')
  }

  async function saveEdit() {
    if (!editingId || !editContent.trim()) return
    setSavingEdit(true)
    const res = await fetch('/api/chat/messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId: editingId, content: editContent.trim() }),
    })
    setSavingEdit(false)
    if (res.ok) {
      setMessages(prev => prev.map(m =>
        m.id === editingId ? { ...m, content: editContent.trim(), edited_at: new Date().toISOString() } : m
      ))
      cancelEdit()
    }
  }

  async function handleSend() {
    const content = input.trim()
    if (!content || sending) return
    const mentions = [...content.matchAll(/@\[[^\]]+\]\(([^)]+)\)/g)].map(m => m[1])
    setSending(true)
    setError(null)
    const res = await fetch('/api/chat/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, teamId, assetMentions: mentions }),
    })
    setSending(false)
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Fehler beim Senden')
      return
    }
    setInput('')
    isAtBottom.current = true
    setMentionQuery(null)
    setMentionResults([])
  }

  function groupByDate(msgs: ChatMessage[]) {
    const groups: { label: string; msgs: ChatMessage[] }[] = []
    let lastDate = ''
    for (const m of msgs) {
      const label = new Date(m.created_at).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' })
      if (label !== lastDate) { groups.push({ label, msgs: [] }); lastDate = label }
      groups[groups.length - 1].msgs.push(m)
    }
    return groups
  }

  const groups = groupByDate(messages)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, fontFamily: 'Arial, sans-serif' }}>

      {/* Nachrichten */}
      <div ref={scrollRef} onScroll={handleScroll} style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {messages.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8, color: '#aab', paddingBottom: 40 }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#c8d4e8" strokeWidth="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#96aed2' }}>Noch keine Nachrichten</p>
            <p style={{ margin: 0, fontSize: 12, color: '#c8d4e8' }}>Schreibe die erste Nachricht an dein Team</p>
          </div>
        )}

        {groups.map(group => (
          <div key={group.label}>
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
              const mentionedAssets = (msg.asset_mentions ?? [])
                .map(id => assetCache[id])
                .filter(Boolean) as AssetPreview[]

              return (
                <div key={msg.id} style={{
                  display: 'flex',
                  flexDirection: isMine ? 'row-reverse' : 'row',
                  alignItems: 'flex-end',
                  gap: 8,
                  marginBottom: isSameSender ? 3 : 10,
                }}>
                  {!isMine && (
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                      background: avatarsByUserId[msg.user_id] ? 'transparent' : `${roleColor}22`,
                      border: `1.5px solid ${roleColor}44`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 800, color: roleColor,
                      visibility: isSameSender ? 'hidden' : 'visible',
                      overflow: 'hidden',
                    }}>
                      {avatarsByUserId[msg.user_id]
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={avatarsByUserId[msg.user_id]!} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : getInitials(msg.sender_name)}
                    </div>
                  )}
                  <div style={{ maxWidth: '72%' }}>
                    {!isMine && !isSameSender && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, paddingLeft: 2 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#000' }}>{msg.sender_name}</span>
                        {msg.sender_role && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: roleColor }}>{ROLE_LABEL[msg.sender_role]}</span>
                        )}
                      </div>
                    )}

                    {editingId === msg.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <textarea
                          value={editContent}
                          onChange={e => setEditContent(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit() }
                            if (e.key === 'Escape') cancelEdit()
                          }}
                          autoFocus
                          style={{
                            background: '#003366', color: 'white', border: '2px solid rgba(255,255,255,0.4)',
                            borderRadius: '14px 4px 14px 14px', padding: '9px 13px',
                            fontSize: 14, fontFamily: 'Arial, sans-serif', lineHeight: 1.45,
                            outline: 'none', resize: 'none', minWidth: 180, width: '100%',
                          }}
                          rows={Math.max(1, editContent.split('\n').length)}
                        />
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button onClick={cancelEdit} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid #c8d4e8', background: 'white', color: '#666', cursor: 'pointer', fontFamily: 'Arial, sans-serif' }}>
                            Abbrechen
                          </button>
                          <button onClick={saveEdit} disabled={savingEdit || !editContent.trim()} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: 'none', background: '#003366', color: 'white', cursor: 'pointer', fontFamily: 'Arial, sans-serif', fontWeight: 700, opacity: savingEdit ? 0.6 : 1 }}>
                            {savingEdit ? '…' : 'Speichern'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div
                          style={{
                            background: isMine ? '#003366' : 'white',
                            color: isMine ? 'white' : '#000',
                            borderRadius: isMine
                              ? (isSameSender ? '14px 4px 4px 14px' : '14px 4px 14px 14px')
                              : (isSameSender ? '4px 14px 14px 4px' : '4px 14px 14px 14px'),
                            padding: '9px 13px', fontSize: 14, lineHeight: 1.45,
                            boxShadow: '0 1px 4px rgba(0,40,100,0.08)',
                            border: isMine ? 'none' : '1px solid #e8eef6',
                            wordBreak: 'break-word', cursor: isMine ? 'pointer' : 'default',
                          }}
                          onDoubleClick={() => isMine && startEdit(msg)}
                        >
                          {renderContent(msg.content)}

                          {/* Asset-Preview-Karten (WhatsApp-Style) */}
                          {mentionedAssets.map(asset => (
                            <AssetPreviewCard key={asset.id} asset={asset} isMine={isMine} />
                          ))}
                        </div>
                        <div style={{
                          fontSize: 10, color: '#96aed2', marginTop: 3,
                          textAlign: isMine ? 'right' : 'left',
                          paddingLeft: isMine ? 0 : 2, paddingRight: isMine ? 2 : 0,
                          display: 'flex', gap: 6, justifyContent: isMine ? 'flex-end' : 'flex-start', alignItems: 'center',
                        }}>
                          {msg.edited_at && <span style={{ fontStyle: 'italic' }}>bearbeitet ·</span>}
                          {formatTime(msg.created_at)}
                          {isMine && (
                            <button onClick={() => startEdit(msg)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#96aed2', padding: 0, fontSize: 10, fontFamily: 'Arial, sans-serif', display: 'flex', alignItems: 'center' }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
        <div />
      </div>

      {/* Mention-Dropdown */}
      {mentionResults.length > 0 && (
        <div style={{
          margin: '0 16px', borderRadius: 12,
          background: 'white', border: '1px solid #dde4ee',
          boxShadow: '0 4px 20px rgba(0,40,100,0.12)',
          overflow: 'hidden', marginBottom: 4,
        }}>
          {mentionResults.map((a, i) => (
            <button key={a.id} type="button" onClick={() => insertMention(a)} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: '10px 14px',
              background: i === mentionIndex ? '#f0f7ff' : 'transparent',
              border: 'none', borderBottom: i < mentionResults.length - 1 ? '1px solid #f0f4f8' : 'none',
              cursor: 'pointer', textAlign: 'left', fontFamily: 'Arial, sans-serif',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: '#e8f4fb',
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
            <span style={{ fontSize: 10, color: '#c8d4e8' }}>↑↓ navigieren · Enter einfügen · Esc schließen</span>
          </div>
        </div>
      )}

      {/* Eingabe */}
      <div style={{ padding: '8px 16px 16px', background: 'white', borderTop: '1px solid #eef1f6' }}>
        {error && <p style={{ margin: '0 0 6px', fontSize: 12, color: '#E74C3C' }}>{error}</p>}
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
              resize: 'none', lineHeight: 1.5, maxHeight: 120, overflowY: 'auto', paddingTop: 2,
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
