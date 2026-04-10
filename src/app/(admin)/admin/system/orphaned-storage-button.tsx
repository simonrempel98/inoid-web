'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminPinModal } from '@/components/admin/admin-pin-modal'

export function OrphanedStorageButton({ count, totalBytes }: {
  count: number
  totalBytes: number
}) {
  const router = useRouter()
  const [showPin, setShowPin] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [done, setDone]         = useState(false)

  function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  async function handleConfirm() {
    setShowPin(false)
    setLoading(true)
    const res = await fetch('/api/admin/storage/orphaned', { method: 'DELETE' })
    setLoading(false)
    if (res.ok) {
      setDone(true)
      router.refresh()
    }
  }

  if (done) {
    return <span style={{ fontSize: 12, color: '#4ade80', fontWeight: 700 }}>✓ Bereinigt</span>
  }

  return (
    <>
      <button
        onClick={() => setShowPin(true)}
        disabled={loading}
        style={{
          fontSize: 12, fontWeight: 700, color: '#fbbf24',
          background: 'transparent', border: '1px solid #92400e',
          borderRadius: 8, padding: '6px 14px', cursor: loading ? 'default' : 'pointer',
          fontFamily: 'Arial, sans-serif', flexShrink: 0,
        }}
      >
        {loading ? 'Löscht…' : `${count} Datei${count !== 1 ? 'en' : ''} löschen (${formatBytes(totalBytes)})`}
      </button>

      {showPin && (
        <AdminPinModal
          title="Verwaiste Dateien löschen"
          description={`${count} Datei${count !== 1 ? 'en' : ''} (${formatBytes(totalBytes)}) werden unwiderruflich aus dem Storage entfernt.`}
          onConfirm={handleConfirm}
          onCancel={() => setShowPin(false)}
        />
      )}
    </>
  )
}
