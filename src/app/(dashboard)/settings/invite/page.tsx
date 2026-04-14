import { createClient } from '@/lib/supabase/server'
import { InviteManager } from './invite-manager'
import { getTranslations } from 'next-intl/server'

export default async function InvitePage() {
  const supabase = await createClient()
  const t = await getTranslations()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user!.id)
    .single()

  const orgId = profile?.organization_id ?? ''

  const { data: invitations } = await supabase
    .from('organization_members')
    .select('id, email, invitation_token, invitation_expires_at, invitation_accepted_at, created_at')
    .eq('organization_id', orgId)
    .not('invitation_token', 'is', null)
    .order('created_at', { ascending: false })

  return (
    <div style={{ padding: '24px 16px', fontFamily: 'Arial, sans-serif', maxWidth: 480 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ds-text)', marginBottom: 6 }}>
        {t('settings.invite.title')}
      </h1>
      <p style={{ fontSize: 13, color: '#666666', margin: '0 0 24px' }}>
        {t('settings.invite.subtitle')}
      </p>

      <InviteManager organizationId={orgId} invitations={invitations ?? []} />
    </div>
  )
}
