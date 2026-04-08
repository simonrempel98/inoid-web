import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles').select('is_platform_admin').eq('id', user.id).single()
  if (!profile?.is_platform_admin) return null
  return user
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: targetUserId } = await params
  const adminUser = await checkAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

  const body = await req.json()
  const { action } = body
  const admin = createAdminClient()

  if (action === 'reset_password') {
    const { newPassword } = body
    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: 'Passwort zu kurz' }, { status: 400 })
    }
    const { error } = await admin.auth.admin.updateUserById(targetUserId, { password: newPassword })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await admin.from('profiles').update({ must_change_password: true }).eq('id', targetUserId)
    await admin.from('admin_audit_log').insert({
      admin_id: adminUser.id, action: 'reset_password',
      target_type: 'user', target_id: targetUserId, details: {},
    })
    return NextResponse.json({ message: 'Passwort gesetzt, PW-Änderung erzwungen' })
  }

  if (action === 'force_pw_change') {
    await admin.from('profiles').update({ must_change_password: true }).eq('id', targetUserId)
    await admin.from('admin_audit_log').insert({
      admin_id: adminUser.id, action: 'force_pw_change',
      target_type: 'user', target_id: targetUserId, details: {},
    })
    return NextResponse.json({ message: 'PW-Änderung erzwungen' })
  }

  if (action === 'deactivate') {
    await admin.from('profiles').update({ is_active: false }).eq('id', targetUserId)
    await admin.auth.admin.updateUserById(targetUserId, { ban_duration: '876600h' })
    await admin.from('admin_audit_log').insert({
      admin_id: adminUser.id, action: 'deactivate_user',
      target_type: 'user', target_id: targetUserId, details: {},
    })
    return NextResponse.json({ message: 'Nutzer gesperrt' })
  }

  if (action === 'activate') {
    await admin.from('profiles').update({ is_active: true }).eq('id', targetUserId)
    await admin.auth.admin.updateUserById(targetUserId, { ban_duration: 'none' })
    await admin.from('admin_audit_log').insert({
      admin_id: adminUser.id, action: 'activate_user',
      target_type: 'user', target_id: targetUserId, details: {},
    })
    return NextResponse.json({ message: 'Nutzer entsperrt' })
  }

  return NextResponse.json({ error: 'Unbekannte Aktion' }, { status: 400 })
}
