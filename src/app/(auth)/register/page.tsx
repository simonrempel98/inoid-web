'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Step = 1 | 2 | 3 | 4

const PLANS = [
  { id: 'free', name: 'Free', price: '0 €', assets: '20 Assets', features: ['20 Assets', 'QR & NFC Scan', 'Digitales Serviceheft'] },
  { id: 'starter', name: 'Starter', price: '300 €/Jahr', assets: '100 Assets', features: ['100 Assets', 'Dokumentenverwaltung', 'Team bis 5 Personen'] },
  { id: 'professional', name: 'Professional', price: '500 €/Jahr', assets: '500 Assets', features: ['500 Assets', 'API Zugang', 'Unbegrenzte Teammitglieder'] },
  { id: 'enterprise', name: 'Enterprise', price: '800 €/Jahr', assets: '1.000 Assets', features: ['1.000 Assets', 'Dedicated Support', 'Custom Rollen'] },
]

const INDUSTRIES = [
  'Öl & Gas', 'Bergbau', 'Maschinenbau', 'Automobilindustrie',
  'Luft- und Raumfahrt', 'Chemie', 'Energie', 'Baugewerbe', 'Sonstiges',
]

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', passwordConfirm: '',
    companyName: '', industry: '', country: 'Deutschland', zip: '',
    plan: 'free',
  })

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit() {
    if (form.password !== form.passwordConfirm) {
      setError('Passwörter stimmen nicht überein.')
      return
    }
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
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
      {/* Fortschrittsanzeige */}
      {step < 4 && (
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-[#1B4F72]' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      )}

      {/* Schritt 1: Persönliche Daten */}
      {step === 1 && (
        <>
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-1">Account erstellen</h1>
          <p className="text-gray-500 text-sm mb-6">Schritt 1 von 3 – Persönliche Daten</p>

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
            <div className="px-4 py-3.5">
              <label className="block text-xs text-gray-500 mb-1">Vorname</label>
              <input value={form.firstName} onChange={e => update('firstName', e.target.value)}
                placeholder="Max" className="w-full outline-none text-base bg-transparent" />
            </div>
            <div className="h-px bg-gray-100" />
            <div className="px-4 py-3.5">
              <label className="block text-xs text-gray-500 mb-1">Nachname</label>
              <input value={form.lastName} onChange={e => update('lastName', e.target.value)}
                placeholder="Mustermann" className="w-full outline-none text-base bg-transparent" />
            </div>
            <div className="h-px bg-gray-100" />
            <div className="px-4 py-3.5">
              <label className="block text-xs text-gray-500 mb-1">E-Mail</label>
              <input type="email" value={form.email} onChange={e => update('email', e.target.value)}
                placeholder="max@firma.de" className="w-full outline-none text-base bg-transparent" />
            </div>
            <div className="h-px bg-gray-100" />
            <div className="px-4 py-3.5">
              <label className="block text-xs text-gray-500 mb-1">Passwort</label>
              <input type="password" value={form.password} onChange={e => update('password', e.target.value)}
                placeholder="Mindestens 8 Zeichen" className="w-full outline-none text-base bg-transparent" />
            </div>
            <div className="h-px bg-gray-100" />
            <div className="px-4 py-3.5">
              <label className="block text-xs text-gray-500 mb-1">Passwort bestätigen</label>
              <input type="password" value={form.passwordConfirm} onChange={e => update('passwordConfirm', e.target.value)}
                placeholder="••••••••" className="w-full outline-none text-base bg-transparent" />
            </div>
          </div>

          <button onClick={() => setStep(2)}
            disabled={!form.firstName || !form.email || !form.password}
            className="w-full bg-[#1B4F72] text-white py-3.5 rounded-full font-semibold
              hover:bg-[#2E86C1] transition-colors disabled:opacity-60">
            Weiter
          </button>
        </>
      )}

      {/* Schritt 2: Organisation */}
      {step === 2 && (
        <>
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-1">Ihr Unternehmen</h1>
          <p className="text-gray-500 text-sm mb-6">Schritt 2 von 3 – Organisationsdaten</p>

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
            <div className="px-4 py-3.5">
              <label className="block text-xs text-gray-500 mb-1">Firmenname</label>
              <input value={form.companyName} onChange={e => update('companyName', e.target.value)}
                placeholder="Musterfirma GmbH" className="w-full outline-none text-base bg-transparent" />
            </div>
            <div className="h-px bg-gray-100" />
            <div className="px-4 py-3.5">
              <label className="block text-xs text-gray-500 mb-1">Branche</label>
              <select value={form.industry} onChange={e => update('industry', e.target.value)}
                className="w-full outline-none text-base bg-transparent text-[#1A1A1A]">
                <option value="">Bitte wählen…</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="px-4 py-3.5">
              <label className="block text-xs text-gray-500 mb-1">Land</label>
              <input value={form.country} onChange={e => update('country', e.target.value)}
                placeholder="Deutschland" className="w-full outline-none text-base bg-transparent" />
            </div>
            <div className="h-px bg-gray-100" />
            <div className="px-4 py-3.5">
              <label className="block text-xs text-gray-500 mb-1">PLZ</label>
              <input value={form.zip} onChange={e => update('zip', e.target.value)}
                placeholder="12345" className="w-full outline-none text-base bg-transparent" />
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)}
              className="flex-1 py-3.5 rounded-full font-semibold border-2 border-[#1B4F72] text-[#1B4F72]
                hover:bg-[#1B4F72] hover:text-white transition-colors">
              Zurück
            </button>
            <button onClick={() => setStep(3)}
              disabled={!form.companyName}
              className="flex-1 bg-[#1B4F72] text-white py-3.5 rounded-full font-semibold
                hover:bg-[#2E86C1] transition-colors disabled:opacity-60">
              Weiter
            </button>
          </div>
        </>
      )}

      {/* Schritt 3: Plan wählen */}
      {step === 3 && (
        <>
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-1">Plan wählen</h1>
          <p className="text-gray-500 text-sm mb-6">Schritt 3 von 3 – Jederzeit upgraden möglich</p>

          <div className="space-y-3 mb-4">
            {PLANS.map(plan => (
              <button
                key={plan.id}
                onClick={() => update('plan', plan.id)}
                className={`w-full text-left bg-white rounded-2xl p-4 shadow-sm border-2 transition-colors ${
                  form.plan === plan.id ? 'border-[#1B4F72]' : 'border-transparent'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-[#1A1A1A]">{plan.name}</span>
                  <span className="font-bold text-[#1B4F72]">{plan.price}</span>
                </div>
                <p className="text-xs text-gray-500">{plan.assets}</p>
              </button>
            ))}
          </div>

          {error && <p className="text-red-500 text-sm text-center mb-3">{error}</p>}

          <div className="flex gap-3">
            <button onClick={() => setStep(2)}
              className="flex-1 py-3.5 rounded-full font-semibold border-2 border-[#1B4F72] text-[#1B4F72]
                hover:bg-[#1B4F72] hover:text-white transition-colors">
              Zurück
            </button>
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 bg-[#1B4F72] text-white py-3.5 rounded-full font-semibold
                hover:bg-[#2E86C1] transition-colors disabled:opacity-60">
              {loading ? 'Wird erstellt…' : 'Konto erstellen'}
            </button>
          </div>
        </>
      )}

      {/* Schritt 4: E-Mail bestätigen */}
      {step === 4 && (
        <div className="text-center">
          <div className="w-16 h-16 bg-[#1B4F72] rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-3">E-Mail prüfen</h1>
          <p className="text-gray-500 mb-2">
            Wir haben eine Bestätigungs-E-Mail an
          </p>
          <p className="font-semibold text-[#1B4F72] mb-4">{form.email}</p>
          <p className="text-gray-500 text-sm mb-6">
            Klicke auf den Link in der E-Mail um dein Konto zu aktivieren.
          </p>
          <Link href="/login"
            className="inline-block text-[#1B4F72] text-sm font-semibold hover:underline">
            Zurück zur Anmeldung
          </Link>
        </div>
      )}

      {step < 4 && (
        <p className="text-center text-sm text-gray-500 mt-4">
          Bereits registriert?{' '}
          <Link href="/login" className="text-[#1B4F72] font-semibold">Anmelden</Link>
        </p>
      )}
    </div>
  )
}
