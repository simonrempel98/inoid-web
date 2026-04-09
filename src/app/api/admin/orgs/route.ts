import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  // Nur Platform-Admins
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('is_platform_admin').eq('id', user.id).single()
  if (!profile?.is_platform_admin) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

  const body = await req.json()
  const { orgName, orgSlug, plan, assetLimit, userLimit, contactEmail, notes, features, userEmail, userName, tempPassword } = body

  if (!orgName || !orgSlug || !userEmail || !tempPassword) {
    return NextResponse.json({ error: 'Pflichtfelder fehlen' }, { status: 400 })
  }

  const admin = createAdminClient()

  // 1. Organisation anlegen
  const { data: org, error: orgError } = await admin
    .from('organizations')
    .insert({
      name: orgName,
      slug: orgSlug,
      plan: plan ?? 'starter',
      asset_limit: assetLimit ?? 50,
      user_limit: userLimit ?? 10,
      contact_email: contactEmail ?? null,
      notes: notes ?? null,
      is_active: true,
      features: features ?? { serviceheft: true, wartung: true },
    })
    .select()
    .single()

  if (orgError) return NextResponse.json({ error: orgError.message }, { status: 500 })

  // 2. Supabase Auth User anlegen
  const { data: newUser, error: authError } = await admin.auth.admin.createUser({
    email: userEmail,
    password: tempPassword,
    email_confirm: true,
  })

  if (authError) {
    await admin.from('organizations').delete().eq('id', org.id)
    return NextResponse.json({ error: authError.message }, { status: 500 })
  }

  // 3. Profil erstellen – als Superadmin der Org
  const { error: profileError } = await admin
    .from('profiles')
    .insert({
      id: newUser.user.id,
      organization_id: org.id,
      email: userEmail,
      full_name: userName ?? null,
      app_role: 'superadmin',
      must_change_password: true,
    })

  if (profileError) {
    await admin.auth.admin.deleteUser(newUser.user.id)
    await admin.from('organizations').delete().eq('id', org.id)
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  // 4. Owner-Rolle für die Org anlegen und Mitglied hinzufügen
  const { data: ownerRole } = await admin
    .from('roles')
    .select('id')
    .eq('organization_id', org.id)
    .eq('name', 'Owner')
    .single()

  let roleId = ownerRole?.id
  if (!roleId) {
    const { data: createdRole } = await admin
      .from('roles')
      .insert({
        organization_id: org.id,
        name: 'Owner',
        description: 'Vollzugriff',
        permissions: { all: true },
        is_system_role: true,
      })
      .select('id')
      .single()
    roleId = createdRole?.id
  }

  if (roleId) {
    await admin.from('organization_members').insert({
      organization_id: org.id,
      user_id: newUser.user.id,
      role_id: roleId,
      email: userEmail,
      invitation_accepted_at: new Date().toISOString(),
    })
  }

  // 5. Audit Log
  await admin.from('admin_audit_log').insert({
    admin_id: user.id,
    action: 'create_org',
    target_type: 'organization',
    target_id: org.id,
    details: { name: orgName, userEmail, plan, features },
  })

  return NextResponse.json({ orgId: org.id })
}
