import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/assets/[id]/sensors — alle Sensoren + letzter Messwert
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: assetId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const { data: sensors, error } = await supabase
    .from('sensors')
    .select('*')
    .eq('asset_id', assetId)
    .eq('is_active', true)
    .order('created_at')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ sensors: sensors ?? [] })
}

// POST /api/assets/[id]/sensors — neuen Sensor anlegen
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: assetId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) {
    return NextResponse.json({ error: 'Keine Organisation' }, { status: 403 })
  }

  // Sicherstellen dass Asset zur gleichen Org gehört
  const { data: asset } = await supabase
    .from('assets')
    .select('id')
    .eq('id', assetId)
    .eq('organization_id', profile.organization_id)
    .single()

  if (!asset) return NextResponse.json({ error: 'Asset nicht gefunden' }, { status: 404 })

  const { name, type, unit } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name erforderlich' }, { status: 400 })

  const { data: sensor, error } = await supabase
    .from('sensors')
    .insert({
      asset_id: assetId,
      organization_id: profile.organization_id,
      name: name.trim(),
      type: type ?? 'generic',
      unit: unit ?? '',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ sensor })
}
