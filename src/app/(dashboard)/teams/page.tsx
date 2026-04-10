import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { TeamsTree } from './teams-tree'
import { MembersList } from './members-list'
import { getTranslations } from 'next-intl/server'

export default async function TeamsPage() {
  const supabase = await createClient()
  const t = await getTranslations()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user!.id)
    .single()

  const orgId = profile?.organization_id ?? ''

  const { data: org } = await supabase
    .from('organizations').select('features').eq('id', orgId).single()
  const features = (org?.features as Record<string, boolean>) ?? {}
  const showChat = features.teamchat !== false

  const [{ data: teams }, { data: members }] = await Promise.all([
    supabase
      .from('teams')
      .select('id, name, location_id, hall_id, area_id, locations(name), halls(name), areas(name)')
      .eq('organization_id', orgId)
      .order('name'),
    supabase
      .from('profiles')
      .select('id, full_name, email, app_role')
      .eq('organization_id', orgId)
      .order('full_name'),
  ])

  // Team-Zuordnungen laden
  const { data: orgMembers } = await supabase
    .from('organization_members')
    .select('user_id, team_id')
    .eq('organization_id', orgId)

  // team_id in profile-Daten einfügen
  const teamByUser: Record<string, string | null> = {}
  for (const om of orgMembers ?? []) {
    if (om.user_id) teamByUser[om.user_id] = om.team_id ?? null
  }
  const membersWithTeam = (members ?? []).map(m => ({ ...m, team_id: teamByUser[m.id] ?? null }))

  return (
    <div style={{ padding: '24px 16px', fontFamily: 'Arial, sans-serif', maxWidth: 600 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#000000', margin: 0 }}>{t('teams.title')}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {showChat && (
            <Link href="/teams/chat" style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#e8f4fb', color: '#0099cc', borderRadius: 50,
              padding: '9px 18px', textDecoration: 'none', fontSize: 13, fontWeight: 700,
              border: '1px solid #b3d9f0',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Chat
            </Link>
          )}
          <Link href="/teams/neu" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#003366', color: 'white', borderRadius: 50,
            padding: '9px 18px', textDecoration: 'none', fontSize: 13, fontWeight: 700,
          }}>
            {t('teams.newTeam')}
          </Link>
        </div>
      </div>
      <p style={{ fontSize: 13, color: '#666666', margin: '4px 0 24px' }}>
        {t('teams.subtitle')}
      </p>

      <TeamsTree teams={(teams ?? []) as any} />

      <div style={{ marginTop: 32 }}>
        <MembersList
          members={membersWithTeam as any}
          teams={(teams ?? []) as any}
          currentUserId={user!.id}
        />
      </div>
    </div>
  )
}
