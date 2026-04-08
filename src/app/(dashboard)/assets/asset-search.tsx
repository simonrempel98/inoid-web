'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { useTranslations } from 'next-intl'

export function AssetSearch({ defaultValue }: { defaultValue?: string }) {
  const t = useTranslations('assets')
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    const params = new URLSearchParams(searchParams.toString())
    if (value) { params.set('q', value) } else { params.delete('q') }
    startTransition(() => router.replace(`/assets?${params.toString()}`))
  }

  return (
    <div style={{ position: 'relative' }}>
      <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
        width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="#96aed2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input
        defaultValue={defaultValue}
        onChange={handleSearch}
        placeholder={t('search')}
        style={{
          width: '100%', padding: '10px 12px 10px 38px',
          borderRadius: 10, border: '1px solid #c8d4e8',
          fontSize: 14, fontFamily: 'Arial, sans-serif',
          backgroundColor: 'white', color: '#000',
          outline: 'none', boxSizing: 'border-box',
        }}
      />
    </div>
  )
}
