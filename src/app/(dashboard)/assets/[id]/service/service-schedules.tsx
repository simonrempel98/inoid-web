'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'

type Schedule = {
  id: string
  name: string
  interval_days: number
  next_service_date: string | null
  last_service_date: string | null
  is_active: boolean
}

export function ServiceSchedules({ schedules, assetId }: { schedules: Schedule[]; assetId: string }) {
  const router = useRouter()
  const t = useTranslations()
  const locale = useLocale()
  const supabase = createClient()
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  async function remove(id: string) {
    setDeleting(id)
    await supabase.from('maintenance_schedules').delete().eq('id', id)
    setDeleting(null)
    setConfirmId(null)
    router.refresh()
  }

  const btnStyle: React.CSSProperties = {
    width: 30, height: 30, borderRadius: 8,
    border: '1px solid var(--ds-border)', background: 'var(--ds-surface)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', flexShrink: 0,
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {schedules.map(s => {
          const next = s.next_service_date ? new Date(s.next_service_date.slice(0, 10) + 'T00:00:00') : null
          const days = next ? Math.ceil((next.getTime() - Date.now()) / 86400000) : null
          const color =
            days === null ? '#96aed2' :
            days < 0 ? '#E74C3C' :
            days <= 7 ? '#a855f7' :
            days <= 30 ? '#a855f7' : '#27AE60'
          const urgencyLabel =
            days === null ? '' :
            days < 0 ? t('service.schedules.overdueShort', { days: Math.abs(days) }) :
            days === 0 ? t('service.schedules.dueToday') :
            t('service.schedules.dueInShort', { n: days })

          const pct = (s.last_service_date && s.interval_days > 0)
            ? Math.max(0, Math.min(100,
                (Date.now() - new Date(s.last_service_date).getTime()) / (s.interval_days * 86400000) * 100
              ))
            : next ? (days !== null && days < 0 ? 100 : null) : null

          return (
            <div key={s.id} style={{
              background: 'var(--ds-surface)', borderRadius: 12,
              border: `1px solid ${days !== null && days <= 7 ? color + '66' : '#c8d4e8'}`,
              overflow: 'hidden',
            }}>
              <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Urgency dot */}
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontWeight: 700, fontSize: 13, color: 'var(--ds-text)', margin: '0 0 2px',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{s.name}</p>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: '#96aed2' }}>{t('service.schedules.intervalShort', { n: s.interval_days })}</span>
                    {next && (
                      <>
                        <span style={{ fontSize: 11, color: '#c8d4e8' }}>·</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color }}>{urgencyLabel}</span>
                        <span style={{ fontSize: 11, color: '#96aed2' }}>
                          {next.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Bearbeiten */}
                <button
                  type="button"
                  title={t('common.edit')}
                  onClick={() => router.push(`/assets/${assetId}/service/intervall?edit=${s.id}`)}
                  style={btnStyle}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#96aed2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>

                {/* Löschen */}
                <button
                  type="button"
                  title={t('common.delete')}
                  onClick={() => setConfirmId(s.id)}
                  disabled={deleting === s.id}
                  style={{ ...btnStyle, opacity: deleting === s.id ? 0.4 : 1 }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6M14 11v6"/>
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                </button>
              </div>

              {/* Progress bar */}
              {pct !== null && (
                <div style={{ height: 3, background: '#f0f4ff' }}>
                  <div style={{ height: '100%', background: color, width: `${pct}%`, transition: 'width 0.4s ease' }} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Bestätigungs-Dialog */}
      {confirmId && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          zIndex: 100, padding: '0 16px 32px',
        }}>
          <div style={{
            background: 'var(--ds-surface)', borderRadius: 20, padding: 24,
            width: '100%', maxWidth: 420, fontFamily: 'Arial, sans-serif',
          }}>
            <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--ds-text)', margin: '0 0 8px' }}>
              {t('service.schedules.deleteConfirmTitle')}
            </p>
            <p style={{ color: '#666', fontSize: 14, margin: '0 0 20px', lineHeight: 1.5 }}>
              {t('service.schedules.deleteConfirmBody', { name: schedules.find(s => s.id === confirmId)?.name ?? '' })}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setConfirmId(null)}
                style={{
                  flex: 1, padding: '13px', borderRadius: 50,
                  border: '1px solid var(--ds-border)', background: 'var(--ds-surface)',
                  color: '#666', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                }}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={() => remove(confirmId)}
                disabled={!!deleting}
                style={{
                  flex: 1, padding: '13px', borderRadius: 50,
                  border: 'none', background: deleting ? '#c8d4e8' : '#dc2626',
                  color: 'white', fontSize: 14, fontWeight: 700,
                  cursor: deleting ? 'default' : 'pointer',
                }}
              >
                {deleting ? t('service.schedules.deleting') : t('service.schedules.confirmDelete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
