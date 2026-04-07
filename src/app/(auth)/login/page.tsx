'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/assets'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('E-Mail oder Passwort falsch.')
      setLoading(false)
      return
    }

    router.push(redirectTo)
    router.refresh()
  }

  const inputStyle = {
    width: '100%',
    outline: 'none',
    fontSize: 16,
    background: 'transparent',
    color: '#000000',
    fontFamily: 'Arial, sans-serif',
  }

  const labelStyle = {
    display: 'block',
    fontSize: 11,
    color: '#666666',
    marginBottom: 4,
    fontFamily: 'Arial, sans-serif',
  }

  return (
    <div style={{ width: '100%', maxWidth: 360, fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#000000', textAlign: 'center', marginBottom: 24 }}>
        Anmelden
      </h1>

      <form onSubmit={handleLogin}>
        <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ padding: '14px 16px' }}>
            <label style={labelStyle}>E-Mail</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="name@firma.de" required style={inputStyle} />
          </div>
          <div style={{ height: 1, background: '#c8d4e8' }} />
          <div style={{ padding: '14px 16px' }}>
            <label style={labelStyle}>Passwort</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required style={inputStyle} />
          </div>
        </div>

        {error && <p style={{ color: '#E74C3C', fontSize: 14, textAlign: 'center', marginBottom: 12 }}>{error}</p>}

        <div style={{ textAlign: 'right', marginBottom: 16 }}>
          <Link href="/forgot-password" style={{ fontSize: 14, color: '#0099cc', textDecoration: 'none' }}>
            Passwort vergessen?
          </Link>
        </div>

        <button type="submit" disabled={loading} style={{
          width: '100%', background: '#003366', color: 'white',
          padding: '14px 0', borderRadius: 50, border: 'none',
          fontWeight: 700, fontSize: 16, cursor: 'pointer',
          fontFamily: 'Arial, sans-serif',
          opacity: loading ? 0.6 : 1,
        }}>
          {loading ? 'Wird angemeldet…' : 'Anmelden'}
        </button>
      </form>

      <div style={{ marginTop: 12 }}>
        <Link href="/register" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '14px 0', borderRadius: 50,
          border: '2px solid #003366', color: '#003366',
          fontWeight: 700, fontSize: 16, textDecoration: 'none',
          fontFamily: 'Arial, sans-serif',
        }}>
          Registrieren
        </Link>
      </div>

    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
