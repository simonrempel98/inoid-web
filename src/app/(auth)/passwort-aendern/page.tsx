'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function PasswortAendernPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Die Passwörter stimmen nicht überein.'); return }
    if (password.length < 8) { setError('Mindestens 8 Zeichen erforderlich.'); return }

    setLoading(true)
    setError(null)
    const supabase = createClient()

    const { error: authError } = await supabase.auth.updateUser({ password })
    if (authError) { setError(authError.message); setLoading(false); return }

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({ must_change_password: false }).eq('id', user.id)
    }

    router.push('/dashboard')
    router.refresh()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', outline: 'none', fontSize: 16,
    background: 'transparent', color: '#000',
    fontFamily: 'Arial, sans-serif', border: 'none',
  }

  return (
    <div style={{ width: '100%', maxWidth: 360, fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#000', textAlign: 'center', marginBottom: 6 }}>
        Neues Passwort
      </h1>
      <p style={{ fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 24, lineHeight: 1.5 }}>
        Bitte lege beim ersten Login ein persönliches Passwort fest.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{
          background: 'white', borderRadius: 16,
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          overflow: 'hidden', marginBottom: 16,
        }}>
          <div style={{ padding: '14px 16px' }}>
            <label style={{ display: 'block', fontSize: 11, color: '#666', marginBottom: 4 }}>
              Neues Passwort
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mindestens 8 Zeichen"
              required
              style={inputStyle}
            />
          </div>
          <div style={{ height: 1, background: '#c8d4e8' }} />
          <div style={{ padding: '14px 16px' }}>
            <label style={{ display: 'block', fontSize: 11, color: '#666', marginBottom: 4 }}>
              Passwort bestätigen
            </label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Passwort wiederholen"
              required
              style={inputStyle}
            />
          </div>
        </div>

        {error && (
          <p style={{ color: '#E74C3C', fontSize: 13, textAlign: 'center', marginBottom: 12 }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', background: '#003366', color: 'white',
            padding: '14px 0', borderRadius: 50, border: 'none',
            fontWeight: 700, fontSize: 16,
            cursor: loading ? 'default' : 'pointer',
            fontFamily: 'Arial, sans-serif',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Wird gespeichert…' : 'Passwort speichern & weiter'}
        </button>
      </form>
    </div>
  )
}
