'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Turnstile } from '@marsidev/react-turnstile'

function ContactHint() {
  const [open, setOpen] = useState(false)

  return (
    <div
      style={{ textAlign: 'center', marginTop: 20, position: 'relative', display: 'inline-block', width: '100%' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span style={{
        fontSize: 12, color: '#96aed2', cursor: 'default',
        borderBottom: '1px dashed #96aed299',
      }}>
        Noch kein Account?
      </span>

      {/* Hover-Karte */}
      {open && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 10px)', left: '50%',
          transform: 'translateX(-50%)',
          width: 300, zIndex: 50,
          background: 'white', borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,51,102,0.18), 0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid #e8edf5',
          overflow: 'hidden',
          textAlign: 'left',
          animation: 'fadeUp 0.15s ease',
        }}>
          <style>{`
            @keyframes fadeUp {
              from { opacity: 0; transform: translateX(-50%) translateY(6px); }
              to   { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
          `}</style>

          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #003366 0%, #005599 100%)',
            padding: '14px 18px',
          }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'white' }}>Zugang anfragen</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>
              INOid · Asset Management by INOMETA
            </div>
          </div>

          {/* Kontakte */}
          <div style={{ padding: '12px 6px 10px' }}>
            {/* Allgemein */}
            <a href="mailto:info@inometa.de" style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '8px 12px', borderRadius: 10, textDecoration: 'none',
              transition: 'background 0.12s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f0f6ff')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                background: '#e8edf5',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16,
              }}>✉️</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#003366' }}>Allgemeine Anfragen</div>
                <div style={{ fontSize: 11, color: '#0099cc', marginTop: 1 }}>info@inometa.de</div>
              </div>
            </a>

            {/* Vertriebsansprechpartner */}
            <a href="mailto:srl@inometa.de" style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '8px 12px', borderRadius: 10, textDecoration: 'none',
              transition: 'background 0.12s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f0f6ff')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                background: '#003366',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: 13, fontWeight: 800,
              }}>SR</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#003366' }}>Simon Rempel</div>
                <div style={{ fontSize: 10, color: '#96aed2', marginTop: 1 }}>
                  Verantwortlich für digitale Lösungen
                </div>
                <div style={{ fontSize: 11, color: '#0099cc', marginTop: 1 }}>srl@inometa.de</div>
              </div>
            </a>
          </div>

          {/* Footer */}
          <div style={{
            borderTop: '1px solid #e8edf5', padding: '8px 18px',
            fontSize: 10, color: '#96aed2', textAlign: 'center',
          }}>
            Sprechen Sie uns an — wir richten Ihren Zugang ein.
          </div>

          {/* Pfeil nach unten */}
          <div style={{
            position: 'absolute', bottom: -6, left: '50%',
            transform: 'translateX(-50%) rotate(45deg)',
            width: 10, height: 10,
            background: 'white', border: '1px solid #e8edf5',
            borderTop: 'none', borderLeft: 'none',
          }} />
        </div>
      )}
    </div>
  )
}

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

      <ContactHint />

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
