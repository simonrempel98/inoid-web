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

// Platform-Admin-Zugriff entziehen (Nutzer bleibt erhalten, verliert nur Platform-Zugang)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: targetId } = await params
  const adminUser = await checkPlatformAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

  // Sich selbst schützen
  if (targetId === adminUser.id) {
    return NextResponse.json({ error: 'Du kannst dir selbst nicht den Zugriff entziehen' }, { status: 400 })
  }

  const admin = createAdminClient()

  // is_platform_admin entfernen
  const { error } = await admin
    .from('profiles')
    .update({ is_platform_admin: false })
    .eq('id', targetId)
    .eq('is_platform_admin', true) // Nur wenn es wirklich ein Platform Admin war

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await admin.from('admin_audit_log').insert({
    admin_id: adminUser.id,
    action: 'revoke_platform_admin',
    target_type: 'user',
    target_id: targetId,
    details: {},
  })

  return NextResponse.json({ success: true })
}
