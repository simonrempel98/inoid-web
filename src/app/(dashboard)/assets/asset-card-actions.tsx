'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTranslations } from 'next-intl'

type Props = {
  assetId: string
  assetTitle: string
  organizationId: string
  technicalData: unknown
  commercialData: unknown
  articleNumber: string | null
  orderNumber: string | null
  category: string | null
  manufacturer: string | null
  location: string | null
  description: string | null
  status: string
}

export function AssetCardActions(props: Props) {
  const t = useTranslations('assets.cardActions')
  const router = useRouter()
  const supabase = createClient()
  const [duplicating, setDuplicating] = useState(false)

  async function handleDuplicate(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDuplicating(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const newId = crypto.randomUUID()

      const { data, error } = await supabase
        .from('assets')
        .insert({
          id: newId,
          organization_id: props.organizationId,
          title: `${props.assetTitle} (Kopie)`,
          article_number: props.articleNumber,
          serial_number: null,
          order_number: props.orderNumber,
          category: props.category,
          manufacturer: props.manufacturer,
          location: props.location,
          description: props.description,
          status: props.status,
          technical_data: props.technicalData,
          commercial_data: props.commercialData,
          qr_code: `https://inoid.app/assets/${newId}`,
          created_by: user.id,
        })
        .select('id')
        .single()
      if (!error && data) {
        router.push(`/assets/${data.id}/bearbeiten`)
        router.refresh()
      }
    } finally {
      setDuplicating(false)
    }
  }

  function handleEdit(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/assets/${props.assetId}/bearbeiten`)
  }

  const btnStyle: React.CSSProperties = {
    width: 32, height: 32, borderRadius: 8,
    border: '1px solid #c8d4e8', background: 'white',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', flexShrink: 0,
  }

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {/* Duplizieren */}
      <button
        type="button"
        title={t('duplicateTitle')}
        onClick={handleDuplicate}
        disabled={duplicating}
        style={{ ...btnStyle, opacity: duplicating ? 0.5 : 1 }}
      >
        {duplicating ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#96aed2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#96aed2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        )}
      </button>

      {/* Bearbeiten */}
      <button
        type="button"
        title={t('editTitle')}
        onClick={handleEdit}
        style={btnStyle}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#96aed2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>

      {/* Pfeil zur Detail-Seite */}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="#96aed2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </div>
  )
}
