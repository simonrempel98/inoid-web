'use client'

import { useTranslations } from 'next-intl'

export function PrintButton() {
  const t = useTranslations('invoice')
  return (
    <button
      onClick={() => window.print()}
      style={{
        marginLeft: 'auto', padding: '8px 18px',
        background: '#003366', color: 'white',
        border: 'none', borderRadius: 8, cursor: 'pointer',
        fontSize: 13, fontWeight: 700,
      }}
    >
      {t('print')}
    </button>
  )
}
