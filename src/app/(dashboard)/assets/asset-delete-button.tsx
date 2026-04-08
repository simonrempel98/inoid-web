'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'

export function AssetDeleteButton({ assetId }: { assetId: string }) {
  const t = useTranslations()
  const router = useRouter()
  const supabase = createClient()
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setLoading(true)
    await supabase.from('assets').update({ deleted_at: new Date().toISOString() }).eq('id', assetId)
    router.refresh()
  }

  if (!confirm) {
    return (
      <button type="button"
        onClick={e => { e.preventDefault(); e.stopPropagation(); setConfirm(true) }}
        title={t('common.delete')}
        style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          border: '1px solid #fecaca', background: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          <path d="M10 11v6M14 11v6"/>
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
        </svg>
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}
      onClick={e => { e.preventDefault(); e.stopPropagation() }}>
      <button type="button" onClick={e => { e.stopPropagation(); setConfirm(false) }}
        style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid #c8d4e8', background: 'white', color: '#666', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
        {t('common.no')}
      </button>
      <button type="button" onClick={handleDelete} disabled={loading}
        style={{ padding: '4px 10px', borderRadius: 8, border: 'none', background: '#dc2626', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
        {loading ? '…' : t('common.delete')}
      </button>
    </div>
  )
}
