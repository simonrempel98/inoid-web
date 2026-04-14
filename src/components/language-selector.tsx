'use client'

import { useLocale } from 'next-intl'
import { useTransition } from 'react'
import { setLocale } from '@/i18n/actions'
import { LOCALES, LOCALE_NAMES } from '@/i18n/config'

export function LanguageSelector() {
  const locale = useLocale()
  const [isPending, startTransition] = useTransition()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    startTransition(() => {
      setLocale(e.target.value)
    })
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
      <select
        value={locale}
        onChange={handleChange}
        disabled={isPending}
        style={{
          width: '100%',
          padding: '11px 36px 11px 12px',
          borderRadius: 10,
          border: '1px solid var(--ds-border)',
          fontSize: 14,
          fontFamily: 'Arial, sans-serif',
          color: 'var(--ds-text)',
          backgroundColor: 'white',
          outline: 'none',
          cursor: isPending ? 'wait' : 'pointer',
          appearance: 'none',
          WebkitAppearance: 'none',
          opacity: isPending ? 0.6 : 1,
          transition: 'opacity 0.15s',
        }}
      >
        {LOCALES.map(l => (
          <option key={l} value={l}>{LOCALE_NAMES[l]}</option>
        ))}
      </select>
      {/* Pfeil-Icon */}
      <span style={{
        position: 'absolute', right: 12, top: '50%',
        transform: 'translateY(-50%)',
        pointerEvents: 'none', color: '#96aed2',
        display: 'flex', alignItems: 'center',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </span>
    </div>
  )
}
