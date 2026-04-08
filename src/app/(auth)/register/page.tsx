'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Turnstile } from '@marsidev/react-turnstile'

type Step = 1 | 2 | 3 | 4

const PLANS = [
  { id: 'free', name: 'Free', price: '0 €', assets: '20 Assets' },
  { id: 'starter', name: 'Starter', price: '300 €/Jahr', assets: '100 Assets' },
  { id: 'professional', name: 'Professional', price: '500 €/Jahr', assets: '500 Assets' },
  { id: 'enterprise', name: 'Enterprise', price: '800 €/Jahr', assets: '1.000 Assets' },
]

const INDUSTRIES = [
  'Öl & Gas', 'Bergbau', 'Maschinenbau', 'Automobilindustrie',
  'Luft- und Raumfahrt', 'Chemie', 'Energie', 'Baugewerbe', 'Sonstiges',
]

export default function RegisterPage() {
  const t = useTranslations('registerPage')
  const locale = useLocale()
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const captchaEnabled = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', passwordConfirm: '',
    companyName: '', industry: '', country: '', zip: '',
    plan: 'free',
  })

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit() {
    if (form.password !== form.passwordConfirm) {
      setError(t('mismatch'))
      return
    }
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        captchaToken: captchaToken ?? undefined,
        data: {
          full_name: `${form.firstName} ${form.lastName}`,
          organization_name: form.companyName,
          plan: form.plan,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setStep(4)
    setLoading(false)
  }

  return (
    <div className="w-full max-w-sm">
      {/* Progress */}
      {step < 4 && (
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? 'bg-[#1B4F72]' : 'bg-gray-200'}`} />
          ))}
        </div>
      )}

      {/* Step 1 */}
      {step === 1 && (
        <>
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-1">{t('title')}</h1>
          <p className="text-gray-500 text-sm mb-6">{t('step1')}</p>

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
            <div className="px-4 py-3.5">
              <label className="block text-xs text-gray-500 mb-1">{t('firstName')}</label>
              <input value={form.firstName} onChange={e => update('firstName', e.target.value)}
                placeholder="Max" className="w-full outline-none text-base bg-transparent" />
            </div>
            <div className="h-px bg-gray-100" />
            <div className="px-4 py-3.5">
              <label className="block text-xs text-gray-500 mb-1">{t('lastName')}</label>
              <input value={form.lastName} onChange={e => update('lastName', e.target.value)}
                placeholder="Mustermann" className="w-full outline-none text-base bg-transparent" />
            </div>
            <div className="h-px bg-gray-100" />
            <div className="px-4 py-3.5">
              <label className="block text-xs text-gray-500 mb-1">{t('email')}</label>
              <input type="email" value={form.email} onChange={e => update('email', e.target.value)}
                placeholder="max@firma.de" className="w-full outline-none text-base bg-transparent" />
            </div>
            <div className="h-px bg-gray-100" />
            <div className="px-4 py-3.5">
              <label className="block text-xs text-gray-500 mb-1">{t('password')}</label>
              <input type="password" value={form.password} onChange={e => update('password', e.target.value)}
                placeholder={t('passwordPlaceholder')} className="w-full outline-none text-base bg-transparent" />
            </div>
            <div className="h-px bg-gray-100" />
            <div className="px-4 py-3.5">
              <label className="block text-xs text-gray-500 mb-1">{t('passwordConfirm')}</label>
              <input type="password" value={form.passwordConfirm} onChange={e => update('passwordConfirm', e.target.value)}
                placeholder="••••••••" className="w-full outline-none text-base bg-transparent" />
            </div>
          </div>

          <button onClick={() => setStep(2)}
            disabled={!form.firstName || !form.email || !form.password}
            className="w-full bg-[#1B4F72] text-white py-3.5 rounded-full font-semibold
              hover:bg-[#2E86C1] transition-colors disabled:opacity-60">
            {t('next')}
          </button>
        </>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <>
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-1">{t('companyTitle')}</h1>
          <p className="text-gray-500 text-sm mb-6">{t('step2')}</p>

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
            <div className="px-4 py-3.5">
              <label className="block text-xs text-gray-500 mb-1">{t('companyName')}</label>
              <input value={form.companyName} onChange={e => update('companyName', e.target.value)}
                placeholder="Musterfirma GmbH" className="w-full outline-none text-base bg-transparent" />
            </div>
            <div className="h-px bg-gray-100" />
            <div className="px-4 py-3.5">
              <label className="block text-xs text-gray-500 mb-1">{t('industry')}</label>
              <select value={form.industry} onChange={e => update('industry', e.target.value)}
                className="w-full outline-none text-base bg-transparent text-[#1A1A1A]">
                <option value="">{t('industryPlaceholder')}</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="px-4 py-3.5">
              <label className="block text-xs text-gray-500 mb-1">{t('country')}</label>
              <input value={form.country} onChange={e => update('country', e.target.value)}
                placeholder="Deutschland" className="w-full outline-none text-base bg-transparent" />
            </div>
            <div className="h-px bg-gray-100" />
            <div className="px-4 py-3.5">
              <label className="block text-xs text-gray-500 mb-1">{t('zip')}</label>
              <input value={form.zip} onChange={e => update('zip', e.target.value)}
                placeholder="12345" className="w-full outline-none text-base bg-transparent" />
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)}
              className="flex-1 py-3.5 rounded-full font-semibold border-2 border-[#1B4F72] text-[#1B4F72]
                hover:bg-[#1B4F72] hover:text-white transition-colors">
              {t('back')}
            </button>
            <button onClick={() => setStep(3)}
              disabled={!form.companyName}
              className="flex-1 bg-[#1B4F72] text-white py-3.5 rounded-full font-semibold
                hover:bg-[#2E86C1] transition-colors disabled:opacity-60">
              {t('next')}
            </button>
          </div>
        </>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <>
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-1">{t('planTitle')}</h1>
          <p className="text-gray-500 text-sm mb-6">{t('step3')}</p>

          <div className="space-y-3 mb-4">
            {PLANS.map(plan => (
              <button key={plan.id} onClick={() => update('plan', plan.id)}
                className={`w-full text-left bg-white rounded-2xl p-4 shadow-sm border-2 transition-colors ${
                  form.plan === plan.id ? 'border-[#1B4F72]' : 'border-transparent'
                }`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-[#1A1A1A]">{plan.name}</span>
                  <span className="font-bold text-[#1B4F72]">{plan.price}</span>
                </div>
                <p className="text-xs text-gray-500">{plan.assets}</p>
              </button>
            ))}
          </div>

          {error && <p className="text-red-500 text-sm text-center mb-3">{error}</p>}

          {captchaEnabled && (
            <div className="mb-4">
              <Turnstile
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                onSuccess={setCaptchaToken}
                onExpire={() => setCaptchaToken(null)}
                options={{ theme: 'light', language: locale }}
              />
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(2)}
              className="flex-1 py-3.5 rounded-full font-semibold border-2 border-[#1B4F72] text-[#1B4F72]
                hover:bg-[#1B4F72] hover:text-white transition-colors">
              {t('back')}
            </button>
            <button onClick={handleSubmit} disabled={loading || (captchaEnabled && !captchaToken)}
              className="flex-1 bg-[#1B4F72] text-white py-3.5 rounded-full font-semibold
                hover:bg-[#2E86C1] transition-colors disabled:opacity-60">
              {loading ? t('creating') : t('createAccount')}
            </button>
          </div>
        </>
      )}

      {/* Step 4: Verify */}
      {step === 4 && (
        <div className="text-center">
          <div className="w-16 h-16 bg-[#1B4F72] rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-3">{t('verifyTitle')}</h1>
          <p className="text-gray-500 mb-2">{t('verifySent')}</p>
          <p className="font-semibold text-[#1B4F72] mb-4">{form.email}</p>
          <p className="text-gray-500 text-sm mb-6">{t('verifyClick')}</p>
          <Link href="/login" className="inline-block text-[#1B4F72] text-sm font-semibold hover:underline">
            {t('backToLogin')}
          </Link>
        </div>
      )}

      {step < 4 && (
        <p className="text-center text-sm text-gray-500 mt-4">
          {t('alreadyRegistered')}{' '}
          <Link href="/login" className="text-[#1B4F72] font-semibold">{t('loginLink')}</Link>
        </p>
      )}
    </div>
  )
}
