'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function RevokeButton({ userId, userName, isSelf }: { userId: string; userName: string; isSelf: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(false)

  async function handleRevoke() {
    setLoading(true)
    const res = await fetch(`/api/admin/team/${userId}`, { method: 'DELETE' })
    setLoading(false)
    if (res.ok) {
      setConfirm(false)
      router.refresh()
    }
  }

  if (isSelf) {
    return (
      <span style={{ fontSize: 11, color: '#4b5563', fontStyle: 'italic' }}>Du selbst</span>
    )
  }

  if (confirm) {
    return (
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: '#fca5a5' }}>Sicher?</span>
        <button
          onClick={handleRevoke}
          disabled={loading}
          style={{
            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
            background: '#7f1d1d', color: '#fca5a5', border: 'none', cursor: 'pointer',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          {loading ? '…' : 'Ja, entziehen'}
        </button>
        <button
          onClick={() => setConfirm(false)}
          style={{
            fontSize: 11, padding: '3px 8px', borderRadius: 6,
            background: 'transparent', color: '#6b7280', border: '1px solid #374151', cursor: 'pointer',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          Nein
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      style={{
        fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 6,
        background: 'transparent', color: '#ef4444', border: '1px solid #7f1d1d', cursor: 'pointer',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      Zugang entziehen
    </button>
  )
}
