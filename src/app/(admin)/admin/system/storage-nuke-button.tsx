'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminPinModal } from '@/components/admin/admin-pin-modal'

export function StorageNukeButton() {
  const router = useRouter()
  const [showPin, setShowPin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleNuke() {
    setLoading(true)
    setError(null)
    const res = await fetch('/api/admin/storage/nuke', { method: 'DELETE' })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      throw new Error(data.error ?? 'Fehler beim Löschen')
    }
    const total = Object.values(data.deleted as Record<string, number>).reduce((s, n) => s + n, 0)
    setResult(`✓ ${total} Dateien gelöscht`)
    router.refresh()
  }

  if (result) {
    return <span style={{ fontSize: 13, color: '#34d399', fontWeight: 700 }}>{result}</span>
  }

  return (
    <>
      <button
        onClick={() => setShowPin(true)}
        disabled={loading}
        style={{
          background: loading ? 'var(--adm-border2)' : 'transparent',
          color: '#ef4444',
          padding: '10px 18px', borderRadius: 50,
          border: '1px solid #ef4444',
          fontSize: 13, fontWeight: 700,
          cursor: loading ? 'default' : 'pointer',
          fontFamily: 'Arial, sans-serif', whiteSpace: 'nowrap', flexShrink: 0,
        }}
      >
        {loading ? 'Lösche…' : 'Storage leeren'}
      </button>

      {error && <span style={{ fontSize: 12, color: '#f87171' }}>{error}</span>}

      {showPin && (
        <AdminPinModal
          title="Storage leeren"
          description="Alle Dateien aus asset-images, service-files und org-files werden unwiderruflich gelöscht."
          danger
          onConfirm={async () => {
            setShowPin(false)
            await handleNuke()
          }}
          onCancel={() => setShowPin(false)}
        />
      )}
    </>
  )
}
