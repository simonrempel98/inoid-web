'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { completeProfile } from './actions'

export function CompleteForm({ email, orgName, defaultName }: {
  email: string
  orgName: string
  defaultName: string
}) {
  const router = useRouter()
  const [fullName, setFullName] = useState(defaultName)
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== passwordConfirm) {
      setError('Passwörter stimmen nicht überein.')
      return
    }
    if (password.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen haben.')
      return
    }
    setLoading(true)
    setError(null)

    const result = await completeProfile(fullName.trim(), password)
    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }
    router.push('/assets')
  }

  return (
    <div style={{ width: '100%', maxWidth: 380 }}>
      {/* Org-Badge */}
      <div style={{
        background: '#003366', borderRadius: 14, padding: '16px 20px',
        marginBottom: 24, textAlign: 'center', color: 'white',
      }}>
        <p style={{ fontSize: 12, opacity: 0.7, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Du wurdest eingeladen von
        </p>
        <p style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{orgName}</p>
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1A1A1A', margin: '0 0 6px' }}>
        Konto einrichten
      </h1>
      <p style={{ fontSize: 14, color: '#666', margin: '0 0 24px' }}>
        Lege dein Passwort fest und bestätige deinen Namen.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 16 }}>
          {/* E-Mail (read-only) */}
          <div style={{ padding: '13px 16px', borderBottom: '1px solid #f0f0f0' }}>
            <p style={{ fontSize: 11, color: '#aaa', margin: '0 0 3px', fontWeight: 700, textTransform: 'uppercase' }}>E-Mail</p>
            <p style={{ fontSize: 14, color: '#666', margin: 0 }}>{email}</p>
          </div>

          {/* Name */}
          <div style={{ padding: '13px 16px', borderBottom: '1px solid #f0f0f0' }}>
            <label style={{ display: 'block', fontSize: 11, color: '#aaa', margin: '0 0 3px', fontWeight: 700, textTransform: 'uppercase' }}>
              Vollständiger Name
            </label>
            <input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Max Mustermann"
              required
              style={{ width: '100%', outline: 'none', border: 'none', fontSize: 15, fontFamily: 'Arial, sans-serif', background: 'transparent' }}
            />
          </div>

          {/* Passwort */}
          <div style={{ padding: '13px 16px', borderBottom: '1px solid #f0f0f0' }}>
            <label style={{ display: 'block', fontSize: 11, color: '#aaa', margin: '0 0 3px', fontWeight: 700, textTransform: 'uppercase' }}>
              Passwort wählen
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mindestens 8 Zeichen"
              required
              style={{ width: '100%', outline: 'none', border: 'none', fontSize: 15, fontFamily: 'Arial, sans-serif', background: 'transparent' }}
            />
          </div>

          {/* Passwort bestätigen */}
          <div style={{ padding: '13px 16px' }}>
            <label style={{ display: 'block', fontSize: 11, color: '#aaa', margin: '0 0 3px', fontWeight: 700, textTransform: 'uppercase' }}>
              Passwort bestätigen
            </label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={e => setPasswordConfirm(e.target.value)}
              placeholder="••••••••"
              required
              style={{ width: '100%', outline: 'none', border: 'none', fontSize: 15, fontFamily: 'Arial, sans-serif', background: 'transparent' }}
            />
          </div>
        </div>

        {error && (
          <p style={{ fontSize: 13, color: '#E74C3C', textAlign: 'center', margin: '0 0 16px' }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !password || !fullName.trim()}
          style={{
            width: '100%', background: '#003366', color: 'white',
            border: 'none', borderRadius: 50, padding: '15px',
            fontSize: 15, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'Arial, sans-serif',
            opacity: loading || !password || !fullName.trim() ? 0.5 : 1,
          }}
        >
          {loading ? 'Wird eingerichtet…' : 'Konto einrichten & loslegen'}
        </button>
      </form>
    </div>
  )
}
