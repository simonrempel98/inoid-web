'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const t = useTranslations('resetPage')
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== passwordConfirm) {
      setError(t('mismatch'))
      return
    }
    if (password.length < 8) {
      setError(t('tooShort'))
      return
    }

    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(t('error'))
      setLoading(false)
      return
    }

    router.push('/assets')
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-1">{t('title')}</h1>
      <p className="text-gray-500 text-sm mb-6">{t('subtitle')}</p>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
          <div className="px-4 py-3.5">
            <label className="block text-xs text-gray-500 mb-1">{t('passwordLabel')}</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={t('passwordPlaceholder')}
              required
              className="w-full outline-none text-base bg-transparent"
            />
          </div>
          <div className="h-px bg-gray-100" />
          <div className="px-4 py-3.5">
            <label className="block text-xs text-gray-500 mb-1">{t('confirmLabel')}</label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={e => setPasswordConfirm(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full outline-none text-base bg-transparent"
            />
          </div>
        </div>

        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

        <button type="submit" disabled={loading || !password}
          className="w-full bg-[#1B4F72] text-white py-3.5 rounded-full font-semibold
            hover:bg-[#2E86C1] transition-colors disabled:opacity-60">
          {loading ? t('loading') : t('submit')}
        </button>
      </form>
    </div>
  )
}
