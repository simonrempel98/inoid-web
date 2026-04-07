import { createClient } from '@/lib/supabase/server'
import { InviteManager } from './invite-manager'

export default async function InvitePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user!.id)
    .single()

  const orgId = profile?.organization_id ?? ''

  // Load pending invitations
  const { data: invitations } = await supabase
    .from('organization_members')
    .select('id, email, invitation_token, invitation_expires_at, invitation_accepted_at, created_at')
    .eq('organization_id', orgId)
    .not('invitation_token', 'is', null)
    .order('created_at', { ascending: false })

  return (
    <div style={{ padding: '24px 16px', fontFamily: 'Arial, sans-serif', maxWidth: 480 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#000000', marginBottom: 6 }}>
        Einladungen
      </h1>
      <p style={{ fontSize: 13, color: '#666666', marginBottom: 24, margin: '0 0 24px' }}>
        Lade Teammitglieder mit einem 12-Stunden-Code ein.
      </p>

      <InviteManager organizationId={orgId} invitations={invitations ?? []} />
    </div>
  )
}
