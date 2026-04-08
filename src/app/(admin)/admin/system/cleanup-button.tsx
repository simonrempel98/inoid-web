'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function CleanupButton({ count }: { count: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function handleCleanup() {
    if (!confirm(`${count} soft-gelöschte Assets unwiderruflich bereinigen? Alle zugehörigen Daten (Wartung, Service, Dokumente, Kosten) werden ebenfalls gelöscht.`)) return
    setLoading(true)
    const res = await fetch('/api/admin/cleanup', { method: 'POST' })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setResult(`Fehler: ${data.error}`); return }
    setResult(`✓ ${data.assetsDeleted} Assets + ${data.filesDeleted} Dateien bereinigt`)
    router.refresh()
  }

  if (result) {
    return <span style={{ fontSize: 13, color: '#34d399', fontWeight: 700 }}>{result}</span>
  }

  return (
    <button
      onClick={handleCleanup}
      disabled={loading}
      style={{
        background: loading ? '#374151' : '#dc2626', color: 'white',
        padding: '10px 18px', borderRadius: 50, border: 'none',
        fontSize: 13, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
        fontFamily: 'Arial, sans-serif', whiteSpace: 'nowrap', flexShrink: 0,
      }}
    >
      {loading ? 'Bereinige…' : 'Jetzt bereinigen'}
    </button>
  )
}
