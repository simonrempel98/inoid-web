import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// DELETE /api/sensors/[sensor_id] — Sensor + alle Readings löschen
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ sensor_id: string }> }
) {
  const { sensor_id } = await params
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

  // Prüfen ob Sensor zur Org gehört
  const { data: sensor } = await supabase
    .from('sensors')
    .select('id')
    .eq('id', sensor_id)
    .eq('organization_id', profile.organization_id)
    .single()

  if (!sensor) return NextResponse.json({ error: 'Sensor nicht gefunden' }, { status: 404 })

  // Soft-delete (is_active = false) statt Hard-delete um Historien zu erhalten
  const { error } = await supabase
    .from('sensors')
    .update({ is_active: false })
    .eq('id', sensor_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

// GET /api/sensors/[sensor_id]/readings ist in readings/route.ts
