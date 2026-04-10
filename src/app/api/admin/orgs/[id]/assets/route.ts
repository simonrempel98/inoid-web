import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles').select('is_platform_admin').eq('id', user.id).single()
  return profile?.is_platform_admin ? user : null
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orgId } = await params
  const user = await checkAdmin()
  if (!user) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

  const body = await req.json()
  const {
    assetId, title, articleNumber, serialNumber, orderNumber,
    category, manufacturer, location, locationRef, description,
    status, technicalData, commercialData, imageUrls, documentUrls, qrCode,
  } = body

  if (!title?.trim()) return NextResponse.json({ error: 'Titel erforderlich' }, { status: 400 })

  const admin = createAdminClient()

  const { data: asset, error } = await admin
    .from('assets')
    .insert({
      id: assetId,
      organization_id: orgId,
      title: title.trim(),
      article_number: articleNumber || null,
      serial_number: serialNumber || null,
      order_number: orderNumber || null,
      category: category || null,
      manufacturer: manufacturer || null,
      location: location || null,
      location_ref: locationRef || null,
      description: description || null,
      status: status ?? 'active',
      technical_data: technicalData ?? {},
      commercial_data: commercialData ?? {},
      image_urls: imageUrls?.length ? imageUrls : null,
      document_urls: documentUrls?.length ? documentUrls : null,
      qr_code: qrCode || null,
      nfc_uid: assetId,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await admin.from('admin_audit_log').insert({
    admin_id: user.id,
    action: 'create_asset',
    target_type: 'asset',
    target_id: asset.id,
    details: { org_id: orgId, title },
  })

  return NextResponse.json({ success: true, assetId: asset.id })
}
