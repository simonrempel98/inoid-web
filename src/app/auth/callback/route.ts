import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/assets'
  const invitationToken = searchParams.get('invitation_token')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  const user = data.user
  const adminClient = createAdminClient()

  // Prüfen ob Profile bereits existiert
  const { data: existingProfile } = await adminClient
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!existingProfile) {
    const invitedOrgId = user.user_metadata?.organization_id as string | undefined

    // Eingeladener User → bestehender Organisation zuordnen
    if (invitedOrgId) {
      const firstName = user.user_metadata?.first_name ?? ''
      const lastName  = user.user_metadata?.last_name  ?? ''
      const joined = [firstName, lastName].filter(Boolean).join(' ')
      const fullName = joined || (user.email?.split('@')[0] ?? '')

      await adminClient.from('profiles').insert({
        id: user.id,
        organization_id: invitedOrgId,
        email: user.email!,
        full_name: fullName,
        preferred_language: 'de',
        is_platform_admin: false,
      })

      // Einladung als angenommen markieren
      await adminClient
        .from('organization_members')
        .update({ invitation_accepted_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('invitation_accepted_at', null)

      return NextResponse.redirect(`${origin}/einladung/willkommen`)
    }

    // Neuer User → eigene Organisation anlegen
    const fullName = user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? ''
    const orgName = user.user_metadata?.organization_name ?? `${fullName}'s Organisation`
    const slug = orgName.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      + '-' + Date.now().toString(36)

    // Organisation anlegen
    const { data: org, error: orgError } = await adminClient
      .from('organizations')
      .insert({
        name: orgName,
        slug,
        plan: user.user_metadata?.plan ?? 'free',
        asset_limit: user.user_metadata?.plan === 'starter' ? 100
          : user.user_metadata?.plan === 'professional' ? 500
          : user.user_metadata?.plan === 'enterprise' ? 1000
          : 20,
        billing_email: user.email,
      })
      .select()
      .single()

    if (orgError || !org) {
      console.error('Org creation failed:', orgError)
      return NextResponse.redirect(`${origin}/login?error=org_creation_failed`)
    }

    // System-Rollen anlegen
    const systemRoles = [
      {
        name: 'OWNER', description: 'Vollständiger Zugriff', is_system_role: true,
        permissions: {
          'assets.view': true, 'assets.create': true, 'assets.edit': true, 'assets.delete': true, 'assets.export': true,
          'documents.view': true, 'documents.upload': true, 'documents.delete': true,
          'lifecycle.view': true, 'lifecycle.create': true, 'lifecycle.edit': true, 'lifecycle.delete': true,
          'members.view': true, 'members.invite': true, 'members.remove': true,
          'roles.view': true, 'roles.manage': true,
          'organization.settings': true,
          'billing.view': true, 'billing.manage': true,
          'api.access': true,
        }
      },
      {
        name: 'ADMIN', description: 'Alle Rechte außer Billing-Verwaltung', is_system_role: true,
        permissions: {
          'assets.view': true, 'assets.create': true, 'assets.edit': true, 'assets.delete': true, 'assets.export': true,
          'documents.view': true, 'documents.upload': true, 'documents.delete': true,
          'lifecycle.view': true, 'lifecycle.create': true, 'lifecycle.edit': true, 'lifecycle.delete': true,
          'members.view': true, 'members.invite': true, 'members.remove': true,
          'roles.view': true, 'roles.manage': true,
          'organization.settings': true,
          'billing.view': true, 'billing.manage': false,
          'api.access': true,
        }
      },
      {
        name: 'EDITOR', description: 'Assets und Serviceheft bearbeiten', is_system_role: true,
        permissions: {
          'assets.view': true, 'assets.create': true, 'assets.edit': true, 'assets.delete': false, 'assets.export': true,
          'documents.view': true, 'documents.upload': true, 'documents.delete': false,
          'lifecycle.view': true, 'lifecycle.create': true, 'lifecycle.edit': true, 'lifecycle.delete': false,
          'members.view': false, 'members.invite': false, 'members.remove': false,
          'roles.view': false, 'roles.manage': false,
          'organization.settings': false,
          'billing.view': false, 'billing.manage': false,
          'api.access': false,
        }
      },
      {
        name: 'VIEWER', description: 'Nur Lesezugriff', is_system_role: true,
        permissions: {
          'assets.view': true, 'assets.create': false, 'assets.edit': false, 'assets.delete': false, 'assets.export': false,
          'documents.view': true, 'documents.upload': false, 'documents.delete': false,
          'lifecycle.view': true, 'lifecycle.create': false, 'lifecycle.edit': false, 'lifecycle.delete': false,
          'members.view': true, 'members.invite': false, 'members.remove': false,
          'roles.view': true, 'roles.manage': false,
          'organization.settings': false,
          'billing.view': true, 'billing.manage': false,
          'api.access': false,
        }
      },
      {
        name: 'TECHNICIAN', description: 'Serviceheft-Einträge erfassen', is_system_role: true,
        permissions: {
          'assets.view': true, 'assets.create': false, 'assets.edit': false, 'assets.delete': false, 'assets.export': false,
          'documents.view': true, 'documents.upload': true, 'documents.delete': false,
          'lifecycle.view': true, 'lifecycle.create': true, 'lifecycle.edit': false, 'lifecycle.delete': false,
          'members.view': false, 'members.invite': false, 'members.remove': false,
          'roles.view': false, 'roles.manage': false,
          'organization.settings': false,
          'billing.view': false, 'billing.manage': false,
          'api.access': false,
        }
      },
    ]

    const { data: roles } = await adminClient
      .from('roles')
      .insert(systemRoles.map(r => ({ ...r, organization_id: org.id })))
      .select()

    const ownerRole = roles?.find(r => r.name === 'OWNER')

    // Profile anlegen (Org-Ersteller = Admin)
    await adminClient.from('profiles').insert({
      id: user.id,
      organization_id: org.id,
      email: user.email!,
      full_name: fullName,
      preferred_language: 'de',
      is_platform_admin: false,
      app_role: 'superadmin',
    })

    // User als OWNER eintragen
    if (ownerRole) {
      await adminClient.from('organization_members').insert({
        organization_id: org.id,
        user_id: user.id,
        role_id: ownerRole.id,
        email: user.email!,
        invitation_accepted_at: new Date().toISOString(),
      })
    }
  }

  // Einladungs-Token verarbeiten
  if (invitationToken) {
    const { data: member } = await adminClient
      .from('organization_members')
      .select('*')
      .eq('invitation_token', invitationToken)
      .single()

    if (member) {
      await adminClient.from('organization_members').update({
        user_id: user.id,
        invitation_token: null,
        invitation_accepted_at: new Date().toISOString(),
      }).eq('id', member.id)

      // Profile auf neue Org updaten falls nötig
      await adminClient.from('profiles').update({
        organization_id: member.organization_id,
      }).eq('id', user.id)
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}
