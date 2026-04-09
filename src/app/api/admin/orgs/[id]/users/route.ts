import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function checkPlatformAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles').select('is_platform_admin').eq('id', user.id).single()
  if (!profile?.is_platform_admin) return null
  return user
}

// Neuen Nutzer zu einer bestehenden Organisation hinzufügen
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: orgId } = await params
  const adminUser = await checkPlatformAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

  const body = await req.json()
  const { email, fullName, tempPassword, appRole } = body

  if (!email || !tempPassword || tempPassword.length < 8) {
    return NextResponse.json({ error: 'E-Mail und Passwort (min. 8 Zeichen) erforderlich' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Org existiert?
  const { data: org } = await admin.from('organizations').select('id, name').eq('id', orgId).single()
  if (!org) return NextResponse.json({ error: 'Organisation nicht gefunden' }, { status: 404 })

  // Auth-User anlegen
  const { data: newUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  })
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

  // Profil anlegen
  const { error: profileError } = await admin.from('profiles').insert({
    id: newUser.user.id,
    organization_id: orgId,
    email,
    full_name: fullName || null,
    app_role: appRole ?? 'member',
    must_change_password: true,
  })
  if (profileError) {
    await admin.auth.admin.deleteUser(newUser.user.id)
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  // Owner-Rolle suchen (Fallback: erste Rolle der Org)
  const { data: role } = await admin
    .from('roles')
    .select('id')
    .eq('organization_id', orgId)
    .order('created_at')
    .limit(1)
    .single()

  if (role) {
    await admin.from('organization_members').insert({
      organization_id: orgId,
      user_id: newUser.user.id,
      role_id: role.id,
      email,
      invitation_accepted_at: new Date().toISOString(),
    })
  }

  await admin.from('admin_audit_log').insert({
    admin_id: adminUser.id,
    action: 'add_org_user',
    target_type: 'organization',
    target_id: orgId,
    details: { email, orgName: org.name, appRole },
  })

  return NextResponse.json({ userId: newUser.user.id })
}
