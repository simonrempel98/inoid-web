'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { useTranslations } from 'next-intl'

type Props = {
  categories: string[]
  currentStatus?: string
  currentSort?: string
  currentCategory?: string
  q?: string
}

export function AssetFilters({ categories, currentStatus, currentSort, currentCategory, q }: Props) {
  const t = useTranslations()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) { params.set(key, value) } else { params.delete(key) }
    startTransition(() => router.replace(`/assets?${params.toString()}`))
  }

  const STATUS_OPTIONS = [
    { value: '', label: t('assets.filter.allStatuses') },
    { value: 'active', label: t('assets.status.active') },
    { value: 'in_service', label: t('assets.status.in_service') },
    { value: 'decommissioned', label: t('assets.status.decommissioned') },
  ]

  const SORT_OPTIONS = [
    { value: 'newest', label: '↓ ' + t('common.date') },
    { value: 'oldest', label: '↑ ' + t('common.date') },
    { value: 'title_asc', label: 'A → Z' },
    { value: 'title_desc', label: 'Z → A' },
    { value: 'status', label: t('common.status') },
  ]

  const selectStyle: React.CSSProperties = {
    padding: '8px 12px', borderRadius: 10, border: '1px solid var(--ds-border, #c8d4e8)',
    fontSize: 13, fontFamily: 'Arial, sans-serif',
    backgroundColor: 'var(--ds-input-bg, white)',
    color: 'var(--ds-text, #000)', outline: 'none', cursor: 'pointer', width: '100%',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2396aed2' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    paddingRight: 30,
  }

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 140 }}>
        <select value={currentSort ?? 'newest'} onChange={e => update('sort', e.target.value)} style={selectStyle}>
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div style={{ flex: 1, minWidth: 130 }}>
        <select value={currentStatus ?? ''} onChange={e => update('status', e.target.value)} style={selectStyle}>
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      {categories.length > 0 && (
        <div style={{ flex: 1, minWidth: 130 }}>
          <select value={currentCategory ?? ''} onChange={e => update('cat', e.target.value)} style={selectStyle}>
            <option value="">{t('assets.filter.allCategories')}</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      )}
      {(currentStatus || currentCategory || (currentSort && currentSort !== 'newest')) && (
        <button type="button" onClick={() => {
          const params = new URLSearchParams()
          if (q) params.set('q', q)
          startTransition(() => router.replace(`/assets?${params.toString()}`))
        }} style={{
          padding: '8px 14px', borderRadius: 10, border: '1px solid #fecaca',
          background: 'var(--ds-surface, white)', color: '#dc2626', fontSize: 12, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'Arial, sans-serif', whiteSpace: 'nowrap',
        }}>
          × {t('common.reset')}
        </button>
      )}
    </div>
  )
}
