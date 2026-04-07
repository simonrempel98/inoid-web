'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Asset = {
  id: string
  title: string
  article_number: string | null
  serial_number: string | null
  order_number: string | null
  category: string | null
  manufacturer: string | null
  location: string | null
  description: string | null
  status: string
  technical_data: unknown
  commercial_data: unknown
  organization_id: string
}

export function DuplicateButton({ asset }: { asset: Asset }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(false)

  async function handleDuplicate() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const newId = crypto.randomUUID()

      const { data, error } = await supabase
        .from('assets')
        .insert({
          id: newId,
          organization_id: asset.organization_id,
          title: `${asset.title} (Kopie)`,
          article_number: asset.article_number,
          serial_number: null,
          order_number: asset.order_number,
          category: asset.category,
          manufacturer: asset.manufacturer,
          location: asset.location,
          description: asset.description,
          status: asset.status,
          technical_data: asset.technical_data,
          commercial_data: asset.commercial_data,
          qr_code: `https://inoid.app/assets/${newId}`,
          created_by: user.id,
          // Bilder + NFC bewusst nicht kopieren
        })
        .select('id')
        .single()

      if (error || !data) throw error
      router.push(`/assets/${data.id}/bearbeiten`)
      router.refresh()
    } catch {
      // silent – user bleibt auf der Seite
    } finally {
      setLoading(false)
      setConfirm(false)
    }
  }

  if (!confirm) {
    return (
      <button
        type="button"
        onClick={() => setConfirm(true)}
        style={{
          flex: 1, padding: '13px', borderRadius: 50,
          border: '1px solid #c8d4e8', background: 'white',
          color: '#003366', fontSize: 14, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'Arial, sans-serif',
        }}
      >
        Duplizieren
      </button>
    )
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      zIndex: 100, padding: '0 16px 32px',
    }}>
      <div style={{
        background: 'white', borderRadius: 20, padding: 24, width: '100%', maxWidth: 420,
        fontFamily: 'Arial, sans-serif',
      }}>
        <p style={{ fontWeight: 700, fontSize: 16, color: '#000', margin: '0 0 8px' }}>
          Asset duplizieren?
        </p>
        <p style={{ color: '#666', fontSize: 14, margin: '0 0 20px', lineHeight: 1.5 }}>
          Eine Kopie von <strong>„{asset.title}"</strong> wird angelegt. Seriennummer, Fotos, QR-Code und NFC-Tag werden nicht übernommen.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={() => setConfirm(false)}
            style={{
              flex: 1, padding: '13px', borderRadius: 50,
              border: '1px solid #c8d4e8', background: 'white',
              color: '#666', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={handleDuplicate}
            disabled={loading}
            style={{
              flex: 1, padding: '13px', borderRadius: 50,
              border: 'none', background: loading ? '#c8d4e8' : '#003366',
              color: 'white', fontSize: 14, fontWeight: 700,
              cursor: loading ? 'default' : 'pointer',
            }}
          >
            {loading ? 'Wird kopiert…' : 'Ja, duplizieren'}
          </button>
        </div>
      </div>
    </div>
  )
}
