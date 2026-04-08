'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getEventType } from '@/lib/service-types'
import { Wrench, User, Building2, Calendar } from 'lucide-react'

type ChecklistResultItem = {
  id: string
  text: string
  resources?: string
  checked: boolean
  note?: string
}

type Event = {
  id: string
  title: string
  event_type: string
  event_date: string
  description: string | null
  performed_by: string | null
  external_company: string | null
  cost_eur: number | null
  next_service_date: string | null
  notes: string | null
  attachments: unknown
  checklist_result?: ChecklistResultItem[]
}

function groupByMonth(events: Event[]) {
  const map = new Map<string, Event[]>()
  for (const e of events) {
    const d = new Date(e.event_date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(e)
  }
  return map
}

const MONTH_NAMES = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']

export function ServiceTimeline({ events, assetId }: { events: Event[]; assetId: string }) {
  const router = useRouter()
  const grouped = groupByMonth(events)
  const months = [...grouped.keys()].sort((a, b) => b.localeCompare(a)) // neueste zuerst

  // Erster Monat standardmäßig offen
  const [openMonths, setOpenMonths] = useState<Set<string>>(() => new Set(months.slice(0, 1)))
  const [openEvents, setOpenEvents] = useState<Set<string>>(new Set())

  function toggleMonth(key: string) {
    setOpenMonths(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  function toggleEvent(id: string) {
    setOpenEvents(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  if (events.length === 0) {
    return (
      <div style={{
        background: 'white', borderRadius: 16, padding: 40,
        border: '1px solid #c8d4e8', textAlign: 'center',
      }}>
        <div style={{ marginBottom: 12 }}><Wrench size={32} style={{ color: '#96aed2' }} /></div>
        <p style={{ fontWeight: 700, color: '#000', fontSize: 15, margin: '0 0 8px' }}>Noch keine Einträge</p>
        <p style={{ color: '#666', fontSize: 13, margin: 0 }}>Dokumentiere Wartungen, Reparaturen und Inspektionen.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {months.map(monthKey => {
        const [year, month] = monthKey.split('-')
        const monthEvents = grouped.get(monthKey)!
        const isOpen = openMonths.has(monthKey)
        const monthCost = monthEvents.reduce((s, e) => s + (e.cost_eur ?? 0), 0)

        return (
          <div key={monthKey} style={{
            background: 'white', borderRadius: 14,
            border: '1px solid #c8d4e8',
            overflow: 'hidden',
          }}>
            {/* Monats-Header */}
            <button
              type="button"
              onClick={() => toggleMonth(monthKey)}
              style={{
                width: '100%', padding: '12px 14px',
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 10,
                textAlign: 'left',
              }}
            >
              {/* Chevron */}
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="#003366" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ flexShrink: 0, transition: 'transform 0.2s', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
              >
                <polyline points="9 18 15 12 9 6"/>
              </svg>

              {/* Monat + Jahr */}
              <span style={{ fontWeight: 700, fontSize: 14, color: '#000', flex: 1 }}>
                {MONTH_NAMES[parseInt(month) - 1]} {year}
              </span>

              {/* Badges */}
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                background: '#f4f6f9', color: '#666',
              }}>
                {monthEvents.length} {monthEvents.length === 1 ? 'Eintrag' : 'Einträge'}
              </span>
              {monthCost > 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                  background: '#f3f0ff', color: '#8B5CF6',
                }}>
                  {monthCost.toLocaleString('de-DE')} €
                </span>
              )}
            </button>

            {/* Events */}
            {isOpen && (
              <div style={{ borderTop: '1px solid #f4f6f9' }}>
                {monthEvents.map((event, i) => {
                  const et = getEventType(event.event_type)
                  const date = new Date(event.event_date)
                  const isEventOpen = openEvents.has(event.id)
                  const attachments = Array.isArray(event.attachments) ? event.attachments as string[] : []
                  const photos = attachments.filter(a => a.includes('|photo|'))
                  const docs = attachments.filter(a => a.includes('|doc|'))
                  const checklist = Array.isArray((event as any).checklist_result) ? (event as any).checklist_result as ChecklistResultItem[] : []
                  const hasDetails = true

                  return (
                    <div key={event.id} style={{ borderTop: i > 0 ? '1px solid #f4f6f9' : 'none' }}>
                      {/* Kompakte Zeile */}
                      <button
                        type="button"
                        onClick={() => hasDetails && toggleEvent(event.id)}
                        style={{
                          width: '100%', padding: '10px 14px 10px 20px',
                          background: 'none', border: 'none',
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 10,
                          textAlign: 'left',
                        }}
                      >
                        {/* Typ-Punkt */}
                        <span style={{
                          width: 28, height: 28, flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          borderRadius: '50%', background: `${et.color}18`,
                        }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: et.color, display: 'block' }} />
                        </span>

                        {/* Titel */}
                        <span style={{
                          flex: 1, fontSize: 13, fontWeight: 600, color: '#000',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>{event.title}</span>

                        {/* Datum */}
                        <span style={{ fontSize: 11, color: '#96aed2', flexShrink: 0 }}>
                          {date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                        </span>

                        {/* Kosten */}
                        {event.cost_eur ? (
                          <span style={{
                            fontSize: 11, fontWeight: 700, color: '#8B5CF6',
                            flexShrink: 0,
                          }}>{Number(event.cost_eur).toLocaleString('de-DE')} €</span>
                        ) : null}

                        {/* Expand-Chevron */}
                        {hasDetails && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                            stroke="#c8d4e8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                            style={{ flexShrink: 0, transition: 'transform 0.2s', transform: isEventOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                            <polyline points="6 9 12 15 18 9"/>
                          </svg>
                        )}
                      </button>

                      {/* Ausgeklappte Details */}
                      {isEventOpen && (
                        <div style={{
                          padding: '0 14px 14px 58px',
                          display: 'flex', flexDirection: 'column', gap: 8,
                        }}>
                          {/* Typ-Badge + Datum + Edit-Button */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{
                                display: 'inline-block', fontSize: 10, fontWeight: 700,
                                padding: '2px 8px', borderRadius: 10,
                                backgroundColor: `${et.color}20`, color: et.color,
                              }}>{et.label}</span>
                              <span style={{ fontSize: 11, color: '#96aed2' }}>
                                {date.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => router.push(`/assets/${assetId}/service/neu?edit=${event.id}`)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 4,
                                padding: '5px 10px', borderRadius: 8,
                                border: '1px solid #c8d4e8', background: 'white',
                                color: '#003366', fontSize: 11, fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#003366" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                              Bearbeiten
                            </button>
                          </div>

                          {event.description && (
                            <p style={{ fontSize: 13, color: '#444', margin: 0, lineHeight: 1.5 }}>
                              {event.description}
                            </p>
                          )}

                          {/* Meta */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {event.performed_by && <Chip icon={<User size={12} />} label={event.performed_by} />}
                            {event.external_company && <Chip icon={<Building2 size={12} />} label={event.external_company} />}
                            {event.next_service_date && (
                              <Chip icon={<Calendar size={12} />} label={`Nächste: ${new Date(event.next_service_date).toLocaleDateString('de-DE')}`} highlight />
                            )}
                          </div>

                          {event.notes && (
                            <div style={{
                              background: '#f9fbff', borderRadius: 8, padding: '8px 10px',
                              border: '1px solid #e8eef8',
                            }}>
                              <p style={{ fontSize: 10, fontWeight: 700, color: '#96aed2', margin: '0 0 3px' }}>NOTIZEN</p>
                              <p style={{ fontSize: 12, color: '#444', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{event.notes}</p>
                            </div>
                          )}

                          {/* Checkliste */}
                          {checklist.length > 0 && (
                            <div style={{
                              background: '#f9fbff', borderRadius: 8, padding: '8px 10px',
                              border: '1px solid #e8eef8',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                <p style={{ fontSize: 10, fontWeight: 700, color: '#96aed2', margin: 0 }}>CHECKLISTE</p>
                                <span style={{ fontSize: 10, fontWeight: 700, color: '#22c55e' }}>
                                  {checklist.filter(c => c.checked).length}/{checklist.length} erledigt
                                </span>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                                {checklist.map((item, ci) => (
                                  <div key={ci} style={{
                                    borderBottom: ci < checklist.length - 1 ? '1px solid #f4f6f9' : 'none',
                                    padding: '6px 0',
                                  }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                      {/* Schritt-Nummer/Checkmark */}
                                      <span style={{
                                        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                                        background: item.checked ? '#22c55e' : '#f4f6f9',
                                        border: `1.5px solid ${item.checked ? '#22c55e' : '#c8d4e8'}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 9, fontWeight: 800,
                                        color: item.checked ? 'white' : '#666',
                                        marginTop: 1,
                                      }}>
                                        {item.checked
                                          ? <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                          : ci + 1
                                        }
                                      </span>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <span style={{
                                          fontSize: 12, color: item.checked ? '#888' : '#333',
                                          textDecoration: item.checked ? 'line-through' : 'none',
                                          display: 'block',
                                        }}>{item.text}</span>
                                        {item.resources && (
                                          <span style={{ fontSize: 10, color: '#96aed2', display: 'block', marginTop: 1 }}>
                                            🔧 {item.resources}
                                          </span>
                                        )}
                                        {item.note && (
                                          <div style={{
                                            marginTop: 4, padding: '4px 8px', borderRadius: 6,
                                            background: '#f9fbff', border: '1px solid #e8eef8',
                                            fontSize: 11, color: '#444', lineHeight: 1.4,
                                          }}>
                                            {item.note}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Fotos */}
                          {photos.length > 0 && (
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {photos.map((p, pi) => {
                                const url = p.split('|photo|')[0]
                                return (
                                  <a key={pi} href={url} target="_blank" rel="noreferrer">
                                    <img src={url} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, border: '1px solid #c8d4e8' }} />
                                  </a>
                                )
                              })}
                            </div>
                          )}

                          {/* Dokumente */}
                          {docs.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {docs.map((d, di) => {
                                const parts = d.split('|doc|')
                                const url = parts[0]
                                const name = parts[1] ?? `Dokument ${di + 1}`
                                return (
                                  <a key={di} href={url} target="_blank" rel="noreferrer" style={{
                                    display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                                    borderRadius: 8, border: '1px solid #c8d4e8', textDecoration: 'none',
                                    background: '#f4f6f9',
                                  }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#003366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                      <polyline points="14 2 14 8 20 8"/>
                                    </svg>
                                    <span style={{ fontSize: 12, color: '#003366', fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                                  </a>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function Chip({ icon, label, highlight }: { icon: React.ReactNode; label: string; highlight?: boolean }) {
  return (
    <span style={{
      fontSize: 11, padding: '3px 8px', borderRadius: 8,
      backgroundColor: highlight ? '#fff8e6' : '#f4f6f9',
      color: highlight ? '#F39C12' : '#666',
      border: `1px solid ${highlight ? '#fde68a' : '#c8d4e8'}`,
      fontWeight: highlight ? 700 : 400,
    }}>
      {icon} {label}
    </span>
  )
}
