import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/sensors/[sensor_id]/readings?limit=50&from=ISO&to=ISO
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sensor_id: string }> }
) {
  const { sensor_id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const url = new URL(req.url)
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 200), 1000)
  const from  = url.searchParams.get('from')
  const to    = url.searchParams.get('to')

  let query = supabase
    .from('sensor_readings')
    .select('id, value, quality, recorded_at')
    .eq('sensor_id', sensor_id)
    .order('recorded_at', { ascending: false })
    .limit(limit)

  if (from) query = query.gte('recorded_at', from)
  if (to)   query = query.lte('recorded_at', to)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Chronologisch sortiert zurückgeben
  return NextResponse.json({ readings: (data ?? []).reverse() })
}
