'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [invitation, setInvitation] = useState<{ email: string; organization_name?: string } | null>(null)
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function loadInvitation() {
      const supabase = createClient()
      const { data } = await supabase
        .from('organization_members')
        .select('email, organizations(name)')
        .eq('invitation_token', token)
        .is('invitation_accepted_at', null)
        .single()

      if (!data) {
        setNotFound(true)
        return
      }

      setInvitation({
        email: data.email,
        organization_name: (data.organizations as { name: string } | null)?.name,
      })
    }
    loadInvitation()
  }, [token])

  async function handleAccept(e: React.FormEvent) {
    e.preventDefault()
    if (password !== passwordConfirm) {
      setError('Passwörter stimmen nicht überein.')
      return
    }

    setLoading(true)
    setError(null)

    const supabase = createClient()

    // Registrieren oder einloggen
    const { error: signUpError } = await supabase.auth.signUp({
      email: invitation!.email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?invitation_token=${token}`,
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    router.push('/login?message=Bitte+bestätige+deine+E-Mail+Adresse')
  }

  if (notFound) {
    return (
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-3">Einladung nicht gefunden</h1>
        <p className="text-gray-500">Dieser Link ist ungültig oder bereits verwendet.</p>
      </div>
    )
  }

  if (!invitation) {
    return <div className="text-gray-400">Lade Einladung…</div>
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-1">Einladung annehmen</h1>
      <p className="text-gray-500 text-sm mb-2">
        Du wurdest zu <strong>{invitation.organization_name}</strong> eingeladen.
      </p>
      <p className="text-[#1B4F72] text-sm font-semibold mb-6">{invitation.email}</p>

      <form onSubmit={handleAccept}>
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
          <div className="px-4 py-3.5">
            <label className="block text-xs text-gray-500 mb-1">Passwort wählen</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mindestens 8 Zeichen"
              required
              className="w-full outline-none text-base bg-transparent"
            />
          </div>
          <div className="h-px bg-gray-100" />
          <div className="px-4 py-3.5">
            <label className="block text-xs text-gray-500 mb-1">Passwort bestätigen</label>
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
          {loading ? 'Wird verarbeitet…' : 'Konto erstellen & beitreten'}
        </button>
      </form>
    </div>
  )
}
