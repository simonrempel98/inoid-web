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

// Neues Platform-Team-Mitglied anlegen
export async function POST(req: NextRequest) {
  const adminUser = await checkPlatformAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

  const body = await req.json()
  const { email, fullName, tempPassword } = body

  if (!email || !tempPassword || tempPassword.length < 8) {
    return NextResponse.json({ error: 'E-Mail und Passwort (min. 8 Zeichen) erforderlich' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Auth-User anlegen
  const { data: newUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  })
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

  // Profil anlegen – Platform Admin, keine Org
  const { error: profileError } = await admin.from('profiles').insert({
    id: newUser.user.id,
    email,
    full_name: fullName || null,
    is_platform_admin: true,
    must_change_password: true,
  })
  if (profileError) {
    await admin.auth.admin.deleteUser(newUser.user.id)
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  await admin.from('admin_audit_log').insert({
    admin_id: adminUser.id,
    action: 'create_platform_admin',
    target_type: 'user',
    target_id: newUser.user.id,
    details: { email, fullName },
  })

  return NextResponse.json({ userId: newUser.user.id })
}
