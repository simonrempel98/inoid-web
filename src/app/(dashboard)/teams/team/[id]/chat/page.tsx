import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChatClient } from './chat-client'

// Immer frisch vom Server laden – nie aus dem Router-Cache bedienen
export const dynamic = 'force-dynamic'

type ChatMessage = {
  id: string
  user_id: string
  sender_name: string
  sender_role: string | null
  content: string
  asset_mentions: string[]
  created_at: string
}

export default async function TeamChatPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: teamId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, full_name, email')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) redirect('/dashboard')

  const orgId = profile.organization_id

  // Feature-Check
  const { data: org } = await supabase
    .from('organizations')
    .select('features')
    .eq('id', orgId)
    .single()

  const features = (org?.features as Record<string, boolean>) ?? {}
  if (features.teamchat === false) redirect(`/teams/team/${teamId}`)

  // Team laden (für Namen im Header)
  const { data: team } = await supabase
    .from('teams')
    .select('id, name')
    .eq('id', teamId)
    .single()

  if (!team) redirect('/teams')

  // Avatar-URLs aller Org-Mitglieder laden
  const { data: profilesWithAvatar } = await (supabase as any)
    .from('profiles')
    .select('id, avatar_url')
    .eq('organization_id', orgId)

  const avatarsByUserId: Record<string, string | null> = {}
  for (const p of profilesWithAvatar ?? []) {
    avatarsByUserId[p.id] = p.avatar_url ?? null
  }

  // Nachrichten laden (letzte 30 Tage, max. 200)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data: messages } = await supabase
    .from('chat_messages')
    .select('id, user_id, sender_name, sender_role, content, asset_mentions, created_at, edited_at')
    .eq('organization_id', orgId)
    .eq('team_id', teamId)
    .gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: true })
    .limit(200)

  return (
    <div className="ds-chat-fullscreen" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px 12px',
        borderBottom: '1px solid #eef1f6',
        background: 'white',
        display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
      }}>
        <Link href={`/teams/team/${teamId}`} style={{ color: '#96aed2', textDecoration: 'none', lineHeight: 1, display: 'flex' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: '#e8f4fb',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0099cc" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#000' }}>{team.name}</p>
            <p style={{ margin: 0, fontSize: 11, color: '#96aed2' }}>@ zum Erwähnen eines Assets · 30 Tage Verlauf</p>
          </div>
        </div>
      </div>

      <ChatClient
        initialMessages={(messages ?? []) as ChatMessage[]}
        currentUserId={user.id}
        orgId={orgId}
        teamId={teamId}
        avatarsByUserId={avatarsByUserId}
      />
    </div>
  )
}
