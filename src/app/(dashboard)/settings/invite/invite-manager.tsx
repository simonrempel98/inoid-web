'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Mail, Copy, Check, Trash2, Clock } from 'lucide-react'

type Invitation = {
  id: string
  email: string
  invitation_token: string | null
  invitation_expires_at: string | null
  invitation_accepted_at: string | null
  created_at: string
}

function randomToken() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let token = ''
  for (let i = 0; i < 32; i++) token += chars[Math.floor(Math.random() * chars.length)]
  return token
}

function isExpired(inv: Invitation) {
  if (inv.invitation_accepted_at) return false
  if (!inv.invitation_expires_at) return false
  return new Date(inv.invitation_expires_at) < new Date()
}

export function InviteManager({ organizationId, invitations }: { organizationId: string; invitations: Invitation[] }) {
  const t = useTranslations('settings.invite')
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.inoid.app'
  const inviteLink = (token: string) => `${origin}/invite/${token}`

  function getTimeLeft(inv: Invitation): string {
    if (inv.invitation_accepted_at) return t('accepted')
    if (!inv.invitation_expires_at) return ''
    const diff = new Date(inv.invitation_expires_at).getTime() - Date.now()
    if (diff <= 0) return t('expired')
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    return t('timeLeft', { h, m })
  }

  const copyLink = async (token: string) => {
    await navigator.clipboard.writeText(inviteLink(token))
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
  }

  const sendInvite = async () => {
    if (!email.trim()) return
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const token = randomToken()
    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()

    const { data: existing } = await supabase
      .from('organization_members')
      .select('id, invitation_accepted_at')
      .eq('organization_id', organizationId)
      .eq('email', email.trim())
      .single()

    if (existing?.invitation_accepted_at) {
      setError(t('alreadyMember'))
      setLoading(false)
      return
    }

    const { data: roles } = await supabase
      .from('roles')
      .select('id')
      .eq('organization_id', organizationId)
      .limit(1)

    if (!roles || roles.length === 0) {
      setError(t('noRole'))
      setLoading(false)
      return
    }

    if (existing) {
      await supabase
        .from('organization_members')
        .update({ invitation_token: token, invitation_expires_at: expiresAt })
        .eq('id', existing.id)
    } else {
      const { error: insertError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: organizationId,
          email: email.trim(),
          role_id: roles[0].id,
          invitation_token: token,
          invitation_expires_at: expiresAt,
        })

      if (insertError) {
        setError(t('inviteError'))
        setLoading(false)
        return
      }
    }

    setEmail('')
    setLoading(false)
    router.refresh()
  }

  const deleteInvite = async (id: string) => {
    const supabase = createClient()
    await supabase.from('organization_members').delete().eq('id', id)
    router.refresh()
  }

  const accepted = invitations.filter(i => i.invitation_accepted_at)
  const pending = invitations.filter(i => !i.invitation_accepted_at)

  return (
    <div>
      {/* Input */}
      <div style={{
        background: 'var(--ds-surface)', borderRadius: 14, border: '1px solid var(--ds-border)',
        padding: '14px 16px', marginBottom: 24,
      }}>
        <label style={{ display: 'block', fontSize: 11, color: '#666', marginBottom: 6, fontFamily: 'Arial, sans-serif' }}>
          {t('emailLabel')}
        </label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendInvite()}
            placeholder="name@firma.de"
            style={{
              flex: 1, outline: 'none', border: 'none', fontSize: 15,
              fontFamily: 'Arial, sans-serif', background: 'transparent', color: 'var(--ds-text)',
            }}
          />
          <button
            onClick={sendInvite}
            disabled={loading || !email.trim()}
            style={{
              background: '#003366', color: 'white', border: 'none', borderRadius: 8,
              padding: '8px 16px', fontSize: 13, cursor: 'pointer', fontWeight: 600,
              fontFamily: 'Arial, sans-serif', opacity: loading || !email.trim() ? 0.5 : 1,
              display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
            }}
          >
            <Mail size={14} />
            {t('create')}
          </button>
        </div>
        {error && <p style={{ color: '#E74C3C', fontSize: 13, marginTop: 8, margin: '8px 0 0' }}>{error}</p>}
      </div>

      {/* Pending invitations */}
      {pending.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <p style={{
            fontSize: 11, fontWeight: 700, color: '#666666',
            textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px 4px',
          }}>
            {t('pending')}
          </p>
          <div style={{ background: 'var(--ds-surface)', borderRadius: 14, border: '1px solid var(--ds-border)', overflow: 'hidden' }}>
            {pending.map((inv, i) => (
              <div key={inv.id}>
                {i > 0 && <div style={{ height: 1, background: '#c8d4e8', margin: '0 16px' }} />}
                <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 600, color: 'var(--ds-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {inv.email}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, color: isExpired(inv) ? '#E74C3C' : '#0099cc' }}>
                      <Clock size={11} /> {getTimeLeft(inv)}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {inv.invitation_token && !isExpired(inv) && (
                      <button
                        onClick={() => copyLink(inv.invitation_token!)}
                        style={{
                          background: copied === inv.invitation_token ? '#f0fff4' : '#f5f8fc',
                          border: '1px solid var(--ds-border)', borderRadius: 7, padding: '6px 10px',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                          fontSize: 12, color: copied === inv.invitation_token ? '#27AE60' : '#003366',
                          fontFamily: 'Arial, sans-serif',
                        }}
                      >
                        {copied === inv.invitation_token ? <Check size={13} /> : <Copy size={13} />}
                        {copied === inv.invitation_token ? t('copied') : t('copyLink')}
                      </button>
                    )}
                    <button
                      onClick={() => deleteInvite(inv.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#c0ccda', display: 'flex' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accepted members */}
      {accepted.length > 0 && (
        <div>
          <p style={{
            fontSize: 11, fontWeight: 700, color: '#666666',
            textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px 4px',
          }}>
            {t('members')}
          </p>
          <div style={{ background: 'var(--ds-surface)', borderRadius: 14, border: '1px solid var(--ds-border)', overflow: 'hidden' }}>
            {accepted.map((inv, i) => (
              <div key={inv.id}>
                {i > 0 && <div style={{ height: 1, background: '#c8d4e8', margin: '0 16px' }} />}
                <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%', background: '#e8eef6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700, color: '#003366',
                  }}>
                    {inv.email[0].toUpperCase()}
                  </div>
                  <div>
                    <p style={{ margin: '0 0 1px', fontSize: 14, color: 'var(--ds-text)' }}>{inv.email}</p>
                    <p style={{ margin: 0, fontSize: 11, color: '#27AE60' }}>{t('active')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {invitations.length === 0 && (
        <p style={{ textAlign: 'center', color: '#aaa', fontSize: 13, marginTop: 16 }}>
          {t('noMembers')}
        </p>
      )}
    </div>
  )
}
