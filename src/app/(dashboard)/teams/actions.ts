'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { AppRole } from '@/lib/permissions'

export type InviteMemberInput = {
  first_name: string
  last_name: string
  email: string
  role_id: string
  app_role: AppRole
  password: string
}

export type CreateTeamInput = {
  name: string
  department_id?: string
  location_id?: string
  hall_id?: string
  area_id?: string
  members: InviteMemberInput[]
}

async function getOrgId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles').select('organization_id').eq('id', user.id).single()
  return profile?.organization_id ?? null
}

async function getCurrentAppRole(): Promise<AppRole> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'leser'
  const { data: profile } = await supabase
    .from('profiles').select('app_role').eq('id', user.id).single()
  return (profile?.app_role as AppRole) ?? 'leser'
}

export async function createTeamWithMembers(input: CreateTeamInput) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht eingeloggt' }

  const orgId = await getOrgId()
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

  // 2. Mitglieder anlegen
  const results: { email: string; success: boolean; error?: string }[] = []

  for (const member of input.members) {
    if (!member.email.trim() || !member.password) continue

    try {
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

      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: member.email.trim(),
        password: member.password,
        email_confirm: true,
        user_metadata: {
          organization_id: orgId,
          team_id: team.id,
          first_name: member.first_name,
          last_name: member.last_name,
        },
      })

      if (createErr || !created.user) {
        results.push({ email: member.email, success: false, error: createErr?.message ?? 'Fehler' })
        continue
      }

      const fullName = [member.first_name, member.last_name].filter(Boolean).join(' ')
      await admin.from('profiles').insert({
        id: created.user.id,
        organization_id: orgId,
        email: member.email.trim(),
        full_name: fullName,
        preferred_language: 'de',
        is_platform_admin: false,
        app_role: member.app_role ?? 'leser',
      })

      await supabase.from('organization_members').insert({
        organization_id: orgId,
        user_id: created.user.id,
        email: member.email.trim(),
        role_id: member.role_id,
        team_id: team.id,
        first_name: member.first_name || null,
        last_name: member.last_name || null,
        invitation_accepted_at: new Date().toISOString(),
      })

      results.push({ email: member.email, success: true })
    } catch (e: any) {
      results.push({ email: member.email, success: false, error: e.message })
    }
  }

  return { teamId: team.id, results }
}

export async function addMemberWithPassword(input: {
  teamId: string
  first_name: string
  last_name: string
  email: string
  role_id: string
  app_role: AppRole
  password: string
}) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const orgId = await getOrgId()
  if (!orgId) return { error: 'Keine Organisation gefunden' }

  const { data: existing } = await supabase
    .from('organization_members')
    .select('id')
    .eq('organization_id', orgId)
    .eq('email', input.email.trim())
    .single()

  if (existing) {
    await supabase.from('organization_members')
      .update({ team_id: input.teamId })
      .eq('id', existing.id)
    return { success: true }
  }

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: input.email.trim(),
    password: input.password,
    email_confirm: true,
    user_metadata: {
      organization_id: orgId,
      team_id: input.teamId,
      first_name: input.first_name,
      last_name: input.last_name,
    },
  })

  if (createErr || !created.user) return { error: createErr?.message ?? 'Fehler beim Anlegen' }

  const fullName = [input.first_name, input.last_name].filter(Boolean).join(' ')
  await admin.from('profiles').insert({
    id: created.user.id,
    organization_id: orgId,
    email: input.email.trim(),
    full_name: fullName,
    preferred_language: 'de',
    is_platform_admin: false,
    app_role: input.app_role ?? 'leser',
  })

  await supabase.from('organization_members').insert({
    organization_id: orgId,
    user_id: created.user.id,
    email: input.email.trim(),
    role_id: input.role_id,
    team_id: input.teamId,
    first_name: input.first_name || null,
    last_name: input.last_name || null,
    invitation_accepted_at: new Date().toISOString(),
  })

  return { success: true }
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

export async function setMemberRole(userId: string, appRole: AppRole) {
  const supabase = await createClient()
  const admin = createAdminClient()

  // Nur Admins & Superadmins dürfen Rollen ändern
  const currentRole = await getCurrentAppRole()
  if (currentRole !== 'admin' && currentRole !== 'superadmin') return { error: 'Keine Berechtigung' }

  const orgId = await getOrgId()
  if (!orgId) return { error: 'Keine Organisation' }

  // Zielnutzer laden – Superadmin darf nur von Superadmin geändert werden
  const { data: target } = await admin
    .from('profiles')
    .select('app_role')
    .eq('id', userId)
    .eq('organization_id', orgId)
    .single()

  if (target?.app_role === 'superadmin' && currentRole !== 'superadmin') {
    return { error: 'Superadmin-Rolle kann nur von einem anderen Superadmin geändert werden' }
  }

  // Normale Admins dürfen keine superadmin-Rolle vergeben
  if (appRole === 'superadmin' && currentRole !== 'superadmin') {
    return { error: 'Nur ein Superadmin darf die Superadmin-Rolle vergeben' }
  }

  const { error } = await admin
    .from('profiles')
    .update({ app_role: appRole })
    .eq('id', userId)
    .eq('organization_id', orgId)

  return { error: error?.message }
}
