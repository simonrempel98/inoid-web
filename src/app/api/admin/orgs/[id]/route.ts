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

// Löscht alle Dateien in einem Storage-Bucket mit gegebenem Pfad-Prefix
async function deleteStorageFolder(admin: ReturnType<typeof createAdminClient>, bucket: string, prefix: string) {
  const { data: files } = await admin.storage.from(bucket).list(prefix, { limit: 1000 })
  if (files && files.length > 0) {
    const paths = files.map(f => `${prefix}/${f.name}`)
    await admin.storage.from(bucket).remove(paths)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await checkAdmin()
  if (!user) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

  const body = await req.json()
  const { name, plan, assetLimit, userLimit, isActive, contactEmail, notes, features, settings } = body

  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Record<string, any> = { updated_at: new Date().toISOString() }
  if (name !== undefined)        updateData.name = name
  if (plan !== undefined)        updateData.plan = plan
  if (assetLimit !== undefined)  updateData.asset_limit = assetLimit
  if (userLimit !== undefined)   updateData.user_limit = userLimit
  if (isActive !== undefined)    updateData.is_active = isActive
  if (contactEmail !== undefined) updateData.contact_email = contactEmail ?? null
  if (notes !== undefined)       updateData.notes = notes ?? null
  if (features !== undefined)    updateData.features = features
  if (settings !== undefined)    updateData.settings = settings

  const { error } = await admin
    .from('organizations')
    .update(updateData)
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

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await checkAdmin()
  if (!user) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

  const admin = createAdminClient()

  // 1. Org-Name + alle Asset-IDs + alle User-IDs laden
  const [{ data: org }, { data: assets }, { data: profiles }] = await Promise.all([
    admin.from('organizations').select('name').eq('id', id).single(),
    admin.from('assets').select('id').eq('organization_id', id),
    admin.from('profiles').select('id').eq('organization_id', id),
  ])

  if (!org) return NextResponse.json({ error: 'Organisation nicht gefunden' }, { status: 404 })

  const assetIds = (assets ?? []).map(a => a.id)

  // 2. Storage-Dateien löschen (best effort – alle 3 Buckets)
  const BUCKETS = ['asset-images', 'service-files', 'org-files']
  await Promise.allSettled(
    assetIds.flatMap(assetId =>
      BUCKETS.map(bucket => deleteStorageFolder(admin, bucket, `assets/${assetId}`))
    )
  )

  // 3. FK-Constraint lösen: organization_id in profiles auf null setzen
  await admin.from('profiles').update({ organization_id: null }).eq('organization_id', id)

  // 4. Auth-User löschen (best effort)
  await Promise.allSettled(
    (profiles ?? []).map(p => admin.auth.admin.deleteUser(p.id))
  )

  // 5. Organisation löschen
  //    → assets, roles, organization_members, invoices cascaden
  //    → asset_lifecycle_events, asset_documents, maintenance_schedules cascaden (via asset_id)
  const { error: deleteError } = await admin
    .from('organizations')
    .delete()
    .eq('id', id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  // 6. Audit-Log (eigene Session – nicht gelöscht)
  await admin.from('admin_audit_log').insert({
    admin_id: user.id,
    action: 'delete_org',
    target_type: 'organization',
    target_id: id,
    details: { name: org.name, assetCount: assetIds.length, userCount: (profiles ?? []).length },
  })

  return NextResponse.json({ success: true })
}
