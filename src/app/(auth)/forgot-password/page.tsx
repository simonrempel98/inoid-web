'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const t = useTranslations('forgotPage')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })

    if (error) {
      setError(t('error'))
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 bg-[#27AE60] rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-3">{t('sentTitle')}</h1>
        <p className="text-gray-500 mb-6">
          {t('sentDesc', { email: <strong key="em">{email}</strong> } as any)}
        </p>
        <Link href="/login" className="text-[#1B4F72] font-semibold text-sm hover:underline">
          {t('backToLogin')}
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-1">{t('title')}</h1>
      <p className="text-gray-500 text-sm mb-6">{t('subtitle')}</p>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
          <div className="px-4 py-3.5">
            <label className="block text-xs text-gray-500 mb-1">{t('emailLabel')}</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@firma.de"
              required
              className="w-full outline-none text-base bg-transparent"
            />
          </div>
        </div>

        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

        <button type="submit" disabled={loading || !email}
          className="w-full bg-[#1B4F72] text-white py-3.5 rounded-full font-semibold
            hover:bg-[#2E86C1] transition-colors disabled:opacity-60">
          {loading ? t('loading') : t('submit')}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-4">
        <Link href="/login" className="text-[#1B4F72] font-semibold">{t('backToLogin')}</Link>
      </p>
    </div>
  )
}
