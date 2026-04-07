'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export type InviteMemberInput = {
  first_name: string
  last_name: string
  email: string
  role_id: string
}

export type CreateTeamInput = {
  name: string
  department_id?: string
  location_id?: string
  hall_id?: string
  area_id?: string
  members: InviteMemberInput[]
}

export async function createTeamWithMembers(input: CreateTeamInput) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht eingeloggt' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  const orgId = profile?.organization_id
  if (!orgId) return { error: 'Keine Organisation gefunden' }

  // 1. Team erstellen
  const { data: team, error: teamErr } = await supabase
    .from('teams')
    .insert({
      organization_id: orgId,
      department_id: input.department_id || null,
      name: input.name,
      location_id: input.location_id || null,
      hall_id: input.hall_id || null,
      area_id: input.area_id || null,
    })
    .select('id')
    .single()

  if (teamErr || !team) return { error: teamErr?.message ?? 'Team konnte nicht erstellt werden' }

  // 2. Mitglieder einladen
  const results: { email: string; success: boolean; error?: string }[] = []

  for (const member of input.members) {
    if (!member.email.trim()) continue

    try {
      // Prüfen ob bereits Mitglied
      const { data: existing } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', orgId)
        .eq('email', member.email.trim())
        .single()

      if (existing) {
        await supabase.from('organization_members').update({
          team_id: team.id,
          first_name: member.first_name || null,
          last_name: member.last_name || null,
        }).eq('id', existing.id)
        results.push({ email: member.email, success: true })
        continue
      }

      // Neues Mitglied via Supabase Admin Invite einladen (sendet echte E-Mail)
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.inoid.app'
      const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(
        member.email.trim(),
        {
          redirectTo: `${siteUrl}/auth/callback`,
          data: {
            organization_id: orgId,
            team_id: team.id,
            first_name: member.first_name,
            last_name: member.last_name,
          },
        }
      )

      if (inviteErr) {
        results.push({ email: member.email, success: false, error: inviteErr.message })
        continue
      }

      // organization_members Eintrag anlegen
      await supabase.from('organization_members').insert({
        organization_id: orgId,
        user_id: invited.user.id,
        email: member.email.trim(),
        role_id: member.role_id,
        team_id: team.id,
        first_name: member.first_name || null,
        last_name: member.last_name || null,
        invitation_accepted_at: null,
      })

      results.push({ email: member.email, success: true })
    } catch (e: any) {
      results.push({ email: member.email, success: false, error: e.message })
    }
  }

  return { teamId: team.id, results }
}

export async function updateMember(memberId: string, data: {
  first_name?: string
  last_name?: string
  role_id?: string
}) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('organization_members')
    .update(data)
    .eq('id', memberId)
  return { error: error?.message }
}

export async function removeMember(memberId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('organization_members')
    .delete()
    .eq('id', memberId)
  return { error: error?.message }
}

export async function resendInvite(memberId: string) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: member } = await supabase
    .from('organization_members')
    .select('email, user_id')
    .eq('id', memberId)
    .single()

  if (!member) return { error: 'Mitglied nicht gefunden' }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.inoid.app'

  if (member.user_id) {
    // Neues Invite an bestehende Auth-User ID senden
    await admin.auth.admin.inviteUserByEmail(member.email, {
      redirectTo: `${siteUrl}/auth/callback`,
    })
  }

  return { success: true }
}
