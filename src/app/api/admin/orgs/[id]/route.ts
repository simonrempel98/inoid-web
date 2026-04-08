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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await checkAdmin()
  if (!user) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

  const body = await req.json()
  const { name, plan, assetLimit, userLimit, isActive, contactEmail, notes } = body

  const admin = createAdminClient()
  const { error } = await admin
    .from('organizations')
    .update({
      name,
      plan,
      asset_limit: assetLimit,
      user_limit: userLimit,
      is_active: isActive,
      contact_email: contactEmail ?? null,
      notes: notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await admin.from('admin_audit_log').insert({
    admin_id: user.id,
    action: 'update_org',
    target_type: 'organization',
    target_id: id,
    details: { name, plan },
  })

  return NextResponse.json({ success: true })
}
