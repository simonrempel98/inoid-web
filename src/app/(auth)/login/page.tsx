'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Turnstile } from '@marsidev/react-turnstile'

function LoginForm() {
  const t = useTranslations('loginPage')
  const locale = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const captchaEnabled = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (captchaEnabled && !captchaToken) return
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email, password,
      options: { captchaToken },
    })

    if (error) {
      setError(t('error'))
      setCaptchaToken(null)
      setLoading(false)
      return
    }

    // Prüfen ob Passwort-Änderung erzwungen wird
    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('must_change_password')
        .eq('id', data.user.id)
        .single()

      if (profile?.must_change_password) {
        router.push('/passwort-aendern')
        router.refresh()
        return
      }
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
        {t('title')}
      </h1>

      <form onSubmit={handleLogin}>
        <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ padding: '14px 16px' }}>
            <label style={labelStyle}>{t('emailLabel')}</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="name@firma.de" required style={inputStyle} />
          </div>
          <div style={{ height: 1, background: '#c8d4e8' }} />
          <div style={{ padding: '14px 16px' }}>
            <label style={labelStyle}>{t('passwordLabel')}</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required style={inputStyle} />
          </div>
        </div>

        {error && <p style={{ color: '#E74C3C', fontSize: 14, textAlign: 'center', marginBottom: 12 }}>{error}</p>}

        <div style={{ textAlign: 'right', marginBottom: 16 }}>
          <Link href="/forgot-password" style={{ fontSize: 14, color: '#0099cc', textDecoration: 'none' }}>
            {t('forgotPassword')}
          </Link>
        </div>

        {captchaEnabled && (
          <div style={{ marginBottom: 16 }}>
            <Turnstile
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
              onSuccess={setCaptchaToken}
              onExpire={() => setCaptchaToken(null)}
              options={{ theme: 'light', language: locale }}
            />
          </div>
        )}

        <button type="submit" disabled={loading || (captchaEnabled && !captchaToken)} style={{
          width: '100%', background: '#003366', color: 'white',
          padding: '14px 0', borderRadius: 50, border: 'none',
          fontWeight: 700, fontSize: 16, cursor: 'pointer',
          fontFamily: 'Arial, sans-serif',
          opacity: loading || (captchaEnabled && !captchaToken) ? 0.6 : 1,
        }}>
          {loading ? t('loading') : t('submit')}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#96aed2' }}>
        Noch kein Account?{' '}
        <a href="mailto:srl@inometa.de" style={{ color: '#0099cc', textDecoration: 'none', fontWeight: 600 }}>
          srl@inometa.de
        </a>
      </p>

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
