'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function UserAdminActions({
  userId,
  isActive,
  mustChangePassword,
}: {
  userId: string
  isActive: boolean
  mustChangePassword: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function action(type: string, body?: object) {
    setLoading(type)
    setError(null)
    setSuccess(null)
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: type, ...body }),
    })
    const data = await res.json()
    setLoading(null)
    if (!res.ok) { setError(data.error ?? 'Fehler'); return }
    setSuccess(data.message ?? 'Gespeichert')
    router.refresh()
  }

  const btnBase: React.CSSProperties = {
    padding: '10px 18px', borderRadius: 50, fontSize: 13, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'Arial, sans-serif', border: 'none',
  }

  return (
    <div style={{ background: 'var(--adm-surface)', borderRadius: 14, border: '1px solid var(--adm-border)', padding: '20px' }}>
      <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--adm-text3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 16px' }}>
        Admin-Aktionen
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="Neues Passwort (min. 8 Zeichen)"
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 8,
              border: '1px solid var(--adm-border2)', background: 'var(--adm-input-bg)', color: 'var(--adm-text)',
              fontSize: 13, fontFamily: 'Arial, sans-serif', outline: 'none',
            }}
          />
          <button
            onClick={() => {
              if (newPassword.length < 8) { setError('Passwort zu kurz'); return }
              action('reset_password', { newPassword })
            }}
            disabled={loading === 'reset_password'}
            style={{ ...btnBase, background: '#003366', color: 'white' }}
          >
            {loading === 'reset_password' ? '…' : 'PW setzen'}
          </button>
        </div>

        {!mustChangePassword && (
          <button
            onClick={() => action('force_pw_change')}
            disabled={!!loading}
            style={{ ...btnBase, background: 'var(--adm-border2)', color: 'var(--adm-text5)', alignSelf: 'flex-start' }}
          >
            {loading === 'force_pw_change' ? '…' : 'PW-Änderung erzwingen'}
          </button>
        )}

        <button
          onClick={() => action(isActive ? 'deactivate' : 'activate')}
          disabled={!!loading}
          style={{
            ...btnBase,
            background: isActive ? '#7f1d1d' : '#064e3b',
            color: isActive ? '#fca5a5' : '#6ee7b7',
            alignSelf: 'flex-start',
          }}
        >
          {loading === 'deactivate' || loading === 'activate' ? '…' : isActive ? 'Nutzer sperren' : 'Nutzer entsperren'}
        </button>
      </div>

      {error && <p style={{ color: '#f87171', fontSize: 13, margin: '12px 0 0' }}>{error}</p>}
      {success && <p style={{ color: '#34d399', fontSize: 13, margin: '12px 0 0' }}>{success} ✓</p>}
    </div>
  )
}
