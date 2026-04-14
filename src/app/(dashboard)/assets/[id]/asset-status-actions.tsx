'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTranslations } from 'next-intl'
import { SYSTEM_STATUSES, type StatusConfig, statusBadgeStyle } from '@/lib/asset-statuses'
import { Trash2 } from 'lucide-react'

type Props = {
  assetId: string
  currentStatus: string
  customStatuses: StatusConfig[]
}

export function AssetStatusActions({ assetId, currentStatus, customStatuses }: Props) {
  const t = useTranslations('assets.statusActions')
  const tc = useTranslations('common')
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const allStatuses = [...SYSTEM_STATUSES, ...customStatuses]
  const current = allStatuses.find(s => s.value === currentStatus) ?? { value: currentStatus, label: currentStatus, color: '#96aed2' }

  async function changeStatus(value: string) {
    if (value === currentStatus) { setOpen(false); return }
    setLoading(true)
    await supabase.from('assets').update({ status: value }).eq('id', assetId)
    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  async function handleDelete() {
    setLoading(true)
    setDeleteError(null)
    const res = await fetch(`/api/assets/${assetId}/delete`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setDeleteError(data.error ?? `Fehler ${res.status}`)
      setLoading(false)
      return
    }
    router.push('/assets')
    router.refresh()
  }

  return (
    <>
      {/* Status-Picker Button */}
      <div style={{ position: 'relative' }}>
        <button type="button" onClick={() => setOpen(v => !v)}
          style={{
            width: '100%', padding: '12px 16px', borderRadius: 50,
            border: `2px solid ${current.color}`,
            background: `${current.color}15`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            cursor: 'pointer', fontFamily: 'Arial, sans-serif',
          }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: current.color, flexShrink: 0 }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: current.color }}>
            {current.label}
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={current.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 2 }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        {/* Dropdown */}
        {open && (
          <div style={{
            position: 'absolute', bottom: '110%', left: 0, right: 0, zIndex: 50,
            background: 'var(--ds-surface)', borderRadius: 16, border: '1px solid var(--ds-border)',
            boxShadow: '0 8px 32px rgba(0,51,102,0.15)', overflow: 'hidden',
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#96aed2', padding: '12px 16px 6px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'Arial, sans-serif' }}>
              {t('changeStatus')}
            </p>

            {/* System-Statuses */}
            {SYSTEM_STATUSES.map(s => (
              <button key={s.value} type="button" onClick={() => changeStatus(s.value)}
                disabled={loading}
                style={{
                  width: '100%', padding: '11px 16px', border: 'none', textAlign: 'left',
                  background: s.value === currentStatus ? `${s.color}12` : 'white',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                  borderBottom: '1px solid #f4f6f9',
                }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: 14, color: 'var(--ds-text)', fontFamily: 'Arial, sans-serif', fontWeight: s.value === currentStatus ? 700 : 400 }}>
                  {s.label}
                </span>
                {s.value === currentStatus && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto' }}>
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </button>
            ))}

            {/* Custom Statuses */}
            {customStatuses.length > 0 && (
              <>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#96aed2', padding: '10px 16px 6px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'Arial, sans-serif' }}>
                  {t('custom')}
                </p>
                {customStatuses.map(s => (
                  <button key={s.value} type="button" onClick={() => changeStatus(s.value)}
                    disabled={loading}
                    style={{
                      width: '100%', padding: '11px 16px', border: 'none', textAlign: 'left',
                      background: s.value === currentStatus ? `${s.color}12` : 'white',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                      borderBottom: '1px solid #f4f6f9',
                    }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: 'var(--ds-text)', fontFamily: 'Arial, sans-serif', fontWeight: s.value === currentStatus ? 700 : 400 }}>
                      {s.label}
                    </span>
                    {s.value === currentStatus && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto' }}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </button>
                ))}
              </>
            )}

            <button type="button" onClick={() => { setOpen(false); router.push('/settings/statuses') }}
              style={{ width: '100%', padding: '11px 16px', border: 'none', textAlign: 'left', background: '#f4f6f9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#96aed2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              <span style={{ fontSize: 13, color: '#96aed2', fontFamily: 'Arial, sans-serif' }}>{t('addCustomStatus')}</span>
            </button>
          </div>
        )}
      </div>

      {/* Löschen Button */}
      <button type="button" onClick={() => setDeleteModal(true)}
        style={{ width: '100%', padding: '13px', borderRadius: 50, border: '1px solid #fecaca', background: 'var(--ds-surface)', color: '#dc2626', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Arial, sans-serif' }}>
        {t('deleteAsset')}
      </button>

      {/* Overlay zum Schließen */}
      {open && <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />}

      {/* Delete Modal */}
      {deleteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100, padding: '0 16px 32px' }}>
          <div style={{ background: 'var(--ds-surface)', borderRadius: 20, padding: 24, width: '100%', maxWidth: 420, fontFamily: 'Arial, sans-serif' }}>
            <div style={{ marginBottom: 12, textAlign: 'center', display: 'flex', justifyContent: 'center' }}><Trash2 size={32} style={{ color: '#E74C3C' }} /></div>
            <p style={{ fontWeight: 700, fontSize: 16, color: '#dc2626', margin: '0 0 8px', textAlign: 'center' }}>{t('deleteTitle')}</p>
            <p style={{ color: '#666', fontSize: 14, margin: '0 0 8px', textAlign: 'center', lineHeight: 1.5 }}>
              {t('deleteDesc')}
            </p>
            <p style={{ color: '#dc2626', fontSize: 13, fontWeight: 700, margin: '0 0 20px', textAlign: 'center' }}>{t('deleteWarning')}</p>
            {deleteError && (
              <p style={{ color: '#dc2626', fontSize: 13, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', margin: '0 0 12px', textAlign: 'center' }}>
                {deleteError}
              </p>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDeleteModal(false)} style={{ flex: 1, padding: '13px', borderRadius: 50, border: '1px solid var(--ds-border)', background: 'var(--ds-surface)', color: '#666', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                {tc('cancel')}
              </button>
              <button onClick={handleDelete} disabled={loading} style={{ flex: 1, padding: '13px', borderRadius: 50, border: 'none', background: '#dc2626', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                {loading ? '…' : t('deleteConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
